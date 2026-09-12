import { Hono } from 'hono'
import { MOCK_FEED_ITEMS } from './mock'

/**
 * Hono-shaped feed API. Backed by mock rows for now — when the real backend
 * lands, point the client at it; routes and response shapes stay the same.
 */
export const feedApp = new Hono()
  .get('/feed', (c) => c.json({ items: MOCK_FEED_ITEMS }))
  .get('/feed/:platform', (c) => {
    const platform = c.req.param('platform')
    return c.json({ items: MOCK_FEED_ITEMS.filter((item) => item.platform === platform) })
  })

export type FeedApp = typeof feedApp
