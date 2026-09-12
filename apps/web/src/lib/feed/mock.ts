export type FeedPlatform = 'facebook' | 'x' | 'reddit'

export type FeedVariant = 'post-text' | 'post-image' | 'comment'

export interface FeedItem {
  id: string
  platform: FeedPlatform
  variant: FeedVariant
  authorName: string
  handle?: string
  community?: string
  timeAgo: string
  timestamp?: string
  title?: string
  body: string[]
  imageSrc?: string
  avatarUrl?: string
  likes: string
  comments: string
  shares?: string
  views?: string
  replies?: string
  reposts?: string
}

export interface FeedResponse {
  items: FeedItem[]
}

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`

/** Stand-in rows until the real Hono backend lands. Same shape, same routes. */
export const MOCK_FEED_ITEMS: FeedItem[] = [
  {
    id: 'fb-img-1',
    platform: 'facebook',
    variant: 'post-image',
    authorName: 'Piyatida Kamolmas',
    timeAgo: '15h',
    body: [
      'Before/after from today’s water heater swap in Dallas.',
      'If your unit is over 10 years old, get it checked!'
    ],
    imageSrc: img('photo-1522708323590-d24dbb6b0267'),
    likes: '650',
    comments: '48 comments',
    shares: '135 shares'
  },
  {
    id: 'fb-txt-1',
    platform: 'facebook',
    variant: 'post-text',
    authorName: 'Marcus Webb',
    timeAgo: '3h',
    body: [
      'PSA: turn off your main water valve before vacation.',
      'Came home to a flooded kitchen last night. Learn from me.'
    ],
    likes: '128',
    comments: '32 comments',
    shares: '12 shares'
  },
  {
    id: 'x-img-1',
    platform: 'x',
    variant: 'post-image',
    authorName: 'Dallas Homeowner',
    handle: '@dallasplumb911',
    timeAgo: '2h',
    timestamp: '9:41AM · Sep 12 2026 · Twitter for iPhone',
    body: ['Shoutout to the crew that fixed our slab leak today. Floor is dry for the first time in a week!'],
    imageSrc: img('photo-1506905925346-21bda4d32df4'),
    likes: '1,903',
    comments: '214 comments',
    views: '8.2K',
    replies: '214',
    reposts: '96'
  },
  {
    id: 'x-txt-1',
    platform: 'x',
    variant: 'post-text',
    authorName: 'Simon Fairhurst',
    handle: '@siimonfairhurst',
    timeAgo: '1d',
    timestamp: '1:27PM · Oct 4 2022 · Twitter for iPhone',
    body: ['Figma, Webflow, or Framer. Which one will take the lead in 2023 and be the go-to for digital design?'],
    likes: '3,987',
    comments: '1,240 comments',
    views: '1.1M',
    replies: '1,240',
    reposts: '5,579'
  },
  {
    id: 'r-post-1',
    platform: 'reddit',
    variant: 'post-text',
    authorName: 'u/dallasplumb911',
    community: 'r/Plumbing',
    timeAgo: '15h',
    title: 'Need a plumber in Dallas ASAP',
    body: ['Toilet broke and it’s leaking all over the bathroom floor!'],
    likes: '342',
    comments: '86 comments',
    shares: '18'
  },
  {
    id: 'r-cmt-1',
    platform: 'reddit',
    variant: 'comment',
    authorName: 'u/plumber_finder',
    timeAgo: '12h',
    body: ['I can swing by tomorrow morning — DM me your cross streets.'],
    likes: '156',
    comments: '4 comments',
    shares: '4'
  },
  {
    id: 'fb-img-2',
    platform: 'facebook',
    variant: 'post-image',
    authorName: 'Dana Whitfield',
    timeAgo: '6h',
    body: [
      'Kitchen reno is finally done — new faucet, no more drips.',
      'Highly recommend getting the ceramic valves.'
    ],
    imageSrc: img('photo-1517842645767-c639042777db'),
    likes: '89',
    comments: '14 comments',
    shares: '3 shares'
  },
  {
    id: 'fb-txt-2',
    platform: 'facebook',
    variant: 'post-text',
    authorName: 'Priya Nair',
    timeAgo: '1d',
    body: [
      'Anyone know a 24/7 emergency plumber near Deep Ellum?',
      'Water heater burst an hour ago, need help fast.'
    ],
    likes: '45',
    comments: '21 comments',
    shares: '2 shares'
  },
  {
    id: 'x-txt-2',
    platform: 'x',
    variant: 'post-text',
    authorName: 'Mike Torres',
    handle: '@mike_torres',
    timeAgo: '5h',
    timestamp: '4:02PM · Sep 12 2026 · Twitter for Android',
    body: ['PSA: if your water bill doubled and you hear running water, check your slab. Learned the hard way.'],
    likes: '512',
    comments: '87 comments',
    views: '3.4K',
    replies: '87',
    reposts: '41'
  },
  {
    id: 'r-cmt-2',
    platform: 'reddit',
    variant: 'comment',
    authorName: 'u/diy_dan',
    timeAgo: '8h',
    body: ['Shut the main off first, then drain the lowest faucet in the house before you touch anything.'],
    likes: '98',
    comments: '2 comments',
    shares: '1'
  }
]
