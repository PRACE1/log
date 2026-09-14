import { Hono } from 'hono'
import { REDDIT_MESSAGES, REDDIT_THREADS } from './mock'
import type { ChatMessage } from '../types'

export const redditMessagingApp = new Hono()
  .get('/threads', (c) => c.json({ threads: REDDIT_THREADS }))
  .get('/threads/:threadId/messages', (c) => {
    const threadId = c.req.param('threadId')
    const messages = REDDIT_MESSAGES[threadId]
    if (!messages) return c.json({ error: 'Thread not found' }, 404)
    return c.json({ threadId, messages })
  })
  .post('/threads/:threadId/messages', async (c) => {
    const threadId = c.req.param('threadId')
    const messages = REDDIT_MESSAGES[threadId]
    const thread = REDDIT_THREADS.find((t) => t.id === threadId)
    if (!messages || !thread) return c.json({ error: 'Thread not found' }, 404)
    const body = await c.req.json<{ body?: string; image?: string }>().catch(() => ({}))
    const text = (body.body ?? '').trim()
    if (!text && !body.image) return c.json({ error: 'Message body or image required' }, 400)
    const message: ChatMessage = {
      id: `${threadId}-m${Date.now()}`,
      threadId,
      from: 'me',
      body: text,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...(body.image && { image: body.image })
    }
    messages.push(message)
    thread.preview = text || 'Photo'
    thread.updatedAt = message.sentAt
    return c.json({ threadId, message }, 201)
  })
