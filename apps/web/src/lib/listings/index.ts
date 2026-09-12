import { listingsApp } from './server'
import type { ListingStatusResponse, ListingsResponse } from './types'

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