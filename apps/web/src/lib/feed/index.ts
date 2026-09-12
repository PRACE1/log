import { feedApp } from './server'
import type { FeedResponse } from './mock'

export * from './mock'
export { feedApp, type FeedApp } from './server'

/** Fetch the feed through the Hono app (in-memory mock for now). */
export async function getFeed(platform?: string): Promise<FeedResponse> {
  const res = await feedApp.request(platform ? `/feed/${platform}` : '/feed')
  if (!res.ok) throw new Error(`Feed request failed (${res.status})`)
  return (await res.json()) as FeedResponse
}
