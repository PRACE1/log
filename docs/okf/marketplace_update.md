# Marketplace update routes (edit + status)

Companion to `marketplace_create.md`. Covers the two write routes the
dashboard's listings UI round-trips when it edits a row: full edit and
status transition. Both are shaped off the dashboard form's draft
(`ListingDraft` in `apps/web/src/lib/listings/types.ts`), because the live
client (`facebook-camofox-client`) must implement these same shapes — the
form never reshapes its payload per backend.

## Rule: every mutation is a route round-trip

Listing state is never mutated locally and never written past the API.
`DashboardListings` row actions ("Mark as sold", "Remove listing") call
`setListingStatus` and reconcile from the returned roster; the edit form
calls `saveListing`. (Regression this fixes: sold/remove used to
`setListings(map(...))` in React state, so a refresh silently reverted
them — the mock store is the source of truth, and the live client will be.)

## PATCH /listings/:listingId — edit details/photos

Body: the form's draft shape (`ListingDraft`).

```json
{
  "title": "Rubbish Removal in Galway",
  "price": "50",
  "category": "Household",
  "condition": "Used - fair",
  "location": "Galway, Ireland",
  "account": "Galway Rubbish Co",
  "images": ["data:image/jpeg;base64,…"]
}
```

| Field | Rule |
|---|---|
| `title`, `price`, `location` | Required, non-blank after trim → else `400` |
| `category` | Blank falls back to the stored category |
| `condition` | Blank/`null` → `null` (not applicable) |
| `account` | Blank falls back to the stored account label |
| `images` | At least one non-empty string → else `400`; stored slice(0, 4), first = cover |

Preserved untouched: `listingId`, `listingUrl`, `publishedAt`, `status`
(editing never re-reviews a listing).

- `200 { listing, listings }` — updated row + full roster.
- `400 { error }` — validation (message names the missing field).
- `404 { error: 'Listing not found' }` — unknown id.

## PATCH /listings/:listingId/status — status transition

Body: `{ "status": "<ListingStatus>" }` where status is one of
`active | under-review | under-review-duplicate | sold | removed |
login-wall | unknown` (`LISTING_STATUSES`).

- `200 { listing, listings }` — transitioned row + full roster.
- `400 { error }` — unknown status value (message lists the allowed set).
- `404 { error: 'Listing not found' }` — unknown id.

Dashboard mapping: "Mark as sold" → `sold`, "Remove listing" → `removed`.

## Client surface (`apps/web/src/lib/listings/index.ts`)

| Function | Route | Returns |
|---|---|---|
| `getListings()` | `GET /listings` | `{ listings }` |
| `getListingStatus(id)` | `GET /listings/:id/status` | `{ listingId, status, title }` |
| `createListing(draft)` | `POST /listings` | created `ListingRecord` (`under-review`) |
| `saveListing(id, draft)` | `PATCH /listings/:id` | updated `ListingRecord` |
| `setListingStatus(id, status)` | `PATCH /listings/:id/status` | `{ listing, listings }` |

## Live-client mapping (facebook-camofox-client)

Mock routes above stand in for `GET /api/listings`, `POST /api/listings`,
`GET /api/listings/{id}/status`. When the external client lands, it must
add the same two update routes with identical request/response shapes:

- `PATCH /api/listings/{id}` accepting the form's `ListingDraft` JSON with
  the validation table above (client re-validates the account label against
  the connected account, as create already does).
- `PATCH /api/listings/{id}/status` accepting `{ status }` restricted to
  `LISTING_STATUSES`.

Swapping the mock for the live backend stays a transport change: the form
and the row actions keep calling `saveListing` / `setListingStatus`
unchanged.
