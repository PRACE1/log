import { Hono } from 'hono'
import { facebookMessagingApp } from './facebook/server'
import { twitterMessagingApp } from './twitter/server'
import { redditMessagingApp } from './reddit/server'
import type { MessagesResponse, MessagingPlatform, ThreadsResponse } from './types'

export * from './types'

/**
 * Hono-shaped messaging API, mirroring lib/feed. Mock-backed for now —
 * when the real backend lands, point these clients at it; routes and
 * response shapes stay the same.
 */
export const messagingApp = new Hono()
  .route('/facebook', facebookMessagingApp)
  .route('/twitter', twitterMessagingApp)
  .route('/reddit', redditMessagingApp)

export type MessagingApp = typeof messagingApp

const PLATFORMS: MessagingPlatform[] = ['facebook', 'twitter', 'reddit']

/** All threads across platforms. */
export async function getThreads(): Promise<ThreadsResponse> {
  const responses = await Promise.all(PLATFORMS.map((platform) => messagingApp.request(`/${platform}/threads`)))
  for (const res of responses) {
    if (!res.ok) throw new Error(`Threads request failed (${res.status})`)
  }
  const lists = await Promise.all(responses.map((res) => res.json() as Promise<ThreadsResponse>))
  return { threads: lists.flatMap((list) => list.threads) }
}

export async function getThreadMessages(platform: MessagingPlatform, threadId: string): Promise<MessagesResponse> {
  const res = await messagingApp.request(`/${platform}/threads/${threadId}/messages`)
  if (!res.ok) throw new Error(`Messages request failed (${res.status})`)
  return (await res.json()) as MessagesResponse
}
