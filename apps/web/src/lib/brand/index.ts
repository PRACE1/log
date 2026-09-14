import { isRecord, loadPersistedState, savePersistedState } from '../persist'
import type { BrandProfile } from './types'

export type { AiFollowUpAction, AiQuery, BrandIdentity, BrandOfferings, BrandProfile, BrandVoice } from './types'

const STORAGE_KEY = 'brand-profile'

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isBrandProfile(value: unknown): value is BrandProfile {
  if (!isRecord(value)) return false
  const { identity, offerings, voice, sourceUrl, updatedAt } = value
  if (!isRecord(identity) || typeof identity.name !== 'string' || typeof identity.website !== 'string') return false
  if (typeof identity.tagline !== 'string') return false
  if (!isRecord(offerings) || !isStringArray(offerings.items)) return false
  if (!isRecord(voice) || typeof voice.tone !== 'string' || !isStringArray(voice.serviceAreas)) return false
  return typeof sourceUrl === 'string' && typeof updatedAt === 'string'
}

/** Read the saved brand profile; null when skipped or never set. */
export function getBrand(): BrandProfile | null {
  return loadPersistedState(STORAGE_KEY, isBrandProfile)
}

/** Persist the brand profile (stamps updatedAt). */
export function saveBrand(profile: Omit<BrandProfile, 'updatedAt'>): BrandProfile {
  const next: BrandProfile = { ...profile, updatedAt: new Date().toISOString() }
  savePersistedState(STORAGE_KEY, next)
  return next
}

/** Forget the brand profile (user skipped or reset onboarding). */
export function clearBrand(): void {
  savePersistedState(STORAGE_KEY, null)
}

function humanizeHost(host: string): string {
  const cleaned = host
    .replace(/^www\./, '')
    .split('.')
    .slice(0, -1)
    .join(' ')
  return cleaned
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Mock brand extraction from a website URL: normalizes the URL, derives a
 * display name from the hostname, and seeds the voice with the house default.
 * Offerings come back empty — inventing services would be fake data, so the
 * follow-up drafts fall back to generic phrasing until real ones are added.
 * Throws a human-readable error for unparseable input.
 */
export function extractBrandFromUrl(input: string): Omit<BrandProfile, 'updatedAt'> {
  const trimmed = input.trim()
  if (!trimmed) throw new Error('Paste your website URL first.')
  const normalized = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  let url: URL
  try {
    url = new URL(normalized)
  } catch {
    throw new Error('That URL does not parse — check it and try again.')
  }
  if (!url.hostname.includes('.')) throw new Error('That URL needs a domain, e.g. acmeplumbing.com.')
  const name = humanizeHost(url.hostname) || url.hostname
  return {
    identity: {
      name,
      website: url.origin + (url.pathname === '/' ? '' : url.pathname),
      tagline: `${name} — heard across social`,
    },
    offerings: { items: [] },
    voice: {
      tone: 'Friendly, plain-spoken local pro',
      serviceAreas: [],
    },
    sourceUrl: url.href,
  }
}
