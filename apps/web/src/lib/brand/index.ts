import { isRecord, loadPersistedState, savePersistedState } from '../persist'
import type { BrandProfile, KeywordStrategyMapping } from './types'

export type {
  AiFollowUpAction,
  AiQuery,
  BrandIdentity,
  BrandOfferings,
  BrandProfile,
  BrandVoice,
  CommunityPick,
  KeywordStrategyMapping,
  KeywordTargetEntry,
  SearchStrategyEntry,
} from './types'

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

const MAPPING_KEY = 'keyword-strategy-mapping'

function isPage(value: unknown): value is { title: string; href: string } {
  return isRecord(value) && typeof value.title === 'string' && typeof value.href === 'string'
}

function isKeywordStrategyMapping(value: unknown): value is KeywordStrategyMapping {
  if (!isRecord(value) || !Array.isArray(value.targets) || !Array.isArray(value.strategies)) return false
  if (typeof value.savedAt !== 'string') return false
  if (value.selectedPhrase !== undefined && typeof value.selectedPhrase !== 'string') return false
  for (const target of value.targets) {
    if (!isRecord(target) || typeof target.phrase !== 'string' || typeof target.intent !== 'string') return false
    if (!Array.isArray(target.pages) || !target.pages.every(isPage)) return false
  }
  for (const strategy of value.strategies) {
    if (!isRecord(strategy) || typeof strategy.id !== 'string' || typeof strategy.title !== 'string') return false
    if (typeof strategy.category !== 'string' || typeof strategy.dork !== 'string') return false
  }
  if (value.groups !== undefined) {
    if (!Array.isArray(value.groups)) return false
    for (const group of value.groups) {
      if (!isRecord(group) || typeof group.id !== 'string' || typeof group.platform !== 'string') return false
      if (typeof group.name !== 'string' || typeof group.detail !== 'string') return false
    }
  }
  if (value.interested !== undefined && !isStringArray(value.interested)) return false
  return true
}

/** Read the saved keyword + search-strategy mapping; null when never saved. */
export function getKeywordMapping(): KeywordStrategyMapping | null {
  return loadPersistedState(MAPPING_KEY, isKeywordStrategyMapping)
}

/** Persist the keyword + search-strategy mapping for the rest of the workflow. */
export function saveKeywordMapping(
  mapping: Omit<KeywordStrategyMapping, 'savedAt'>
): KeywordStrategyMapping {
  const next: KeywordStrategyMapping = { ...mapping, savedAt: new Date().toISOString() }
  savePersistedState(MAPPING_KEY, next)
  return next
}

/** Fill a strategy dork template with the keyword and brand site. */
export function fillDork(template: string, keyword: string, site: string): string {
  return template.split('{keyword}').join(keyword).split('{site}').join(site)
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
