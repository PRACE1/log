import { Hono } from 'hono'
import { REDDIT_MESSAGES, REDDIT_THREADS } from './mock'

export const redditMessagingApp = new Hono()
  .get('/threads', (c) => c.json({ threads: REDDIT_THREADS }))
  .get('/threads/:threadId/messages', (c) => {
    const threadId = c.req.param('threadId')
    const messages = REDDIT_MESSAGES[threadId]
    if (!messages) return c.json({ error: 'Thread not found' }, 404)
    return c.json({ threadId, messages })
  })
