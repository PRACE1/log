import { Fragment } from 'react'
import { highlightQuote } from './QuoteHighlight'

/**
 * from Paper
 * https://app.paper.design/file/01M1DEEQY42BZFA01XT004M9ZZ/01K4GP58P8JRM8PGBP0586VKYV/16V-0 * on Sep 12, 2026
 *
 * NOTE: Paper exports Tailwind v4 utilities; this app runs Tailwind v3.4, so
 * v4-only classes are converted to v3 arbitrary-value equivalents with the
 * same computed values (spacing base 0.25rem):
 * w-216 -> w-[54rem], gap-6.5 -> gap-[1.625rem], gap-6.25 -> gap-[1.5625rem],
 * w-27/h-27 -> w-[6.75rem]/h-[6.75rem], gap-2.75 -> gap-[0.6875rem],
 * gap-4.25 -> gap-[1.0625rem], leading-11 -> leading-[2.75rem],
 * w-10.25/h-10.25 -> w-[2.5625rem]/h-[2.5625rem], w-196 -> w-[49rem],
 * leading-16.75 -> leading-[4.1875rem], pt-3.75 -> pt-[0.9375rem],
 * pl-0.75 -> pl-[0.1875rem], gap-4.5 -> gap-[1.125rem], h-9.5 -> h-[2.375rem],
 * pt-2.25 -> pt-[0.5625rem], wrap-anywhere -> [overflow-wrap:anywhere],
 * font-features-['case'] -> [font-feature-settings:'case'],
 * -mt-8.75 -> -mt-[2.1875rem].
 */

/**
 * Post variant (Paper 16V-0): Community Name / Edit This Text! / 999+ / 999+.
 */
export function RedditPostText({
  communityName = 'Community Name',
  title = 'Edit This Text!',
  likes = '999+',
  shares = '999+',
  highlight = [],
}: {
  communityName?: string
  title?: string
  likes?: string
  shares?: string
  /** Listened phrases to quote-highlight inside the title. */
  highlight?: string[]
}) {
  return (
    <div className="[font-synthesis:none] [overflow-wrap:anywhere] w-[54rem] flex flex-col items-start p-10 rounded-[30px] gap-[1.5625rem] filter-[drop-shadow(#0000000D_0px_0px_6px)] bg-white antialiased">
      <div className="self-stretch min-w-0 flex items-center gap-[1.625rem]">
        <div className="w-[6.75rem] h-[6.75rem] flex items-center justify-center rounded-[160px] gap-2.5 shrink-0 filter-[drop-shadow(#00000014_5px_7px_6.5px)] bg-[#FF4500]">
          <div className="w-[6.75rem] h-[6.75rem] shrink-0 bg-cover bg-position-[50%]" style={{ backgroundImage: 'url(https://app.paper.design/file-assets/01M1DEEQY42BZFA01XT004M9ZZ/4KNSEVGXV2C467QDJ501ZPN2CM.png)' }} />
        </div>
        <div className="flex flex-col items-start gap-[0.6875rem]">
          <div className="flex items-center gap-[1.0625rem]">
            <div className="text-[36px] [letter-spacing:-0.408px] w-max font-['Satoshi',system-ui,sans-serif] font-[700] leading-[2.75rem] text-black">
              {communityName}
            </div>
            <div className="w-[2.5625rem] h-[2.5625rem] shrink-0 bg-cover bg-position-[50%]" style={{ backgroundImage: 'url(https://app.paper.design/file-assets/01M1DEEQY42BZFA01XT004M9ZZ/17VA2WGYXYN7E6Z8HDJ1HPCCD4.png)' }} />
          </div>
          <div className="flex items-start gap-2.5">
            <div className="shrink-0 bg-cover bg-position-[50%] size-8" style={{ backgroundImage: 'url(https://app.paper.design/file-assets/01M1DEEQY42BZFA01XT004M9ZZ/4EHCR5TJH7HHCZC4VR8QS0YN21.png)' }} />
            <div className="shrink-0 bg-cover bg-position-[50%] size-8" style={{ backgroundImage: 'url(https://app.paper.design/file-assets/01M1DEEQY42BZFA01XT004M9ZZ/2X8GNXNAD00XVCBK7K4ARJG3VY.png)' }} />
            <div className="shrink-0 bg-cover bg-position-[50%] size-8" style={{ backgroundImage: 'url(https://app.paper.design/file-assets/01M1DEEQY42BZFA01XT004M9ZZ/11K0FKCNFWMCN6K867FTYT8AVJ.png)' }} />
            <div className="shrink-0 bg-cover bg-position-[50%] size-8" style={{ backgroundImage: 'url(https://app.paper.design/file-assets/01M1DEEQY42BZFA01XT004M9ZZ/62YF63BDPQP3CJNPYMKMZ1ZP51.png)' }} />
            <div className="shrink-0 bg-cover bg-position-[50%] size-8" style={{ backgroundImage: 'url(https://app.paper.design/file-assets/01M1DEEQY42BZFA01XT004M9ZZ/636RYS0NRTM6ABP3GN92QX4PDC.png)' }} />
            <div className="shrink-0 bg-cover bg-position-[50%] size-8" style={{ backgroundImage: 'url(https://app.paper.design/file-assets/01M1DEEQY42BZFA01XT004M9ZZ/3TSWG3TFNKWHRR45R84Q3DPV1S.png)' }} />
            <div className="shrink-0 bg-cover bg-position-[50%] size-8" style={{ backgroundImage: 'url(https://app.paper.design/file-assets/01M1DEEQY42BZFA01XT004M9ZZ/6MD71FFC3N1SSVSWDA7ZWBTDHV.png)' }} />
            <div className="shrink-0 bg-cover bg-position-[50%] size-8" style={{ backgroundImage: 'url(https://app.paper.design/file-assets/01M1DEEQY42BZFA01XT004M9ZZ/38YQS2YQ29TS1S1FCT2WJ337HB.png)' }} />
            <div className="shrink-0 bg-cover bg-position-[50%] size-8" style={{ backgroundImage: 'url(https://app.paper.design/file-assets/01M1DEEQY42BZFA01XT004M9ZZ/7WZ6XFYW5DQV1J8GB2CWW9B1MB.png)' }} />
            <div className="shrink-0 bg-cover bg-position-[50%] size-8" style={{ backgroundImage: 'url(https://app.paper.design/file-assets/01M1DEEQY42BZFA01XT004M9ZZ/75SH9RN2B0EZQ2TX2V688YHQRP.png)' }} />
          </div>
        </div>
      </div>
      <div className="self-stretch min-w-0 flex flex-col items-start gap-2.5">
        <div className="w-[49rem] self-stretch min-w-0 text-[54px] leading-[4.1875rem] line-clamp-2 font-['Satoshi',system-ui,sans-serif] font-[700] [font-feature-settings:'case'] text-black">
          {highlightQuote(title, highlight)}
        </div>
        <div className="self-stretch min-w-0 flex items-center justify-between pt-[0.9375rem]">
          <div className="flex items-center pr-10 pl-[0.1875rem] overflow-clip gap-[1.125rem]">
            <svg viewBox="0 0 38 34.83" width="38" height="34.83" xmlns="http://www.w3.org/2000/svg" style={{ width: '38px', height: '34.83px', overflow: 'visible', flexShrink: '0' }}>
              <path d="M28.591 0.000C22.167 0.000 19.000 6.333 19.000 6.333C19.000 6.333 15.834 0.000 9.409 0.000C4.189 0.000 0.054 4.368 0.001 9.580C-0.108 20.398 8.583 28.092 18.109 34.557C18.372 34.736 18.682 34.832 19.000 34.832C19.318 34.832 19.628 34.736 19.891 34.557C29.416 28.092 38.107 20.398 37.999 9.580C37.946 4.368 33.811 0.000 28.591 0.000Z" vectorEffect="non-scaling-stroke" fill="none" stroke="#A4A4A4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="text-[36px] [letter-spacing:-0.408px] w-max font-['Satoshi',system-ui,sans-serif] font-[500] leading-[2.75rem] text-[#A4A4A4]">
              {likes}
            </div>
          </div>
          <div className="flex items-center gap-[1.125rem]">
            <div className="w-[29.23px] h-[2.375rem] relative shrink-0">
              <svg viewBox="0 0 29.23 38" width="29.23" height="38" xmlns="http://www.w3.org/2000/svg" style={{ left: '0px', top: '0px', width: '29.23px', height: '38px', overflow: 'visible', position: 'absolute' }}>
                <path transform="matrix(1 0 0 1 0 13.154)" d="M21.923 0.000C21.923 0.000 25.577 0.000 25.577 0.000C26.546 0.000 27.475 0.385 28.161 1.070C28.846 1.755 29.231 2.685 29.231 3.654C29.231 3.654 29.231 21.192 29.231 21.192C29.231 22.161 28.846 23.091 28.161 23.776C27.475 24.461 26.546 24.461 25.577 24.846C25.577 24.846 3.654 24.846 3.654 24.846C2.685 24.846 1.755 24.461 1.070 23.776C0.385 23.091 0.000 22.161 0.000 21.192C0.000 21.192 0.000 3.654 0.000 3.654C0.000 2.685 0.385 1.755 1.070 1.070C1.755 0.385 2.685 -0.000 3.654 0.000C3.654 0.000 7.308 0.000 7.308 0.000" vectorEffect="non-scaling-stroke" fill="none" stroke="#A4A4A4" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                <path transform="matrix(1 0 0 1 7.308 0)" d="M14.615 7.308C14.615 7.308 7.308 0.000 7.308 0.000C7.308 0.000 0.000 7.308 0.000 7.308" vectorEffect="non-scaling-stroke" fill="none" stroke="#A4A4A4" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                <path transform="matrix(1 0 0 1 14.615 0)" d="M0.000 24.938C0.000 24.938 0.000 0.000 0.000 0.000" vectorEffect="non-scaling-stroke" fill="none" stroke="#A4A4A4" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex items-center pt-[0.5625rem] gap-2.5">
              <div className="text-[36px] leading-9 [letter-spacing:-0.408px] w-max font-['Satoshi',system-ui,sans-serif] font-[500] text-[#A4A4A4]">
                {shares}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Comment variant (Paper 17T-0): Username / This is a comment / 999+ / 999+.
 * from Paper
 * https://app.paper.design/file/01M1DEEQY42BZFA01XT004M9ZZ/01K4GP58P8JRM8PGBP0586VKYV/17T-0
 * on Sep 12, 2026
 */
export function RedditComment({
  authorName = 'Username',
  body = 'This is a comment',
  likes = '999+',
  shares = '999+',
  highlight = [],
}: {
  authorName?: string
  body?: string
  likes?: string
  shares?: string
  /** Listened phrases to quote-highlight inside the body. */
  highlight?: string[]
}) {
  return (
    <div className="[font-synthesis:none] [overflow-wrap:anywhere] w-[54rem] flex flex-col items-start p-10 rounded-[30px] gap-[1.5625rem] filter-[drop-shadow(#0000000D_0px_0px_6px)] bg-white antialiased">
      <div className="self-stretch min-w-0 flex items-center gap-[1.625rem]">
        <div className="w-[6.75rem] h-[6.75rem] flex items-center justify-center rounded-[160px] gap-2.5 shrink-0 filter-[drop-shadow(#00000014_5px_7px_6.5px)] bg-[#FF4500]">
          <div className="w-[6.75rem] h-[6.75rem] rounded-[89px] shrink-0 bg-cover bg-position-[50%]" style={{ backgroundImage: 'url(https://app.paper.design/file-assets/01M1DEEQY42BZFA01XT004M9ZZ/125X4DANHK3GWGN5VGZNF5PS01.png)' }} />
        </div>
        <div className="flex flex-col items-start justify-center">
          <div className="flex items-center gap-[1.0625rem]">
            <div className="text-[36px] [letter-spacing:-0.408px] w-max font-['Satoshi',system-ui,sans-serif] font-[700] leading-[2.75rem] text-black">
              {authorName}
            </div>
          </div>
          <div className="h-8 flex items-start gap-2.5 shrink-0 -mt-[2.1875rem]" />
        </div>
      </div>
      <div className="self-stretch min-w-0 flex flex-col items-start gap-2.5">
        <div className="w-[49rem] self-stretch min-w-0 text-[54px] leading-[4.1875rem] line-clamp-2 font-['Satoshi',system-ui,sans-serif] font-[700] [font-feature-settings:'case'] text-black">
          {highlightQuote(body, highlight)}
        </div>
        <div className="self-stretch min-w-0 flex items-center justify-between pt-[0.9375rem]">
          <div className="flex items-center pr-10 pl-[0.1875rem] overflow-clip gap-[1.125rem]">
            <svg viewBox="0 0 38 34.83" width="38" height="34.83" xmlns="http://www.w3.org/2000/svg" style={{ width: '38px', height: '34.83px', overflow: 'visible', flexShrink: '0' }}>
              <path d="M28.591 0.000C22.167 0.000 19.000 6.333 19.000 6.333C19.000 6.333 15.834 0.000 9.409 0.000C4.189 0.000 0.054 4.368 0.001 9.580C-0.108 20.398 8.583 28.092 18.109 34.557C18.372 34.736 18.682 34.832 19.000 34.832C19.318 34.832 19.628 34.736 19.891 34.557C29.416 28.092 38.107 20.398 37.999 9.580C37.946 4.368 33.811 0.000 28.591 0.000Z" vectorEffect="non-scaling-stroke" fill="none" stroke="#A4A4A4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="text-[36px] [letter-spacing:-0.408px] w-max font-['Satoshi',system-ui,sans-serif] font-[500] leading-[2.75rem] text-[#A4A4A4]">
              {likes}
            </div>
          </div>
          <div className="flex items-center gap-[1.125rem]">
            <div className="w-[29.23px] h-[2.375rem] relative shrink-0">
              <svg viewBox="0 0 29.23 38" width="29.23" height="38" xmlns="http://www.w3.org/2000/svg" style={{ left: '0px', top: '0px', width: '29.23px', height: '38px', overflow: 'visible', position: 'absolute' }}>
                <path transform="matrix(1 0 0 1 0 13.154)" d="M21.923 0.000C21.923 0.000 25.577 0.000 25.577 0.000C26.546 0.000 27.475 0.385 28.161 1.070C28.846 1.755 29.231 2.685 29.231 3.654C29.231 3.654 29.231 21.192 29.231 21.192C29.231 22.161 28.846 23.091 28.161 23.776C27.475 24.461 26.546 24.846 25.577 24.846C25.577 24.846 3.654 24.846 3.654 24.846C2.685 24.846 1.755 24.461 1.070 23.776C0.385 23.091 0.000 22.161 0.000 21.192C0.000 21.192 0.000 3.654 0.000 3.654C0.000 2.685 0.385 1.755 1.070 1.070C1.755 0.385 2.685 -0.000 3.654 0.000C3.654 0.000 7.308 0.000 7.308 0.000" vectorEffect="non-scaling-stroke" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                <path transform="matrix(1 0 0 1 7.308 0)" d="M14.615 7.308C14.615 7.308 7.308 0.000 7.308 0.000C7.308 0.000 0.000 7.308 0.000 7.308" vectorEffect="non-scaling-stroke" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                <path transform="matrix(1 0 0 1 14.615 0)" d="M0.000 24.938C0.000 24.938 0.000 0.000 0.000 0.000" vectorEffect="non-scaling-stroke" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex items-center pt-[0.5625rem] gap-2.5">
              <div className="text-[36px] leading-9 [letter-spacing:-0.408px] w-max font-['Satoshi',system-ui,sans-serif] font-[500] text-white">
                {shares}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Reddit post card shell used by PlatformCard.
 * Variants mirror FacebookCard: image + text.
 */

export type RedditPostVariant = 'image' | 'text'

export type RedditPostProps = {
  variant?: RedditPostVariant
  authorName?: string
  subreddit?: string
  timeAgo?: string
  title?: string
  lines?: string[]
  imageSrc?: string
  imageAlt?: string
  upvotes?: number
  comments?: number
  className?: string
  /** Listened phrases to quote-highlight inside title and lines. */
  highlight?: string[]
}

export function RedditCard({
  variant = 'text',
  authorName = 'u/plumber_finder',
  subreddit = 'r/Plumbing',
  timeAgo = '15h',
  title = 'Need a plumber in Dallas ASAP',
  lines = [],
  imageSrc,
  imageAlt = 'Post image',
  upvotes = 0,
  comments = 0,
  className = '',
  highlight = []
}: RedditPostProps) {
  return (
    <div className={`flex flex-col gap-3 rounded-[21.78px] bg-white p-5 antialiased [box-shadow:#0000000D_0px_14px_14px_9px] ${className}`}>
      <div className="flex items-center gap-2 text-sm text-[#576F76]">
        <span className="font-bold text-[#1C1E21]">{subreddit}</span>
        <span>•</span>
        <span>
          Posted by {authorName} {timeAgo} ago
        </span>
      </div>
      <p className="text-xl font-bold text-[#1C1E21]">{highlightQuote(title, highlight)}</p>
      {lines.length > 0 && (
        <p className="whitespace-pre-line text-[16px] leading-6 text-[#1C1C22]">
          {lines.map((line, index) => (
            <Fragment key={index}>
              {index > 0 && <br />}
              {highlightQuote(line, highlight)}
            </Fragment>
          ))}
        </p>
      )}
      {variant === 'image' &&
        (imageSrc ? (
          <img src={imageSrc} alt={imageAlt} className="max-h-[480px] w-full rounded-xl object-cover" />
        ) : (
          <div className="h-64 w-full rounded-xl bg-[#D9D9D9]" />
        ))}
      <div className="flex items-center gap-4 text-sm font-bold text-[#576F76]">
        <span>{upvotes} upvotes</span>
        <span>{comments} comments</span>
      </div>
    </div>
  )
}

/* Legacy image/text shell retained for PlatformCard; Paper variants above. */
