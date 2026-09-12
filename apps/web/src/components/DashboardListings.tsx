import * as Flags from 'country-flag-icons/react/3x2'
import { useCallback, useEffect, useState, type ComponentType, type ReactNode, type SVGProps } from 'react'
import { useLocation } from 'react-router-dom'
import { CircleCheck, Clock, Copy, ExternalLink, Globe, HelpCircle, LogIn, Tag, Trash2 } from 'lucide-react'
import { Badge, type BadgeColor, Dropdown, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@listeningkit/ui'
import { getAccounts, type ConnectionRecord } from '../lib/connections'
import { getListings, LISTING_STATUSES, LISTING_STATUS_LABELS, type ListingRecord, type ListingStatus } from '../lib/listings'
import { SocialBadge, SocialGlyph, SOCIAL_ICONS } from '../lib/social-icons'
import { MarketplaceImages } from './MarketplaceImages'

const facebookIcon = SOCIAL_ICONS.find((icon) => icon.id === 'facebook')

const STATUS_COLOR: Record<ListingStatus, BadgeColor> = {
  active: 'success',
  'under-review': 'warning',
  'under-review-duplicate': 'warning',
  sold: 'info',
  removed: 'danger',
  'login-wall': 'danger',
  unknown: 'muted'
}

// One glyph per status so the trigger icon follows the selection, the same
// way the Accounts platform filter's trigger icon follows its selection.
const STATUS_ICON: Record<ListingStatus, ReactNode> = {
  active: <CircleCheck aria-hidden="true" className="size-3.5" strokeWidth={2.25} />,
  'under-review': <Clock aria-hidden="true" className="size-3.5" strokeWidth={2.25} />,
  'under-review-duplicate': <Copy aria-hidden="true" className="size-3.5" strokeWidth={2.25} />,
  sold: <Tag aria-hidden="true" className="size-3.5" strokeWidth={2.25} />,
  removed: <Trash2 aria-hidden="true" className="size-3.5" strokeWidth={2.25} />,
  'login-wall': <LogIn aria-hidden="true" className="size-3.5" strokeWidth={2.25} />,
  unknown: <HelpCircle aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
}

function formatPublished(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const COUNTRY_CODES: Record<string, string> = {
  ireland: 'IE',
  'united states': 'US',
  'united kingdom': 'GB',
  canada: 'CA',
  germany: 'DE',
  france: 'FR',
  italy: 'IT',
  spain: 'ES',
  portugal: 'PT',
  netherlands: 'NL',
  belgium: 'BE',
  austria: 'AT',
  switzerland: 'CH',
  denmark: 'DK',
  sweden: 'SE',
  norway: 'NO',
  finland: 'FI',
  poland: 'PL',
  japan: 'JP',
  australia: 'AU',
  'new zealand': 'NZ',
  mexico: 'MX',
  brazil: 'BR',
  india: 'IN',
  china: 'CN'
}

// The country sits after the last comma in a "City, Country" location string.
// Rendered as an inlined SVG from country-flag-icons so it looks identical
// on every OS (Unicode flag emoji don't render on Windows).
function flagForLocation(location: string): ReactNode {
  const country = location.split(',').pop()?.trim().toLowerCase() ?? ''
  const code = COUNTRY_CODES[country]
  if (!code) return null
  const Flag = (Flags as Record<string, ComponentType<SVGProps<SVGSVGElement>>>)[code]
  if (!Flag) return null
  return <Flag className="h-3.5 w-auto rounded-[3px]" aria-hidden="true" />
}

export function DashboardListings() {
  const location = useLocation()
  const [listings, setListings] = useState<ListingRecord[] | null>(null)
  const [accounts, setAccounts] = useState<ConnectionRecord[] | null>(null)
  const [filter, setFilter] = useState('all')

  const load = useCallback(() => {
    getListings()
      .then((res) => setListings(res.listings))
      .catch(() => setListings([]))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Pick up account changes made in Accounts/Settings when we come back.
  useEffect(() => {
    getAccounts().then(setAccounts).catch(() => setAccounts([]))
  }, [location])

  const connectedAccounts = new Set(
    (accounts ?? []).filter((account) => account.platform === 'facebook' && account.connectedAt !== null).map((account) => account.label)
  )
  const isConnected = (account: string) => connectedAccounts.has(account)

  const setStatus = (listingId: string, status: ListingStatus) =>
    setListings((current) =>
      current ? current.map((l) => (l.listingId === listingId ? { ...l, status } : l)) : current
    )

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Clipboard can be unavailable on non-secure origins; the menu closes
      // either way so this stays a non-fatal nicety.
    }
  }

  const rows = (listings ?? []).filter((listing) => filter === 'all' || listing.status === filter)
  const activeCount = (listings ?? []).filter((listing) => listing.status === 'active').length

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          {facebookIcon ? <SocialBadge icon={facebookIcon} variant="blue" /> : null}
          <div>
            <h1 className="text-xl font-bold text-text-primary">Listings</h1>
            <p className="text-sm text-text-secondary">
              {listings === null
                ? 'Loading listings…'
                : `${activeCount} of ${listings.length} listings live on Facebook Marketplace.`}
            </p>
          </div>
        </div>
        <Select
          matchWidth
          value={filter}
          onChange={setFilter}
          aria-label="Filter by status"
          options={[
            { value: 'all', label: 'All statuses', icon: <Globe aria-hidden="true" className="size-3.5" strokeWidth={2.25} /> },
            ...LISTING_STATUSES.map((status) => ({
              value: status,
              label: LISTING_STATUS_LABELS[status],
              icon: STATUS_ICON[status]
            }))
          ]}
        />
      </div>

      {rows.length > 0 ? (
          <Table>
            <table className="w-full text-left">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Listing</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((listing) => (
                  <TableRow key={listing.listingId}>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <MarketplaceImages images={listing.images} title={listing.title} />
                        <div>
                          <div className="font-semibold">{listing.title}</div>
                          <div className="text-xs text-text-secondary">
                            {listing.category}
                            {listing.condition ? ` · ${listing.condition}` : ''}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={isConnected(listing.account) ? 'info' : 'muted'}
                        icon={facebookIcon ? <SocialGlyph icon={facebookIcon} className="size-3.5" /> : undefined}
                      >
                        {listing.account}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-text-secondary">
                      <span className="inline-flex items-center gap-1.5">
                        {flagForLocation(listing.location)}
                        {listing.location}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="trigger" color={STATUS_COLOR[listing.status]}>
                        {LISTING_STATUS_LABELS[listing.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-semibold">€{listing.price}</TableCell>
                    <TableCell className="whitespace-nowrap text-right text-text-secondary">
                      {formatPublished(listing.publishedAt)}
                    </TableCell>
                    <TableCell className="text-right">
        <Dropdown
          aria-label="Listing actions"
          items={[
            {
              id: 'view',
              label: 'View listing',
              icon: <ExternalLink aria-hidden="true" className="size-4" />,
              onSelect: () => window.open(listing.listingUrl, '_blank', 'noreferrer')
            },
            {
              id: 'copy',
              label: 'Copy link',
              icon: <Copy aria-hidden="true" className="size-4" />,
              onSelect: () => copyLink(listing.listingUrl)
            },
            {
              id: 'sold',
              label: 'Mark as sold',
              icon: <Tag aria-hidden="true" className="size-4" />,
              onSelect: () => setStatus(listing.listingId, 'sold')
            },
            {
              id: 'remove',
              label: 'Remove listing',
              icon: <Trash2 aria-hidden="true" className="size-4" />,
              danger: true,
              onSelect: () => setStatus(listing.listingId, 'removed')
            }
          ]}
        />
      </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </table>
          </Table>
        ) : (
          listings !== null && (
            <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-text-secondary">
              No {filter === 'all' ? '' : LISTING_STATUS_LABELS[filter as ListingStatus] + ' '}listings yet.
            </p>
          )
        )}
      </div>
  )
}