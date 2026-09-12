import type { ConnectionPlatform, ConnectionRecord } from './types'

const STORAGE_KEY = 'listeningkit.accounts.v2'
const LEGACY_KEY = 'listeningkit.connections.v1'

/** Accounts a brand-new install starts with. */
const DEFAULT_PLATFORMS: ConnectionPlatform[] = ['facebook', 'x', 'reddit']

const PLATFORM_LABEL: Record<ConnectionPlatform, string> = {
  facebook: 'Facebook',
  x: 'X',
  reddit: 'Reddit'
}

export function platformLabel(platform: ConnectionPlatform): string {
  return PLATFORM_LABEL[platform]
}

export function newAccountId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `account-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isValidRecord(value: unknown): value is ConnectionRecord {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.platform === 'string' &&
    value.platform in PLATFORM_LABEL &&
    typeof value.label === 'string' &&
    typeof value.viaProxy === 'boolean' &&
    (value.connectedAt === null || typeof value.connectedAt === 'string')
  )
}

/* v1 stored one record per platform; v2 keys accounts by a stable id. */
function migrateLegacy(): ConnectionRecord[] {
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (r): r is { platform: ConnectionPlatform; connectedAt?: unknown; viaProxy?: unknown } =>
          isRecord(r) && typeof r.platform === 'string'
      )
      .map((r) => ({
        id: r.platform,
        platform: r.platform,
        label: platformLabel(r.platform),
        viaProxy: !!r.viaProxy,
        connectedAt: typeof r.connectedAt === 'string' ? r.connectedAt : null
      }))
  } catch {
    return []
  }
}

function writeAll(records: ConnectionRecord[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // storage unavailable (private mode) — in-memory state still works for the session
  }
}

function readAll(): ConnectionRecord[] {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    raw = null
  }
  if (raw !== null) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        // An explicit "[]" means the user deleted everything — do not reseed.
        return parsed.filter(isValidRecord)
      }
    } catch {
      // corrupted v2 payload — fall through to legacy migration / seeding
    }
  }
  const legacy = migrateLegacy()
  if (legacy.length) {
    writeAll(legacy)
    return legacy
  }
  const seeded = DEFAULT_PLATFORMS.map((platform) => ({
    id: newAccountId(),
    platform,
    label: platformLabel(platform),
    viaProxy: false,
    connectedAt: null
  }))
  writeAll(seeded)
  return seeded
}

export function loadAccounts(): ConnectionRecord[] {
  return readAll()
}

export function findAccount(id: string): ConnectionRecord | undefined {
  return readAll().find((r) => r.id === id)
}

/** Persist a new, not-yet-connected account and return it. */
export function addAccount(platform: ConnectionPlatform): ConnectionRecord {
  const record: ConnectionRecord = {
    id: newAccountId(),
    platform,
    label: platformLabel(platform),
    viaProxy: false,
    connectedAt: null
  }
  writeAll([...readAll(), record])
  return record
}

/** Upsert one account (matched by id) and return the stored list. */
export function saveAccount(record: ConnectionRecord): ConnectionRecord[] {
  const rest = readAll().filter((r) => r.id !== record.id)
  const next = [...rest, record]
  writeAll(next)
  return next
}

export function removeAccount(id: string): ConnectionRecord[] {
  const next = readAll().filter((r) => r.id !== id)
  writeAll(next)
  return next
}