import { Hono } from 'hono'
import { communitiesApp, type CommunityJoinState } from '../communities'
import type { ConnectionPlatform } from '../connections'
import { keywordId, SEED_KEYWORDS } from './mock'
import type { CreateKeywordInput, Keyword } from './types'
import { isArray, isRecord, loadPersistedState, savePersistedState } from '../persist'

const KEYWORDS_KEY = 'keywords'

function isKeywordArray(value: unknown): value is Keyword[] {
  return (
    isArray(value) &&
    value.every((row) => isRecord(row) && typeof (row as { id?: unknown }).id === 'string')
  )
}

/**
 * In-memory keyword store. Seeds from SEED_KEYWORDS; every route validates
 * the platform ↔ group relation before writing:
 *  - facebook / reddit keywords must be scoped to a joined community
 *  - x keywords are word-based and must carry no group
 * Persisted to localStorage on every write and rehydrated on load, so
 * creates, edits, pauses and deletes survive a refresh.
 */
let keywords: Keyword[] = loadPersistedState(KEYWORDS_KEY, isKeywordArray) ?? [...SEED_KEYWORDS]

function persistKeywords(): void {
  savePersistedState(KEYWORDS_KEY, keywords)
}

/** Accepted communities for a platform, straight from the communities app. */
async function joinedGroupsFor(platform: ConnectionPlatform) {
  const res = await communitiesApp.request(`/communities?platform=${platform}`)
  if (!res.ok) return []
  const body = (await res.json()) as { communities: Array<{ id: string; joinState: CommunityJoinState }> }
  return body.communities.filter((community) => community.joinState === 'accepted')
}

export const keywordsApp = new Hono()
  .get('/keywords', (c) => {
    const platform = c.req.query('platform') as ConnectionPlatform | undefined
    const groupId = c.req.query('groupId')
    const noGroup = c.req.query('noGroup') === 'true'
    let all = keywords
    if (platform) all = all.filter((keyword) => keyword.platform === platform)
    if (groupId !== undefined) all = all.filter((keyword) => keyword.groupId === groupId)
    else if (noGroup) all = all.filter((keyword) => keyword.groupId === null)
    return c.json({ keywords: [...all] })
  })
  .post('/keywords', async (c) => {
    const body = await c.req.json<CreateKeywordInput>().catch(() => null)
    if (!body) return c.json({ error: 'Invalid request body' }, 400)
    const phrase = (body.phrase ?? '').trim()
    if (!phrase) return c.json({ error: 'A keyword needs a phrase' }, 400)
    if (body.platform !== 'facebook' && body.platform !== 'x' && body.platform !== 'reddit') {
      return c.json({ error: 'platform must be facebook, x, or reddit' }, 400)
    }
    const record: Keyword = {
      id: keywordId(),
      phrase,
      platform: body.platform,
      status: 'listening',
      signalsCount: 0,
      addedAt: new Date().toISOString(),
      groupId: body.groupId
    }
    // X is word-based: keywords are the unit, there is no group to scope them under.
    if (body.platform === 'x') {
      if (body.groupId) return c.json({ error: 'X keywords are word-based and have no group' }, 400)
    } else {
      // facebook / reddit: the group relation must exist and be joined.
      const joined = await joinedGroupsFor(body.platform)
      if (!body.groupId || !joined.some((group) => group.id === body.groupId)) {
        return c.json(
          { error: `${body.platform === 'facebook' ? 'Facebook' : 'Reddit'} keywords must be scoped to a joined group` },
          400
        )
      }
    }
    // Duplicates within the same scope (phrase, case-insensitive) are rejected.
    const dupe = keywords.find(
      (existing) =>
        existing.platform === record.platform &&
        existing.groupId === record.groupId &&
        existing.phrase.toLowerCase() === record.phrase.toLowerCase()
    )
    if (dupe) return c.json({ error: 'That keyword already exists in this group' }, 409)
    keywords = [...keywords, record]
    persistKeywords()
    return c.json({ keyword: record, keywords: [...keywords] }, 201)
  })
  .patch('/keywords/:id', async (c) => {
    // The body is the form's shape: phrase, scope and status may all move
    // in one save. Platform is fixed — a keyword never changes platform.
    const id = c.req.param('id')
    const body = await c.req.json<Partial<Keyword>>().catch(() => null)
    const existing = keywords.find((keyword) => keyword.id === id)
    if (!existing || !body) return c.json({ error: 'Keyword not found' }, 404)
    const phrase = body.phrase !== undefined ? body.phrase.trim() : existing.phrase
    if (!phrase) return c.json({ error: 'A keyword needs a phrase' }, 400)
    const status = body.status ?? existing.status
    if (status !== 'listening' && status !== 'paused') {
      return c.json({ error: 'status must be listening or paused' }, 400)
    }
    const groupId = body.groupId !== undefined ? body.groupId : existing.groupId
    if (existing.platform === 'x') {
      if (groupId) return c.json({ error: 'X keywords are word-based and have no group' }, 400)
    } else {
      const joined = await joinedGroupsFor(existing.platform)
      if (!groupId || !joined.some((group) => group.id === groupId)) {
        return c.json(
          { error: `${existing.platform === 'facebook' ? 'Facebook' : 'Reddit'} keywords must be scoped to a joined group` },
          400
        )
      }
    }
    // Duplicates within the same scope, excluding the row itself — saving a
    // record unchanged must never 409 against itself.
    const dupe = keywords.find(
      (other) =>
        other.id !== id &&
        other.platform === existing.platform &&
        other.groupId === groupId &&
        other.phrase.toLowerCase() === phrase.toLowerCase()
    )
    if (dupe) return c.json({ error: 'That keyword already exists in this group' }, 409)
    const next: Keyword = { ...existing, phrase, groupId, status }
    keywords = keywords.map((keyword) => (keyword.id === id ? next : keyword))
    persistKeywords()
    return c.json({ keyword: next, keywords: [...keywords] })
  })
  .delete('/keywords/:id', (c) => {
    const id = c.req.param('id')
    keywords = keywords.filter((keyword) => keyword.id !== id)
    persistKeywords()
    return c.json({ keywords: [...keywords] })
  })

export type KeywordsApp = typeof keywordsApp