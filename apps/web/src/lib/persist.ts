/**
 * Persistence for the in-memory mock stores (listings, keywords,
 * communities). Without this every refresh resets to seeds — joins,
 * edits and status changes silently vanish, so the mock can't stand in
 * for real data. State is versioned: bump VERSION when seed shapes change
 * and old snapshots stop applying.
 */

const PREFIX = 'listeningkit-hackathon:v1:'

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    return window.localStorage
  } catch {
    return null
  }
}

/** Read a snapshot; null when missing, corrupt, or failed validation. */
export function loadPersistedState<T>(key: string, isValid: (value: unknown) => value is T): T | null {
  const store = storage()
  if (!store) return null
  try {
    const raw = store.getItem(PREFIX + key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}

/** Write a snapshot; silently keeps in-memory state on quota/privacy errors. */
export function savePersistedState(key: string, value: unknown): void {
  const store = storage()
  if (!store) return
  try {
    store.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Quota exceeded (e.g. base64 listing photos) or storage blocked —
    // the mock simply stays in-memory for this session.
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}
