import { Hono } from 'hono'
import { MOCK_LISTINGS } from './mock'
import type { ListingDraft, ListingRecord, ListingStatus } from './types'

/**
 * In-memory listing store. Seeds with MOCK_LISTINGS; form-created listings
 * are appended at the top and polled by status like the seeded rows.
 */
let listings: ListingRecord[] = [...MOCK_LISTINGS]

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
    return c.json({ listing, listings: [...listings] }, 201)
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