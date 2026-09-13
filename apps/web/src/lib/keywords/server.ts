import { Hono } from 'hono'
import { communitiesApp } from '../communities'
import type { ConnectionPlatform } from '../connections'
import { keywordId, SEED_KEYWORDS } from './mock'
import type { CreateKeywordInput, Keyword } from './types'

/**
 * In-memory keyword store. Seeds from SEED_KEYWORDS; every route validates
 * the platform ↔ group relation before writing:
 *  - facebook / reddit keywords must be scoped to a joined community
 *  - x keywords are word-based and must carry no group
 */
let keywords: Keyword[] = [...SEED_KEYWORDS]

/** Joined communities for a platform, straight from the communities app. */
async function joinedGroupsFor(platform: ConnectionPlatform) {
  const res = await communitiesApp.request(`/communities?platform=${platform}`)
  if (!res.ok) return []
  const body = (await res.json()) as { communities: Array<{ id: string; joined: boolean }> }
  return body.communities.filter((community) => community.joined)
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
    return c.json({ keyword: record, keywords: [...keywords] }, 201)
  })
  .patch('/keywords/:id', async (c) => {
    const id = c.req.param('id')
    const body = await c.req.json<Partial<Keyword>>().catch(() => null)
    const existing = keywords.find((keyword) => keyword.id === id)
    if (!existing || !body) return c.json({ error: 'Keyword not found' }, 404)
    const next: Keyword = { ...existing, ...body, id: existing.id, platform: existing.platform }
    // Status is the only field a saved keyword may change.
    keywords = keywords.map((keyword) => (keyword.id === id ? { ...keyword, status: next.status } : keyword))
    return c.json({ keywords: [...keywords] })
  })
  .delete('/keywords/:id', (c) => {
    const id = c.req.param('id')
    keywords = keywords.filter((keyword) => keyword.id !== id)
    return c.json({ keywords: [...keywords] })
  })

export type KeywordsApp = typeof keywordsApp