import { Hono } from 'hono'
import { MOCK_LISTINGS } from './mock'
import type { ListingStatus } from './types'

/**
 * Hono-shaped listings API. Mock-backed for now — the real endpoints come
 * from facebook-camofox-client (`GET /api/listings`, `GET /api/listings/{id}/status`).
 * When that backend lands, point the client at it; routes and response shapes stay the same.
 */
export const listingsApp = new Hono()
  .get('/listings', (c) => c.json({ listings: MOCK_LISTINGS }))
  .get('/listings/:listingId/status', (c) => {
    const listing = MOCK_LISTINGS.find((row) => row.listingId === c.req.param('listingId'))
    if (!listing) return c.json({ error: 'Listing not found' }, 404)
    return c.json({
      listingId: listing.listingId,
      status: listing.status satisfies ListingStatus,
      title: listing.title
    })
  })

export type ListingsApp = typeof listingsApp