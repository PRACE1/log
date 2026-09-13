import { Hono } from 'hono'
import { MOCK_LISTINGS } from './mock'
import { LISTING_STATUSES } from './types'
import type { ListingDraft, ListingRecord, ListingStatus } from './types'
import { isArray, isRecord, loadPersistedState, savePersistedState } from '../persist'

const LISTINGS_KEY = 'listings'

function isListingArray(value: unknown): value is ListingRecord[] {
  return (
    isArray(value) &&
    value.every((row) => isRecord(row) && typeof (row as { listingId?: unknown }).listingId === 'string')
  )
}

/**
 * In-memory listing store. Seeds with MOCK_LISTINGS; form-created listings
 * are appended at the top and polled by status like the seeded rows.
 * Persisted to localStorage on every write and rehydrated on load, so
 * edits and status changes survive a refresh instead of resetting to seeds.
 */
let listings: ListingRecord[] = loadPersistedState(LISTINGS_KEY, isListingArray) ?? [...MOCK_LISTINGS]

function persistListings(): void {
  savePersistedState(LISTINGS_KEY, listings)
}

/** Marketplace-style numeric id (17 digits, like the captured live ids). */
function nextListingId(): string {
  return String(10 ** 16 + Math.floor(Math.random() * 9 * 10 ** 16))
}

/**
 * Hono-shaped listings API. Mock-backed for now — the real endpoints come
 * from facebook-camofox-client (`GET /api/listings`, `POST /api/listings`,
 * `GET /api/listings/{id}/status`). When that backend lands, point the
 * client at it; routes and response shapes stay the same.
 */
export const listingsApp = new Hono()
  .get('/listings', (c) => c.json({ listings: [...listings] }))
  .post('/listings', async (c) => {
    const body = await c.req.json<ListingDraft>().catch(() => null)
    if (!body) return c.json({ error: 'Invalid request body' }, 400)
    const title = (body.title ?? '').trim()
    const price = (body.price ?? '').trim()
    if (!title) return c.json({ error: 'A listing needs a title' }, 400)
    if (!price) return c.json({ error: 'A listing needs a price' }, 400)
    const location = (body.location ?? '').trim()
    if (!location) return c.json({ error: 'A listing needs a location' }, 400)
    // A marketplace listing without a photo doesn't sell — the picker enforces
    // one too; this keeps the route honest if called directly.
    const images = (body.images ?? []).filter((image) => typeof image === 'string' && image.length > 0)
    if (images.length === 0) return c.json({ error: 'A listing needs at least one photo' }, 400)
    const listingId = nextListingId()
    const listing: ListingRecord = {
      listingId,
      title,
      price,
      // Category / condition have form defaults; fall back to the mock norm.
      category: (body.category ?? '').trim() || 'Household',
      condition: (body.condition ?? '').trim() || 'Used - fair',
      location,
      // The form only offers connected facebook accounts, so the label is
      // trusted here; the live client re-validates it against the account.
      account: (body.account ?? '').trim() || 'Facebook',
      // First photo is the cover; up to four fan out in the row.
      images: images.slice(0, 4),
      // Every new listing sits in review before the client confirms it live.
      status: 'under-review',
      listingUrl: `https://facebook.com/marketplace/item/${listingId}`,
      publishedAt: new Date().toISOString()
    }
    listings = [listing, ...listings]
    persistListings()
    return c.json({ listing, listings: [...listings] }, 201)
  })
  .patch('/listings/:listingId', async (c) => {
    // Edit a listing's details/photos in place — id, url, timestamps and
    // review status stay put; only the form-owned fields move.
    const listingId = c.req.param('listingId')
    const current = listings.find((row) => row.listingId === listingId)
    if (!current) return c.json({ error: 'Listing not found' }, 404)
    const body = await c.req.json<Partial<ListingDraft>>().catch(() => null)
    if (!body) return c.json({ error: 'Invalid request body' }, 400)
    const title = (body.title ?? '').trim()
    const price = (body.price ?? '').trim()
    if (!title) return c.json({ error: 'A listing needs a title' }, 400)
    if (!price) return c.json({ error: 'A listing needs a price' }, 400)
    const location = (body.location ?? '').trim()
    if (!location) return c.json({ error: 'A listing needs a location' }, 400)
    const images = (body.images ?? []).filter((image) => typeof image === 'string' && image.length > 0)
    if (images.length === 0) return c.json({ error: 'A listing needs at least one photo' }, 400)
    const updated: ListingRecord = {
      ...current,
      title,
      price,
      category: (body.category ?? '').trim() || current.category,
      condition: (body.condition ?? '').trim() || null,
      location,
      account: (body.account ?? '').trim() || current.account,
      images: images.slice(0, 4),
    }
    listings = listings.map((row) => (row.listingId === listingId ? updated : row))
    persistListings()
    return c.json({ listing: updated, listings: [...listings] })
  })
  .patch('/listings/:listingId/status', async (c) => {
    // Status transitions go through this route — never local state. The
    // dashboard's sold/remove row actions round-trip here so the mock stays
    // the source of truth and the live client can implement the same shape.
    const listingId = c.req.param('listingId')
    const current = listings.find((row) => row.listingId === listingId)
    if (!current) return c.json({ error: 'Listing not found' }, 404)
    const body = await c.req.json<{ status?: unknown }>().catch(() => null)
    const status = body?.status
    if (typeof status !== 'string' || !(LISTING_STATUSES as string[]).includes(status)) {
      return c.json({ error: `Status must be one of: ${LISTING_STATUSES.join(', ')}` }, 400)
    }
    const updated: ListingRecord = { ...current, status: status as ListingStatus }
    listings = listings.map((row) => (row.listingId === listingId ? updated : row))
    persistListings()
    return c.json({ listing: updated, listings: [...listings] })
  })
  .get('/listings/:listingId/status', (c) => {
    const listing = listings.find((row) => row.listingId === c.req.param('listingId'))
    if (!listing) return c.json({ error: 'Listing not found' }, 404)
    return c.json({
      listingId: listing.listingId,
      status: listing.status satisfies ListingStatus,
      title: listing.title
    })
  })

export type ListingsApp = typeof listingsApp