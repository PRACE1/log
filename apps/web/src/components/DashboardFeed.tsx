import { useEffect, useState } from 'react'
import { useSquircleClip, useToast } from '@listeningkit/ui'
import { SOCIAL_ICONS, type SocialIcon } from '@/lib/social-icons'
import { getFeed, type FeedItem, type FeedPlatform } from '@/lib/feed'
import { DashboardFeedHeader } from './DashboardFeedHeader'
import { FeedCardFrame } from './cards/FeedCardFrame'
import { FacebookPostImage, FacebookPostText } from './cards/FacebookCard'
import { RedditPostText, RedditComment } from './cards/RedditCard'
import { TwitterPostText, TwitterPostImage } from './cards/TwitterCard'

/** Full-size design widths in px — frames scale these down to fit. */
const CARD_WIDTHS: Record<FeedPlatform, number> = {
  facebook: 713.42,
  x: 484,
  reddit: 864
}

function FeedCard({ item }: { item: FeedItem }) {
  switch (item.platform) {
    case 'facebook':
      return item.variant === 'post-image' ? (
        <FacebookPostImage
          authorName={item.authorName}
          timeAgo={item.timeAgo}
          lines={item.body}
          imageSrc={item.imageSrc}
          avatarUrl={item.avatarUrl}
          likes={item.likes}
          comments={item.comments}
          shares={item.shares ?? '0 shares'}
        />
      ) : (
        <FacebookPostText
          authorName={item.authorName}
          timeAgo={item.timeAgo}
          lines={item.body}
          avatarUrl={item.avatarUrl}
          likes={item.likes}
          comments={item.comments}
          shares={item.shares ?? '0 shares'}
        />
      )
    case 'x':
      return item.variant === 'post-image' ? (
        <TwitterPostImage
          authorName={item.authorName}
          handle={item.handle}
          body={item.body.join(' ')}
          timestamp={item.timestamp ?? item.timeAgo}
          avatarUrl={item.avatarUrl}
          imageSrc={item.imageSrc}
          views={item.views}
          replies={item.replies}
          reposts={item.reposts}
          likes={item.likes}
        />
      ) : (
        <TwitterPostText
          authorName={item.authorName}
          handle={item.handle}
          body={item.body.join(' ')}
          timestamp={item.timestamp ?? item.timeAgo}
          avatarUrl={item.avatarUrl}
          views={item.views}
          replies={item.replies}
          reposts={item.reposts}
          likes={item.likes}
        />
      )
    case 'reddit':
      return item.variant === 'comment' ? (
        <RedditComment
          authorName={item.authorName}
          body={item.body.join(' ')}
          likes={item.likes}
          shares={item.shares ?? '0'}
        />
      ) : (
        <RedditPostText
          communityName={item.community ?? item.authorName}
          title={item.title ?? item.body.join(' ')}
          likes={item.likes}
          shares={item.shares ?? '0'}
        />
      )
  }
}

function FeedColumn({ icon, items }: { icon: SocialIcon; items: FeedItem[] }) {
  const naturalWidth = CARD_WIDTHS[icon.id as FeedPlatform] ?? 484
  return (
    <div className="lk-no-scrollbar flex min-h-0 flex-col gap-3 overflow-y-auto pb-4">
      <DashboardFeedHeader icon={icon} />
      {items.map((item) => (
        <FeedCardFrame key={item.id} naturalWidth={naturalWidth}>
          <FeedCard item={item} />
        </FeedCardFrame>
      ))}
    </div>
  )
}

function FeedSkeletonColumn({ icon }: { icon: SocialIcon }) {
  const clip = useSquircleClip<HTMLDivElement>(20)

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <DashboardFeedHeader icon={icon} />
      <section
        ref={clip.ref}
        style={clip.style}
        aria-label={`${icon.label} feed loading`}
        className="flex flex-col gap-2.5 bg-white p-5"
      >
        <div className="h-3 animate-pulse rounded-full bg-black/5" />
        <div className="h-3 w-4/5 animate-pulse rounded-full bg-black/5" />
        <div className="h-3 w-3/5 animate-pulse rounded-full bg-black/5" />
      </section>
    </div>
  )
}

export function DashboardFeed() {
  const [items, setItems] = useState<FeedItem[] | null>(null)
  const { error: notifyError } = useToast()

  useEffect(() => {
    let cancelled = false
    getFeed()
      .then((res) => {
        if (!cancelled) setItems(res.items)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          notifyError('Feed failed to load', err instanceof Error ? err.message : 'Could not load the feed.')
          setItems([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [notifyError])

  const byPlatform = (platform: FeedPlatform) => (items ?? []).filter((item) => item.platform === platform)

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-3 gap-4 sm:grid-cols-2 sm:grid-rows-2 sm:gap-5 xl:grid-cols-3 xl:grid-rows-1">
      {SOCIAL_ICONS.map((icon) =>
        items === null ? (
          <FeedSkeletonColumn key={icon.id} icon={icon} />
        ) : (
          <FeedColumn key={icon.id} icon={icon} items={byPlatform(icon.id as FeedPlatform)} />
        )
      )}
    </div>
  )
}
