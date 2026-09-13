export type ListingStatus =
  | 'active'
  | 'under-review'
  | 'under-review-duplicate'
  | 'sold'
  | 'removed'
  | 'login-wall'
  | 'unknown'

export const LISTING_STATUSES: ListingStatus[] = [
  'active',
  'under-review',
  'under-review-duplicate',
  'sold',
  'removed',
  'login-wall',
  'unknown'
]

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  active: 'Active',
  'under-review': 'Under review',
  'under-review-duplicate': 'Duplicate hold',
  sold: 'Sold',
  removed: 'Removed',
  'login-wall': 'Login wall',
  unknown: 'Unknown'
}

/**
 * A Facebook Marketplace listing row. Mirrors the `MarketplaceCreateInput`
 * and `MarketplaceStatusOutput` pydantic schemas from
 * facebook-camofox-client (github.com/PRACE1/facebook-camofox-client):
 * create carries title/price/category/condition/location, status polling
 * classifies into `status` and resolves the `listingUrl`.
 * `account` is the connection account label that published the listing —
 * the same label space as lib/connections, so the dashboard can match it
 * against the user's connected accounts.
 * Unknown stays unknown — statuses are never fabricated.
 */
export interface ListingRecord {
  listingId: string
  title: string
  price: string
  category: string
  condition: string | null
  location: string
  account: string
  /** 1–4 marketplace photos, cycled in the row's 9:16 photo frame. */
  images: string[]
  status: ListingStatus
  listingUrl: string
  publishedAt: string
}

export interface ListingsResponse {
  listings: ListingRecord[]
}

/**
 * A new-listing draft submitted by the dashboard form. `account` is the
 * connected account label that will publish it — the same label space as
 * lib/connections, so the form is shown only for connected facebook accounts.
 * `images` are data URLs from the form's file picker (up to four; the first
 * is the cover) — the mock store keeps them in memory, and the live client
 * will upload the same bytes to marketplace. No status or listingUrl on
 * drafts: the client assigns both on create.
 */
export interface ListingDraft {
  title: string
  price: string
  category: string
  condition: string | null
  location: string
  account: string
  images: string[]
}

export interface ListingCreatedResponse {
  listing: ListingRecord
  listings: ListingRecord[]
}

export interface ListingStatusResponse {
  listingId: string
  status: ListingStatus
  title: string | null
}