import { Hono } from 'hono'
import { MOCK_CONNECTIONS } from './mock'
import type { ConnectionPlatform, ConnectionRecord } from './types'

/**
 * Hono-shaped connections API. In-memory mock backed by MOCK_CONNECTIONS —
 * the real endpoints come from the camoufox clients (facebook-camofox-client
 * & co.) and the accounts service; when that backend lands, point the client
 * at it. Routes and response shapes stay the same, and this is the only
 * place account CRUD is allowed to flow.
 */
const accounts: ConnectionRecord[] = [...MOCK_CONNECTIONS]

export const connectionsApp = new Hono()
  .get('/accounts', (c) => c.json({ accounts: [...accounts] }))
  .post('/accounts', async (c) => {
    const body = await c.req.json<{ platform?: string }>().catch(() => null)
    const platform = body?.platform
    if (platform !== 'facebook' && platform !== 'x' && platform !== 'reddit') {
      return c.json({ error: 'platform must be facebook, x, or reddit' }, 400)
    }
    const record: ConnectionRecord = {
      id: `account-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      platform: platform as ConnectionPlatform,
      label: platform === 'facebook' ? 'Facebook' : platform === 'x' ? 'X' : 'Reddit',
      viaProxy: false,
      connectedAt: null
    }
    accounts.push(record)
    return c.json({ account: record, accounts: [...accounts] }, 201)
  })
  .patch('/accounts/:accountId', async (c) => {
    const body = await c.req.json<ConnectionRecord>().catch(() => null)
    const index = accounts.findIndex((a) => a.id === c.req.param('accountId'))
    if (index === -1 || !body) return c.json({ error: 'Account not found' }, 404)
    accounts[index] = {
      ...accounts[index],
      ...body,
      id: accounts[index].id
    }
    return c.json({ accounts: [...accounts] })
  })
  .delete('/accounts/:accountId', (c) => {
    const index = accounts.findIndex((a) => a.id === c.req.param('accountId'))
    if (index === -1) return c.json({ error: 'Account not found' }, 404)
    accounts.splice(index, 1)
    return c.json({ accounts: [...accounts] })
  })

export type ConnectionsApp = typeof connectionsApp