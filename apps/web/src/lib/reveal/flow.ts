import type { KeywordTargetEntry } from '@/lib/brand'

/**
 * Brand-reveal flow model: every question the reveal asks, in flow order,
 * plus the mock data each step presents. Components stay thin — copy,
 * ordering and content live here so the whole interrogation reads in one
 * place.
 */

export interface RevealQuestion {
  id: string
  text: string
  kind: 'yes-no' | 'select-one' | 'select-many'
}

/** All questions the reveal asks, in the order it asks them. */
export const REVEAL_QUESTIONS: RevealQuestion[] = [
  { id: 'competitors-familiar', text: 'Do any of these competitors ring a bell?', kind: 'yes-no' },
  {
    id: 'keyword-relate',
    text: "Out of these keywords, which one seems to be a phrase that would relate to what you're doing?",
    kind: 'select-one',
  },
  { id: 'keywords-sound-good', text: 'Does this sound good?', kind: 'yes-no' },
  { id: 'groups-familiar', text: 'Do these groups look familiar?', kind: 'yes-no' },
  {
    id: 'groups-interested',
    text: "Out of these groups, which ones look like ones that you'd be interested in?",
    kind: 'select-many',
  },
]

export function revealQuestion(id: string): string {
  return REVEAL_QUESTIONS.find((question) => question.id === id)?.text ?? ''
}

/**
 * Mock competitors surfaced by the Treg lookup — name, domain, and how many
 * tracked keywords they also rank for.
 */
export const COMPETITORS = [
  { name: 'BluePipe Co', domain: 'bluepipe.co', shared: 12 },
  { name: 'RapidFix', domain: 'rapidfix.com', shared: 9 },
  { name: 'HomeServe Local', domain: 'homeservelocal.com', shared: 8 },
  { name: 'ProDrain', domain: 'prodrain.io', shared: 6 },
  { name: 'Fixly', domain: 'fixly.co', shared: 4 },
]

/**
 * Mock keyword targets surfaced for the brand — operand-style dork phrases
 * (broken into AND/OR operands, never full sentences), the intent behind
 * each, and example competitor pages currently ranking for it.
 */
export const KEYWORD_TARGETS: KeywordTargetEntry[] = [
  {
    phrase: '"emergency" AND "plumber" AND "near me"',
    intent: 'Urgent service need',
    pages: [
      { title: 'BluePipe Co — Emergency plumbing', href: 'https://bluepipe.co/emergency-plumber' },
      { title: 'RapidFix — 24/7 callouts', href: 'https://rapidfix.com/emergency' },
    ],
  },
  {
    phrase: '"water heater" AND ("install" OR "replace")',
    intent: 'High-ticket install',
    pages: [
      { title: 'RapidFix — Water heater installs', href: 'https://rapidfix.com/water-heaters' },
      { title: 'HomeServe Local — Install pricing', href: 'https://homeservelocal.com/water-heater-install' },
    ],
  },
  {
    phrase: '"drain cleaning" AND "cost"',
    intent: 'Price check',
    pages: [
      { title: 'BluePipe Co — Drain cleaning', href: 'https://bluepipe.co/drain-cleaning' },
      { title: 'Fixly — Drain services', href: 'https://fixly.co/drains' },
    ],
  },
  {
    phrase: '"burst pipe" AND "repair"',
    intent: 'Emergency repair',
    pages: [
      { title: 'ProDrain — Burst pipe repair', href: 'https://prodrain.io/burst-pipe' },
      { title: 'HomeServe Local — Pipe repairs', href: 'https://homeservelocal.com/pipe-repair' },
    ],
  },
  {
    phrase: '"plumber" AND ("reviews" OR "complaints")',
    intent: 'Reputation check',
    pages: [
      { title: 'Fixly — Customer reviews', href: 'https://fixly.co/reviews' },
      { title: 'BluePipe Co — Reviews', href: 'https://bluepipe.co/reviews' },
    ],
  },
]

/**
 * Mock group-finding queries surfaced while looking for communities —
 * operand-style dorks, one per lookup beat.
 */
export const GROUP_QUERIES = [
  '"buy and sell" AND "near me"',
  '"homeowners" AND "group" AND "near me"',
  '"trades" AND "services" AND "local"',
  '"recommendations" AND "contractor" AND "near me"',
  '"community" AND "home improvement" AND "local"',
]

/**
 * Mock site pages the research agent "scrapes" — about-us, services and
 * contact-us plus a few randoms. Hrefs resolve against the brand website.
 */
export const SITE_PAGE_PATHS = [
  { path: 'about-us', title: 'About us' },
  { path: 'services', title: 'Services' },
  { path: 'contact-us', title: 'Contact us' },
  { path: 'pricing', title: 'Pricing' },
  { path: 'reviews', title: 'Reviews' },
  { path: 'blog', title: 'Blog' },
  { path: 'locations', title: 'Locations' },
]

/** A single found item inside a retry search round. */
export interface RetrySearchItem {
  title: string
  detail: string
}

/** One round of a mocked fallback search: intro label + found items. */
export interface RetrySearchSet {
  label: string
  items: RetrySearchItem[]
}

/**
 * Fallback searches per No pick, three rotating sets each. Answering No runs
 * one set, then re-asks the question — sets cycle modulo length, so repeated
 * Nos loop with fresh results forever (demonstrative mock data).
 */
export const RETRY_SEARCH_SETS: Record<'competitors' | 'keywords', RetrySearchSet[]> = {
  competitors: [
    {
      label: 'No worries — casting a wider net for competitors…',
      items: [
        { title: 'BluePipe Co', detail: 'mentioned in 12 threads' },
        { title: 'RapidFix', detail: 'ranking for 9 shared terms' },
        { title: 'Fixly', detail: 'fresh reviews this week' },
        { title: 'ProDrain', detail: 'quoted for the city contract' },
        { title: 'HomeServe Local', detail: 'sponsoring little league' },
      ],
    },
    {
      label: 'Digging through review sites instead…',
      items: [
        { title: 'HomeServe Local', detail: '4.8 across 300+ reviews' },
        { title: 'ProDrain', detail: 'quoted in 6 threads' },
        { title: 'BluePipe Co', detail: 'running local ads' },
        { title: 'RapidFix', detail: 'replying to every review' },
        { title: 'Fixly', detail: 'new referral program' },
      ],
    },
    {
      label: 'Checking who ranks this week…',
      items: [
        { title: 'RapidFix', detail: 'new location pages' },
        { title: 'Fixly', detail: 'climbing for “near me”' },
        { title: 'ProDrain', detail: 'fresh before-and-afters' },
        { title: 'BluePipe Co', detail: 'fresh fleet photos' },
        { title: 'HomeServe Local', detail: 'hiring two techs' },
      ],
    },
  ],
  keywords: [
    {
      label: 'No problem — re-running the keyword scan…',
      items: [
        { title: '"plumber" AND "Dallas"', detail: 'high intent' },
        { title: '"emergency" AND "plumber"', detail: 'urgent jobs' },
        { title: '"drain cleaning" AND "cost"', detail: 'price checks' },
        { title: '"tankless" AND "water heater"', detail: 'upgrade hunts' },
        { title: '"sewer line" AND "repair"', detail: 'big outdoor jobs' },
      ],
    },
    {
      label: 'Trying broader match types…',
      items: [
        { title: '"water heater" AND "install"', detail: 'big-ticket jobs' },
        { title: '"burst pipe" AND "repair"', detail: 'emergency calls' },
        { title: '"plumber" AND "reviews"', detail: 'reputation checks' },
        { title: '"gas line" AND "install"', detail: 'permit jobs' },
        { title: '"toilet" AND "install"', detail: 'quick swaps' },
      ],
    },
    {
      label: 'Mining the questions people ask…',
      items: [
        { title: '"plumber" AND "how much"', detail: 'pricing questions' },
        { title: '"find" AND "plumber" AND "near me"', detail: 'local intent' },
        { title: '"best" AND "plumber" AND "Dallas"', detail: 'comparison hunts' },
        { title: '"clogged" AND "drain" AND "fix"', detail: 'DIY vs pro' },
        { title: '"leak" AND "ceiling" AND "help"', detail: 'panic posts' },
      ],
    },
  ],
}

/** A community suggestion — always Facebook or Reddit in this flow. */
export interface GroupPick {
  id: string
  platform: 'facebook' | 'reddit'
  name: string
  detail: string
}

/**
 * Rotating mock community sets. A "no" on the familiar question lets the
 * current set go and pulls the next one — cycling keeps the loop alive until
 * the user recognizes somewhere worth listening (and posting).
 */
export const GROUP_SETS: GroupPick[][] = [
  [
    { id: 'fb-buy-sell', platform: 'facebook', name: 'Edmonton Buy and Sell', detail: '48.2k members · Buy & Sell' },
    { id: 'rd-edmonton', platform: 'reddit', name: 'r/edmonton', detail: '312k members · City community' },
  ],
  [
    { id: 'fb-homeowners', platform: 'facebook', name: 'Edmonton Homeowners', detail: '21.7k members · Neighbourhood help' },
    { id: 'rd-homeimprovement', platform: 'reddit', name: 'r/HomeImprovement', detail: '3.1m members · DIY repairs' },
  ],
  [
    { id: 'fb-trades', platform: 'facebook', name: 'YEG Trades & Services', detail: '9.4k members · Local pros' },
    { id: 'rd-alberta', platform: 'reddit', name: 'r/alberta', detail: '218k members · Province-wide' },
  ],
]
