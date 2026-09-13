import { keywordsApp } from './server'
import type { CreateKeywordInput, Keyword, KeywordsResponse } from './types'
import type { ConnectionPlatform } from '../connections'

export type { Keyword, KeywordStatus } from './types'
export type { CreateKeywordInput } from './types'
export { keywordsApp, type KeywordsApp } from './server'
export { SEED_KEYWORDS } from './mock'

async function request(path: string, init?: RequestInit): Promise<Response> {
  return keywordsApp.request(path, init)
}

/**
 * All keyword reads and writes flow through the keywords Hono app — the
 * same route surface the platform clients will expose, so swapping the mock
 * for the live backend is a transport change only.
 */

export interface GetKeywordsParams {
  platform?: ConnectionPlatform
  /** Scope to one group; pass `null` for group-less (X) keywords. */
  groupId?: string | null
}

/** List keywords, optionally filtered, through `GET /keywords`. */
export async function getKeywords(params?: GetKeywordsParams): Promise<Keyword[]> {
  const query = new URLSearchParams()
  if (params?.platform) query.set('platform', params.platform)
  if (params && params.groupId !== undefined) {
    if (params.groupId === null) query.set('noGroup', 'true')
    else query.set('groupId', params.groupId)
  }
  const suffix = query.toString() ? `?${query.toString()}` : ''
  const res = await request(`/keywords${suffix}`)
  if (!res.ok) throw new Error(`Keywords request failed (${res.status})`)
  const body = (await res.json()) as KeywordsResponse
  return body.keywords
}

/**
 * Add a keyword through `POST /keywords`.
 * Facebook / reddit need the group relation; X keywords pass `groupId: null`.
 */
export async function createKeyword(input: {
  phrase: string
  platform: ConnectionPlatform
  groupId?: string | null
}): Promise<Keyword> {
  const res = await request('/keywords', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...input, groupId: input.groupId ?? null } satisfies CreateKeywordInput),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Could not add the keyword (${res.status})`)
  }
  const body = (await res.json()) as { keyword: Keyword }
  return body.keyword
}

/** Upsert one keyword (status toggle) through `PATCH /keywords/:id`. */
export async function saveKeyword(record: Keyword): Promise<Keyword[]> {
  const res = await request(`/keywords/${record.id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(record),
  })
  if (!res.ok) throw new Error(`Could not save the keyword (${res.status})`)
  const body = (await res.json()) as KeywordsResponse
  return body.keywords
}

/** Delete a keyword through `DELETE /keywords/:id`. */
export async function deleteKeyword(id: string): Promise<Keyword[]> {
  const res = await request(`/keywords/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Could not delete the keyword (${res.status})`)
  const body = (await res.json()) as KeywordsResponse
  return body.keywords
}