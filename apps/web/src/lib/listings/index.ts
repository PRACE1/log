import { listingsApp } from './server'
import type {
  ListingCreatedResponse,
  ListingDraft,
  ListingRecord,
  ListingStatusResponse,
  ListingsResponse
} from './types'

export * from './types'
export { MOCK_FACEBOOK_ACCOUNTS, MOCK_LISTINGS } from './mock'
export { listingsApp, type ListingsApp } from './server'

/** Fetch listings through the Hono app (in-memory mock for now). */
export async function getListings(): Promise<ListingsResponse> {
  const res = await listingsApp.request('/listings')
  if (!res.ok) throw new Error(`Listings request failed (${res.status})`)
  return (await res.json()) as ListingsResponse
}

/** Poll one listing's classified status through the Hono app. */
export async function getListingStatus(listingId: string): Promise<ListingStatusResponse> {
  const res = await listingsApp.request(`/listings/${listingId}/status`)
  if (!res.ok) throw new Error(`Listing status request failed (${res.status})`)
  return (await res.json()) as ListingStatusResponse
}

/**
 * Save a listing's details/photos through `PATCH /listings/:listingId`.
 * Id, url, timestamps and review status stay put — returns the updated row.
 */
export async function saveListing(listingId: string, draft: ListingDraft): Promise<ListingRecord> {
  const res = await listingsApp.request(`/listings/${listingId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(draft),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Could not save the listing (${res.status})`)
  }
  const parsed = (await res.json()) as ListingCreatedResponse
  return parsed.listing
}

/**
 * Move a listing to a new status through `PATCH /listings/:listingId/status`.
 * Row actions (sold / remove) round-trip here — the store stays the source
 * of truth instead of local table state. Returns the full roster.
 */
export async function setListingStatus(
  listingId: string,
  status: ListingRecord['status']
): Promise<ListingCreatedResponse> {
  const res = await listingsApp.request(`/listings/${listingId}/status`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Could not update the listing (${res.status})`)
  }
  return (await res.json()) as ListingCreatedResponse
}

/**
 * Publish a new listing through `POST /listings`. Returns the created row
 * (status `under-review` until the client clears it).
 */
export async function createListing(draft: ListingDraft): Promise<ListingRecord> {
  const res = await listingsApp.request('/listings', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(draft),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `Could not create the listing (${res.status})`)
  }
  const parsed = (await res.json()) as ListingCreatedResponse
  return parsed.listing
}