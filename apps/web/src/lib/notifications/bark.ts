export const DEFAULT_BARK_SERVER = 'https://api.day.app'

const STORAGE_KEY = 'listeningkit.bark.v1'

export interface BarkPushInput {
  /** Bark server base URL. Defaults to https://api.day.app when empty. */
  server?: string
  deviceKey: string
  title: string
  body: string
  group?: string
}

export interface BarkConfig {
  server: string
  deviceKey: string
}

/** Normalize a Bark server URL; empty falls back to the official server. */
export function normalizeBarkServer(raw: string | undefined): string {
  const server = (raw ?? '').trim().replace(/\/+$/, '')
  if (!server) return DEFAULT_BARK_SERVER
  if (!/^https?:\/\//i.test(server)) {
    throw new Error('Server needs a scheme, e.g. https://api.day.app')
  }
  return server
}

/** Validate a Bark device key, returning the cleaned value or throwing. */
export function assertDeviceKey(raw: string): string {
  const key = raw.trim()
  if (!key) throw new Error('Paste your Bark device key first.')
  return key
}

/** GET-form test URL — works when opened directly, no CORS involved. */
export function barkPushUrl(input: Pick<BarkPushInput, 'server' | 'deviceKey' | 'title' | 'body'>): string {
  const server = normalizeBarkServer(input.server)
  const key = assertDeviceKey(input.deviceKey)
  return `${server}/${encodeURIComponent(key)}/${encodeURIComponent(input.title)}/${encodeURIComponent(input.body)}`
}

interface BarkResponse {
  code?: number
  message?: string
}

/**
 * Send a push via POST JSON. Note: Bark answers HTTP 200 even for failures
 * (e.g. an invalid key), so the `code` field decides success.
 */
export async function sendBarkPush(input: BarkPushInput, signal?: AbortSignal): Promise<void> {
  const server = normalizeBarkServer(input.server)
  const deviceKey = assertDeviceKey(input.deviceKey)
  let res: Response
  try {
    res = await fetch(`${server}/${encodeURIComponent(deviceKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        title: input.title,
        body: input.body,
        group: input.group ?? 'listeningkit',
      }),
      signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new Error('Could not reach the Bark server — check the URL or open the test link directly.')
  }
  let data: BarkResponse = {}
  try {
    data = (await res.json()) as BarkResponse
  } catch {
    throw new Error(`Bark server responded ${res.status}.`)
  }
  if (!res.ok || data.code !== 200) {
    throw new Error(data.message || `Bark rejected the push (code ${data.code ?? res.status}).`)
  }
}

export function loadBarkConfig(): BarkConfig {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { server: '', deviceKey: '' }
    const parsed = JSON.parse(raw) as Partial<BarkConfig>
    return {
      server: typeof parsed.server === 'string' ? parsed.server : '',
      deviceKey: typeof parsed.deviceKey === 'string' ? parsed.deviceKey : '',
    }
  } catch {
    return { server: '', deviceKey: '' }
  }
}

export function saveBarkConfig(config: BarkConfig): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // storage unavailable — config still works for this session
  }
}
