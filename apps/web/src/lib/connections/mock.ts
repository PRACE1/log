import type { ConnectionRecord } from './types'

/**
 * The three Facebook accounts the mock Marketplace feed is published from.
 * The first matches the label a fresh install sees, so a connected install
 * lights up immediately; the other two are added accounts in the same label
 * space. Both the listings mock and the connections API consume these labels.
 */
export const MOCK_FACEBOOK_ACCOUNTS = ['Facebook', 'Galway Rubbish Co', 'Pacer Marketplace']

/**
 * In-memory seed for the connections API. The Facebook labels mirror
 * MOCK_FACEBOOK_ACCOUNTS one-to-one so the Listings account badges and the
 * Accounts table always agree on which accounts exist.
 */
export const MOCK_CONNECTIONS: ConnectionRecord[] = [
  {
    id: 'fb-galway-rubbish',
    platform: 'facebook',
    label: 'Galway Rubbish Co',
    viaProxy: false,
    connectedAt: '2026-09-10T09:02:00+00:00'
  },
  {
    id: 'fb-pacer',
    platform: 'facebook',
    label: 'Pacer Marketplace',
    viaProxy: true,
    connectedAt: '2026-09-11T17:40:00+00:00'
  },
  {
    id: 'fb-personal',
    platform: 'facebook',
    label: 'Facebook',
    viaProxy: false,
    connectedAt: '2026-09-12T08:15:00+00:00'
  },
  {
    id: 'x-listeningkit',
    platform: 'x',
    label: 'X',
    viaProxy: true,
    connectedAt: '2026-09-08T11:20:00+00:00'
  },
  {
    id: 'reddit-listeningkit',
    platform: 'reddit',
    label: 'Reddit',
    viaProxy: false,
    connectedAt: null
  }
]