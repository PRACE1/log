import { Hono } from 'hono'
import { TWITTER_MESSAGES, TWITTER_THREADS } from './mock'

export const twitterMessagingApp = new Hono()
  .get('/threads', (c) => c.json({ threads: TWITTER_THREADS }))
  .get('/threads/:threadId/messages', (c) => {
    const threadId = c.req.param('threadId')
    const messages = TWITTER_MESSAGES[threadId]
    if (!messages) return c.json({ error: 'Thread not found' }, 404)
    return c.json({ threadId, messages })
  })
