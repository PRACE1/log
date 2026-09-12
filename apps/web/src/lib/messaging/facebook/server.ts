import { Hono } from 'hono'
import { FACEBOOK_MESSAGES, FACEBOOK_THREADS } from './mock'

export const facebookMessagingApp = new Hono()
  .get('/threads', (c) => c.json({ threads: FACEBOOK_THREADS }))
  .get('/threads/:threadId/messages', (c) => {
    const threadId = c.req.param('threadId')
    const messages = FACEBOOK_MESSAGES[threadId]
    if (!messages) return c.json({ error: 'Thread not found' }, 404)
    return c.json({ threadId, messages })
  })
