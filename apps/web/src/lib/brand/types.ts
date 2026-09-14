/**
 * Brand profile shapes: the three info types the app collects about the
 * business being listened for — identity, offerings, and voice — plus the
 * query object the inspect-form follow-ups build from an event + profile.
 */

export interface BrandIdentity {
  /** Display name, e.g. "Acme Plumbing". */
  name: string
  /** Canonical website URL the profile was extracted from. */
  website: string
  /** One-line description; empty when the lookup could not infer one. */
  tagline: string
}

export interface BrandOfferings {
  /** Services / products, e.g. ["Emergency callouts", "Boiler installs"]. */
  items: string[]
}

export interface BrandVoice {
  /** How replies should read, e.g. "Friendly, plain-spoken local pro". */
  tone: string
  /** Areas served, e.g. ["Dallas", "Fort Worth"]. */
  serviceAreas: string[]
}

export interface BrandProfile {
  identity: BrandIdentity
  offerings: BrandOfferings
  voice: BrandVoice
  /** URL the profile was extracted from (mock lookup for now). */
  sourceUrl: string
  /** ISO timestamp of the last save. */
  updatedAt: string
}

/** The two follow-up actions on the event inspect sheet. */
export type AiFollowUpAction = 'related' | 'reply'

/**
 * The query a follow-up runs: the captured event, the tracked phrases to
 * exclude, and the brand snapshot the mock AI drafts against. A null brand
 * means the user skipped onboarding — drafts fall back to generic phrasing.
 */
export interface AiQuery {
  action: AiFollowUpAction
  eventId: string
  keywordId: string
  platform: string
  author: string
  group: string
  type: string
  sentiment: string
  text: string
  url: string
  trackedPhrases: string[]
  brand: BrandProfile | null
}
