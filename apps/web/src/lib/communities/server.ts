import { Hono } from 'hono'
import { MOCK_CONNECTIONS } from '../connections/mock'
import type { ConnectionPlatform } from '../connections'
import {
  COMMUNITIES_BASE,
  communityFromGroupUrl,
  communityFromSubreddit,
  parseFacebookGroupUrl,
  parseSubredditName,
  resolveAccountLabel,
  SEED_JOINED,
} from './mock'
import type { Community, CommunityJoinState } from './types'
import { isArray, isRecord, loadPersistedState, savePersistedState } from '../persist'

/**
 * In-memory join relation for the communities API. Membership is the only
 * mutable state; the seed catalog never changes, but pasted group links can
 * register new rows (the stand-in for the facebook client resolving an
 * unknown group URL).
 *
 * A join request moves `none → pending → accepted`. `pending` is the
 * "waiting on the group to accept you" path; `accepted` is a real member.
 * Leaving (DELETE) returns the row to `none`.
 */
type BaseCommunity = (typeof COMMUNITIES_BASE)[number]

type JoinState = { state: CommunityJoinState; accountId: string | null; answers: string[] }

const CATALOG_KEY = 'communities.catalog'
const JOINS_KEY = 'communities.joins'

function isBaseCommunityArray(value: unknown): value is BaseCommunity[] {
  return (
    isArray(value) &&
    value.every(
      (row) =>
        isRecord(row) &&
        typeof row.id === 'string' &&
        typeof row.platform === 'string' &&
        typeof row.name === 'string'
    )
  )
}

function isJoinStateRecord(value: unknown): value is Record<string, JoinState> {
  if (!isRecord(value)) return false
  return Object.values(value).every(
    (row) =>
      isRecord(row) &&
      (row.state === 'none' || row.state === 'pending' || row.state === 'accepted') &&
      (row.accountId === null || typeof row.accountId === 'string') &&
      isArray(row.answers) &&
      row.answers.every((answer) => typeof answer === 'string')
  )
}

/**
 * The catalog starts with the seeds plus any client-resolved rows from a
 * previous session; the joins map likewise rehydrates. Both persist on
 * every mutation below, so joins, answers and resolved groups survive a
 * refresh instead of resetting to seeds.
 */
const catalog: BaseCommunity[] =
  loadPersistedState(CATALOG_KEY, isBaseCommunityArray) ?? [...COMMUNITIES_BASE]

function createJoinState(): Record<string, JoinState> {
  const state: Record<string, JoinState> = {}
  for (const community of catalog)
    state[community.id] = { state: 'none', accountId: null, answers: [] }
  for (const seed of SEED_JOINED) {
    if (state[seed.id]) state[seed.id] = { state: seed.state, accountId: seed.accountId, answers: [] }
  }
  return state
}

const joins: Record<string, JoinState> =
  loadPersistedState(JOINS_KEY, isJoinStateRecord) ?? createJoinState()

function persistCommunities(): void {
  savePersistedState(CATALOG_KEY, catalog)
  savePersistedState(JOINS_KEY, joins)
}

function findBaseById(id: string): BaseCommunity | undefined {
  return catalog.find((row) => row.id === id)
}

function findBaseByUrl(url: string): BaseCommunity | undefined {
  return catalog.find((row) => row.url === url)
}

/** Register a client-resolved row (pasted link, typed subreddit, …). */
function registerRow(row: BaseCommunity): BaseCommunity {
  let id = row.id
  let suffix = 2
  while (catalog.some((existing) => existing.id === id)) {
    id = `${row.id}-${suffix}`
    suffix += 1
  }
  const registered: BaseCommunity = { ...row, id }
  catalog.push(registered)
  joins[registered.id] = { state: 'none', accountId: null, answers: [] }
  return registered
}

/** Register a pasted group link as a tracked community (mock resolution). */
function registerBase(parsed: { slug: string; url: string }): BaseCommunity {
  return registerRow(communityFromGroupUrl(parsed))
}

function findRedditBase(key: string, url: string): BaseCommunity | undefined {
  const lowerUrl = url.toLowerCase()
  return catalog.find(
    (row) =>
      row.platform === 'reddit' &&
      (row.url?.toLowerCase() === lowerUrl || row.handle.toLowerCase() === `r/${key}`)
  )
}

function materialize(id?: string): Community | Community[] {
  const all: Community[] = catalog.map((base) => {
    const state = joins[base.id]
    // The account relation only exists for facebook — subreddits and X
    // communities are joined without an account.
    const accountId =
      base.platform === 'facebook' && state?.state !== 'none' ? (state.accountId ?? null) : null
    return {
      ...base,
      joinState: state?.state ?? 'none',
      accountId,
      accountLabel: resolveAccountLabel(accountId),
      answers: state?.answers ?? [],
    }
  })
  return id ? (all.find((community) => community.id === id) ?? []) : all
}

/**
 * Shared join transition for both routes below: facebook entry gates on a
 * connected account (→ pending), other platforms accept immediately.
 * Returns the error payload or the id to materialize.
 */
async function transitionToJoined(
  base: BaseCommunity,
  body: { accountId?: string; answers?: string[] } | null
): Promise<{ error: string; status: 400 } | { ok: true }> {
  if (base.platform === 'facebook') {
    const account =
      (body?.accountId ? MOCK_CONNECTIONS.find((a) => a.id === body.accountId) : undefined) ?? null
    if (!account || account.platform !== 'facebook') {
      return { error: 'Facebook groups must be joined with a connected Facebook account', status: 400 }
    }
    // Entry questions gate the request — every one needs an answer.
    const answers = Array.isArray(body?.answers) ? body.answers.map(String) : []
    if (
      base.entryQuestions.length > 0 &&
      (answers.length !== base.entryQuestions.length || answers.some((answer) => answer.trim() === ''))
    ) {
      return { error: 'Answer all entry questions to request to join', status: 400 }
    }
    joins[base.id].accountId = account.id
    joins[base.id].answers = answers.map((answer) => answer.trim())
    // Facebook gates entry — the request waits for the group to accept.
    joins[base.id].state = 'pending'
  } else {
    // Subreddits and X don't gate entry — the request is accepted immediately.
    joins[base.id].state = 'accepted'
  }
  persistCommunities()
  return { ok: true }
}

/**
 * Hono-shaped communities API. Mock-backed for now — the real endpoints come
 * from the platform clients (facebook group joins via connected accounts).
 * Routes and response shapes stay the same when the backend lands.
 */
export const communitiesApp = new Hono()
  .get('/communities', (c) => {
    const platform = c.req.query('platform') as ConnectionPlatform | undefined
    const all = materialize() as Community[]
    const communities = platform ? all.filter((community) => community.platform === platform) : all
    return c.json({ communities })
  })
  .post('/communities/:id/join', async (c) => {
    const id = c.req.param('id')
    const base = findBaseById(id)
    if (!base) return c.json({ error: 'Community not found' }, 404)
    const existing = joins[id]
    if (existing?.state !== 'none') {
      // Already pending or accepted — joining again is a no-op.
      return c.json({ community: materialize(id) as Community, communities: materialize() as Community[] })
    }
    const body = await c.req.json<{ accountId?: string }>().catch(() => null)
    const transition = await transitionToJoined(base, body)
    if ('error' in transition) return c.json({ error: transition.error }, transition.status)
    const communities = materialize() as Community[]
    return c.json({ community: communities.find((community) => community.id === id)!, communities }, 201)
  })
  .post('/communities/join-by-url', async (c) => {
    const body = await c.req.json<{ url?: string; accountId?: string; answers?: string[] }>().catch(() => null)
    const parsed = body?.url ? parseFacebookGroupUrl(body.url) : null
    if (!parsed) {
      return c.json({ error: 'That does not look like a Facebook group link (facebook.com/groups/…)' }, 400)
    }
    const base = findBaseByUrl(parsed.url) ?? registerBase(parsed)
    const existing = joins[base.id]
    if (existing?.state !== 'none') {
      // Already tracked and requested — surface it instead of duplicating.
      return c.json({ community: materialize(base.id) as Community, communities: materialize() as Community[] })
    }
    const transition = await transitionToJoined(base, body)
    if ('error' in transition) return c.json({ error: transition.error }, transition.status)
    const communities = materialize() as Community[]
    return c.json({ community: communities.find((community) => community.id === base.id)!, communities }, 201)
  })
  .post('/communities/resolve', async (c) => {
    // Resolve a pasted group link into its catalog row (registering it when
    // unseen) WITHOUT changing join state — the form reads the entry
    // questions off this before the user answers and joins.
    const body = await c.req.json<{ url?: string }>().catch(() => null)
    const parsed = body?.url ? parseFacebookGroupUrl(body.url) : null
    if (!parsed) {
      return c.json({ error: 'That does not look like a Facebook group link (facebook.com/groups/…)' }, 400)
    }
    const base = findBaseByUrl(parsed.url) ?? registerBase(parsed)
    // Resolve can register a row without joining — persist the catalog too.
    persistCommunities()
    return c.json({ community: materialize(base.id) as Community })
  })
  .post('/communities/resolve-reddit', async (c) => {
    // Resolve a typed subreddit into its community and join it on the spot:
    // subreddits don't gate entry, so a resolved row is immediately accepted
    // and usable as a keyword scope. Already-tracked rows are a no-op.
    const body = await c.req.json<{ name?: string }>().catch(() => null)
    const parsed = body?.name ? parseSubredditName(body.name) : null
    if (!parsed) {
      return c.json({ error: 'That does not look like a subreddit (r/name)' }, 400)
    }
    const base =
      findRedditBase(parsed.key, parsed.url) ?? registerRow(communityFromSubreddit(parsed))
    const state = joins[base.id]
    if (state && state.state === 'none') state.state = 'accepted'
    persistCommunities()
    return c.json({ community: materialize(base.id) as Community })
  })
  .post('/communities/:id/accept', (c) => {
    const id = c.req.param('id')
    const base = findBaseById(id)
    if (!base) return c.json({ error: 'Community not found' }, 404)
    const existing = joins[id]
    if (!existing || existing.state === 'none') {
      return c.json({ error: 'No join request to accept' }, 400)
    }
    if (existing.state === 'pending') existing.state = 'accepted'
    persistCommunities()
    const communities = materialize() as Community[]
    return c.json({ community: communities.find((community) => community.id === id)!, communities })
  })
  .delete('/communities/:id', (c) => {
    const id = c.req.param('id')
    if (!findBaseById(id)) return c.json({ error: 'Community not found' }, 404)
    joins[id] = { state: 'none', accountId: null, answers: [] }
    persistCommunities()
    return c.json({ communities: materialize() as Community[] })
  })

export type CommunitiesApp = typeof communitiesApp