export type ConnectionPlatform = 'facebook' | 'x' | 'reddit'

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error'

export interface ConnectInput {
  /** Stable unique account id (a platform can host multiple accounts). */
  id: string
  platform: ConnectionPlatform
  /** Raw cookie / token pasted from the browser extension. */
  cookie: string
  /** Optional proxy URL (e.g. http://user:pass@host:port). */
  proxy?: string
}

export interface ConnectionRecord {
  /** Stable unique id; NOT the platform, so multiple accounts per platform work. */
  id: string
  platform: ConnectionPlatform
  /** Display label (defaults to the platform name when the account is added). */
  label: string
  /** Whether the connection routes through a proxy. */
  viaProxy: boolean
  /** ISO timestamp of the last successful connect; null = added but not connected yet. */
  connectedAt: string | null
}