import type { ConnectInput, ConnectionRecord } from './types'
import { assertCookie } from './cookie'
import { normalizeProxy } from './proxy'
import { findAccount, platformLabel, removeAccount, saveAccount } from './store'

export type {
  ConnectInput,
  ConnectionPlatform,
  ConnectionRecord,
  ConnectionStatus,
} from './types'
export {
  addAccount,
  findAccount,
  loadAccounts,
  platformLabel,
  removeAccount,
  saveAccount,
} from './store'

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const id = window.setTimeout(() => resolve(), ms)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(id)
        reject(new DOMException('Connection cancelled.', 'AbortError'))
      },
      { once: true },
    )
  })
}

/**
 * Dry-run validation of the cookie + proxy without persisting anything.
 * Throws on invalid input; aborts via signal.
 */
export async function testConnection(
  input: ConnectInput,
  signal?: AbortSignal,
): Promise<{ ok: true; viaProxy: boolean }> {
  assertCookie(input.cookie)
  const proxy = normalizeProxy(input.proxy)
  await delay(800, signal)
  if (signal?.aborted) throw new DOMException('Test cancelled.', 'AbortError')
  return { ok: true, viaProxy: proxy !== undefined }
}

/**
 * Validate the cookie + proxy, run the handshake, persist the connection.
 * Throws on invalid input; aborts via signal.
 */
export async function connectAccount(
  input: ConnectInput,
  signal?: AbortSignal,
): Promise<ConnectionRecord> {
  assertCookie(input.cookie)
  const proxy = normalizeProxy(input.proxy)
  await delay(1100, signal)
  if (signal?.aborted) throw new DOMException('Connection cancelled.', 'AbortError')
  const existing = findAccount(input.id)
  const record: ConnectionRecord = {
    id: input.id,
    platform: input.platform,
    label: existing?.label ?? platformLabel(input.platform),
    viaProxy: proxy !== undefined,
    connectedAt: new Date().toISOString(),
  }
  saveAccount(record)
  return record
}

/** Mark the account as disconnected (keeps the row, clears the connection). */
export function disconnectAccount(id: string): ConnectionRecord[] {
  const existing = findAccount(id)
  if (!existing) return removeAccount(id)
  return saveAccount({ ...existing, viaProxy: false, connectedAt: null })
}