import { FacebookCard } from './FacebookCard'
import { TwitterCard } from './TwitterCard'
import { RedditCard } from './RedditCard'

export type CardPlatform = 'facebook' | 'x' | 'reddit'

export type PlatformCardProps = {
  platform: CardPlatform
  authorName?: string
  timeAgo?: string
  lines?: string[]
  imageSrc?: string
  className?: string
}

function CardHtml({
  platform,
  authorName,
  timeAgo,
  lines,
  imageSrc
}: Pick<PlatformCardProps, 'platform' | 'authorName' | 'timeAgo' | 'lines' | 'imageSrc'>) {
  switch (platform) {
    case 'facebook':
      return <FacebookCard variant="text" authorName={authorName} timeAgo={timeAgo} lines={lines} imageSrc={imageSrc} />
    case 'x':
      return <TwitterCard variant="text" authorName={authorName} timeAgo={timeAgo} lines={lines} imageSrc={imageSrc} />
    case 'reddit':
      return <RedditCard variant="text" authorName={authorName} timeAgo={timeAgo} lines={lines} imageSrc={imageSrc} />
  }
}

export function PlatformCard({ platform, authorName, timeAgo, lines, imageSrc, className = '' }: PlatformCardProps) {
  return (
    <div className={`relative w-full overflow-x-clip ${className}`}>
      <div className="flex justify-center py-10">
        <div className="origin-center scale-[0.7] sm:scale-100">
          <CardHtml platform={platform} authorName={authorName} timeAgo={timeAgo} lines={lines} imageSrc={imageSrc} />
        </div>
      </div>
    </div>
  )
}