/**
 * X (Twitter) post card shell used by PlatformCard.
 * Variants mirror FacebookCard: image + text.
 *
 * Paper designs live alongside as static variants (Tailwind v4 utilities
 * converted to v3 arbitrary-value equivalents, spacing base 0.25rem):
 * - TwitterPostText (Paper 1B1-0): text-only post.
 * - TwitterPostImage (Paper 1C8-0): post with image block.
 * v4-only conversions: wrap-anywhere -> [overflow-wrap:anywhere],
 * w-121 -> w-[30.25rem], w-113 -> w-[28.25rem],
 * leading-7.5 -> leading-[1.875rem], h-63.5 -> h-[15.875rem].
 */

export type TwitterPostVariant = 'image' | 'text'

export type TwitterPostProps = {
  variant?: TwitterPostVariant
  authorName?: string
  handle?: string
  timeAgo?: string
  lines?: string[]
  imageSrc?: string
  imageAlt?: string
  replies?: number
  reposts?: number
  likes?: number
  className?: string
}

export function TwitterCard({
  variant = 'text',
  authorName = 'Dallas Homeowner',
  handle = '@dallasplumb911',
  timeAgo = '15h',
  lines = [],
  imageSrc,
  imageAlt = 'Post image',
  replies = 0,
  reposts = 0,
  likes = 0,
  className = ''
}: TwitterPostProps) {
  return (
    <div className={`flex gap-3 rounded-[21.78px] bg-white p-5 antialiased [box-shadow:#0000000D_0px_14px_14px_9px] ${className}`}>
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-black text-lg font-bold text-white">
        {authorName.charAt(0).toUpperCase()}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-[15px]">
          <span className="truncate font-bold text-[#0F1419]">{authorName}</span>
          <span className="truncate text-[#536471]">
            {handle} · {timeAgo}
          </span>
        </div>
        {lines.length > 0 && <p className="whitespace-pre-line text-[16px] leading-6 text-[#0F1419]">{lines.join('\n')}</p>}
        {variant === 'image' &&
          (imageSrc ? (
            <img src={imageSrc} alt={imageAlt} className="mt-1 max-h-[420px] w-full rounded-2xl border border-slate-200 object-cover" />
          ) : (
            <div className="mt-1 h-56 w-full rounded-2xl bg-[#D9D9D9]" />
          ))}
        <div className="mt-1 flex items-center justify-between text-[13px] text-[#536471]">
          <span>{replies} replies</span>
          <span>{reposts} reposts</span>
          <span>{likes} likes</span>
        </div>
      </div>
    </div>
  )
}

const TWITTER_AVATAR =
  'https://app.paper.design/file-assets/01M1DEEQY42BZFA01XT004M9ZZ/6846K9F56XRA9H1JAEVWE4ATQV.png'

const TWITTER_PHOTO =
  'https://app.paper.design/file-assets/01M1DEEQY42BZFA01XT004M9ZZ/168X4320M32JPKWZY0S6D9PB15.jpg'

/**
 * Text variant (Paper 1B1-0): header + text + timestamp + divider + stats.
 * from Paper
 * https://app.paper.design/file/01M1DEEQY42BZFA01XT004M9ZZ/01K4GP58P8JRM8PGBP0586VKYV/1B1-0
 * on Sep 12, 2026
 */
export function TwitterPostText({
  avatarUrl = TWITTER_AVATAR,
  authorName = 'Username',
  handle = '@username',
  body = 'Edit this text',
  timestamp = '12:00 PM · Sep 12, 2026',
  views = '999',
  replies = '999',
  reposts = '999',
  likes = '999',
}: {
  avatarUrl?: string
  authorName?: string
  handle?: string
  body?: string
  timestamp?: string
  views?: string
  replies?: string
  reposts?: string
  likes?: string
}) {
  return (
    <div className="[font-synthesis:none] [overflow-wrap:anywhere] w-[30.25rem] flex flex-col items-start p-4 rounded-[16px] gap-4 bg-white antialiased">
      <div className="h-8 self-stretch min-w-0 overflow-clip relative shrink-0 bg-white">
        <div className="left-0 top-0 flex items-center gap-4 absolute">
          <div className="relative shrink-0 size-8">
            <div className="left-[0%] top-[0%] rounded-[50%] absolute bg-cover bg-position-[50%] size-full" style={{ backgroundImage: `url(${avatarUrl})` }} />
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1">
              <div className="text-[12px] w-max font-['Satoshi',system-ui,sans-serif] font-[700] leading-4 text-[#171717]">
                {authorName}
              </div>
              <div className="overflow-clip relative shrink-0 size-4">
                <svg viewBox="0 0 13.67 13.67" width="13.67" height="13.67" xmlns="http://www.w3.org/2000/svg" style={{ left: '1.1667px', top: '1.1667px', width: '13.67px', height: '13.67px', overflow: 'visible', position: 'absolute' }}>
                  <path d="M13.667 6.833C13.667 5.880 13.080 5.053 12.207 4.607C12.513 3.680 12.340 2.673 11.667 2.000C10.993 1.327 9.987 1.153 9.060 1.460C8.620 0.587 7.787 0.000 6.833 0.000C5.880 0.000 5.053 0.587 4.613 1.460C3.680 1.153 2.673 1.327 2.000 2.000C1.327 2.673 1.160 3.680 1.467 4.607C0.593 5.053 0.000 5.880 0.000 6.833C0.000 7.787 0.593 8.613 1.467 9.060C1.160 9.987 1.327 10.993 2.000 11.667C2.673 12.340 3.680 12.507 4.607 12.207C5.053 13.080 5.880 13.667 6.833 13.667C7.787 13.667 8.620 13.080 9.060 12.207C9.987 12.507 10.993 12.340 11.667 11.667C12.340 10.993 12.513 9.987 12.207 9.060C13.080 8.613 13.667 7.787 13.667 6.833ZM5.860 9.633C5.860 9.633 3.367 7.140 3.367 7.140C3.367 7.140 4.307 6.193 4.307 6.193C4.307 6.193 5.813 7.700 5.813 7.700C5.813 7.700 9.013 4.213 9.013 4.213C9.013 4.213 9.993 5.120 9.993 5.120C9.993 5.120 5.860 9.633 5.860 9.633Z" fillRule="nonzero" fill="#1D9BF0" />
                </svg>
              </div>
            </div>
            <div className="text-[12px] w-max font-['Satoshi',system-ui,sans-serif] leading-4 text-[#536471]">
              {handle}
            </div>
          </div>
        </div>
        <svg viewBox="0 0 16 16" width="16" height="16" xmlns="http://www.w3.org/2000/svg" style={{ left: '436px', top: '0px', width: '16px', height: '16px', overflow: 'visible', position: 'absolute' }}>
          <g transform="matrix(1 0 0 1 2 6.667)">
            <path d="M0.000 1.333C0.000 0.600 0.600 0.000 1.333 0.000C2.067 0.000 2.667 0.600 2.667 1.333C2.667 2.067 2.067 2.667 1.333 2.667C0.600 2.667 0.000 2.067 0.000 1.333ZM6.000 2.667C6.733 2.667 7.333 2.067 7.333 1.333C7.333 0.600 6.733 0.000 6.000 0.000C5.267 0.000 4.667 0.600 4.667 1.333C4.667 2.067 5.267 2.667 6.000 2.667ZM10.667 2.667C11.400 2.667 12.000 2.067 12.000 1.333C12.000 0.600 11.400 0.000 10.667 0.000C9.933 0.000 9.333 0.600 9.333 1.333C9.333 2.067 9.933 2.667 10.667 2.667Z" fillRule="nonzero" fill="#536471" />
          </g>
        </svg>
      </div>
      <div className="w-[28.25rem] self-stretch min-w-0 text-[24px] tracking-[-0.01em] line-clamp-3 font-['Satoshi',system-ui,sans-serif] font-[300] leading-[1.875rem] text-black">
        {body}
      </div>
      <div className="w-[28.25rem] self-stretch min-w-0 text-[12px] tracking-[-0.01em] font-['Satoshi',system-ui,sans-serif] font-[300] leading-4 text-black">
        {timestamp}
      </div>
      <svg viewBox="0 0 452 1" width="452" height="1" xmlns="http://www.w3.org/2000/svg" style={{ alignSelf: 'stretch', minWidth: '0px', height: '1px', overflow: 'visible', flexShrink: '0' }}>
        <path d="M0 0L452.000 0" vectorEffect="non-scaling-stroke" fill="none" stroke="#C8D1D9" />
      </svg>
      <div className="flex items-start gap-4 bg-white">
        <div className="flex items-center gap-1">
          <div className="overflow-clip relative shrink-0 size-4">
            <svg viewBox="0 0 10.67 12" preserveAspectRatio="none" width="10.67" height="12" xmlns="http://www.w3.org/2000/svg" style={{ left: '2.6667px', top: '2px', width: '10.67px', height: '12px', overflow: 'visible', position: 'absolute' }}>
              <path d="M3.167 12.000C3.167 12.000 3.167 0.000 3.167 0.000C3.167 0.000 4.500 0.000 4.500 0.000C4.500 0.000 4.500 12.000 4.500 12.000C4.500 12.000 3.167 12.000 3.167 12.000ZM9.333 12.000C9.333 12.000 9.333 3.667 9.333 3.667C9.333 3.667 10.667 3.667 10.667 3.667C10.667 3.667 10.667 12.000 10.667 12.000C10.667 12.000 9.333 12.000 9.333 12.000ZM0.000 12.000C0.000 12.000 0.003 5.333 0.003 5.333C0.003 5.333 1.336 5.333 1.336 5.333C1.336 5.333 1.333 12.000 1.333 12.000C1.333 12.000 0.000 12.000 0.000 12.000ZM6.165 12.000C6.165 12.000 6.165 7.333 6.165 7.333C6.165 7.333 7.499 7.333 7.499 7.333C7.499 7.333 7.499 12.000 7.499 12.000C7.499 12.000 6.165 12.000 6.165 12.000Z" fillRule="nonzero" fill="#536471" />
            </svg>
          </div>
          <div className="text-[12px] w-max font-['Satoshi',system-ui,sans-serif] leading-4 text-[#536471]">
            {views}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="overflow-clip relative shrink-0 size-4">
            <svg viewBox="0 0 13.67 13.13" width="13.67" height="13.13" xmlns="http://www.w3.org/2000/svg" style={{ left: '1.1673px', top: '1.3333px', width: '13.67px', height: '13.13px', overflow: 'visible', position: 'absolute' }}>
              <path d="M0.000 5.333C0.000 2.387 2.389 0.000 5.337 0.000C5.337 0.000 8.247 0.000 8.247 0.000C11.241 0.000 13.667 2.427 13.667 5.420C13.667 7.393 12.595 9.207 10.869 10.160C10.869 10.160 5.500 13.133 5.500 13.133C5.500 13.133 5.500 10.673 5.500 10.673C5.500 10.673 5.455 10.673 5.455 10.673C2.462 10.740 0.000 8.333 0.000 5.333C0.000 5.333 0.000 5.333 0.000 5.333ZM5.337 1.333C3.125 1.333 1.333 3.127 1.333 5.333C1.333 7.580 3.180 9.387 5.425 9.340C5.425 9.340 5.659 9.333 5.659 9.333C5.659 9.333 6.833 9.333 6.833 9.333C6.833 9.333 6.833 10.867 6.833 10.867C6.833 10.867 10.225 8.993 10.225 8.993C11.525 8.273 12.333 6.907 12.333 5.420C12.333 3.160 10.504 1.333 8.247 1.333C8.247 1.333 5.337 1.333 5.337 1.333C5.337 1.333 5.337 1.333 5.337 1.333Z" fillRule="nonzero" fill="#536471" />
            </svg>
          </div>
          <div className="text-[12px] w-max font-['Satoshi',system-ui,sans-serif] leading-4 text-[#536471]">
            {replies}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="overflow-clip relative shrink-0 size-4">
            <svg viewBox="0 0 15.91 10.83" width="15.91" height="10.83" xmlns="http://www.w3.org/2000/svg" style={{ left: '0.0453px', top: '2.5867px', width: '15.91px', height: '10.83px', overflow: 'visible', position: 'absolute' }}>
              <path d="M2.955 0.000C2.955 0.000 5.909 2.760 5.909 2.760C5.909 2.760 5.000 3.733 5.000 3.733C5.000 3.733 3.621 2.447 3.621 2.447C3.621 2.447 3.621 8.080 3.621 8.080C3.621 8.813 4.219 9.413 4.955 9.413C4.955 9.413 8.621 9.413 8.621 9.413C8.621 9.413 8.621 10.747 8.621 10.747C8.621 10.747 4.955 10.747 4.955 10.747C3.482 10.747 2.288 9.553 2.288 8.080C2.288 8.080 2.288 2.447 2.288 2.447C2.288 2.447 0.909 3.733 0.909 3.733C0.909 3.733 0.000 2.760 0.000 2.760C0.000 2.760 2.955 0.000 2.955 0.000ZM10.955 1.413C10.955 1.413 7.288 1.413 7.288 1.413C7.288 1.413 7.288 0.080 7.288 0.080C7.288 0.080 10.955 0.080 10.955 0.080C12.427 0.080 13.621 1.273 13.621 2.747C13.621 2.747 13.621 8.380 13.621 8.380C13.621 8.380 15.000 7.093 15.000 7.093C15.000 7.093 15.909 8.067 15.909 8.067C15.909 8.067 12.955 10.827 12.955 10.827C12.955 10.827 10.000 8.067 10.000 8.067C10.000 8.067 10.909 7.093 10.909 7.093C10.909 7.093 12.288 8.380 12.288 8.380C12.288 8.380 12.288 2.747 12.288 2.747C12.288 2.013 11.691 1.413 10.955 1.413Z" fillRule="nonzero" fill="#536471" />
            </svg>
          </div>
          <div className="text-[12px] w-max font-['Satoshi',system-ui,sans-serif] leading-4 text-[#536471]">
            {reposts}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="overflow-clip relative shrink-0 size-4">
            <svg viewBox="0 0 13.33 11.77" width="13.33" height="11.77" xmlns="http://www.w3.org/2000/svg" style={{ left: '1.3331px', top: '2.3345px', width: '13.33px', height: '11.77px', overflow: 'visible', position: 'absolute' }}>
              <path d="M9.798 1.332C8.984 1.292 8.012 1.672 7.205 2.772C7.205 2.772 6.668 3.499 6.668 3.499C6.668 3.499 6.131 2.772 6.131 2.772C5.323 1.672 4.351 1.292 3.536 1.332C2.708 1.379 1.970 1.852 1.596 2.605C1.228 3.352 1.174 4.459 1.916 5.819C2.632 7.132 4.087 8.665 6.668 10.225C9.248 8.665 10.703 7.132 11.419 5.819C12.160 4.459 12.106 3.352 11.737 2.605C11.363 1.852 10.626 1.379 9.798 1.332ZM12.590 6.459C11.689 8.112 9.922 9.872 7.004 11.572C7.004 11.572 6.668 11.772 6.668 11.772C6.668 11.772 6.332 11.572 6.332 11.572C3.413 9.872 1.646 8.112 0.744 6.459C-0.162 4.792 -0.196 3.219 0.402 2.012C0.993 0.819 2.166 0.072 3.469 0.005C4.570 -0.055 5.714 0.379 6.668 1.345C7.620 0.379 8.765 -0.055 9.865 0.005C11.168 0.072 12.341 0.819 12.932 2.012C13.530 3.219 13.496 4.792 12.590 6.459C12.590 6.459 12.590 6.459 12.590 6.459Z" fillRule="nonzero" fill="#536471" />
            </svg>
          </div>
          <div className="text-[12px] w-max font-['Satoshi',system-ui,sans-serif] leading-4 text-[#536471]">
            {likes}
          </div>
        </div>
        <div className="overflow-clip relative shrink-0 size-4">
          <svg viewBox="0 0 12 12.27" width="12" height="12.27" xmlns="http://www.w3.org/2000/svg" style={{ left: '2px', top: '1.7267px', width: '12px', height: '12.27px', overflow: 'visible', position: 'absolute' }}>
            <path d="M6.000 0.000C6.000 0.000 9.800 3.800 9.800 3.800C9.800 3.800 8.860 4.747 8.860 4.747C8.860 4.747 6.667 2.547 6.667 2.547C6.667 2.547 6.667 8.940 6.667 8.940C6.667 8.940 5.333 8.940 5.333 8.940C5.333 8.940 5.333 2.547 5.333 2.547C5.333 2.547 3.133 4.747 3.133 4.747C3.133 4.747 2.193 3.800 2.193 3.800C2.193 3.800 6.000 0.000 6.000 0.000ZM12.000 8.273C12.000 8.273 11.987 10.613 11.987 10.613C11.987 11.533 11.240 12.273 10.320 12.273C10.320 12.273 1.667 12.273 1.667 12.273C0.740 12.273 0.000 11.527 0.000 10.607C0.000 10.607 0.000 8.273 0.000 8.273C0.000 8.273 1.333 8.273 1.333 8.273C1.333 8.273 1.333 10.607 1.333 10.607C1.333 10.793 1.480 10.940 1.667 10.940C1.667 10.940 10.320 10.940 10.320 10.940C10.507 10.940 10.653 10.793 10.653 10.607C10.653 10.607 10.667 8.273 10.667 8.273C10.667 8.273 12.000 8.273 12.000 8.273Z" fillRule="nonzero" fill="#536471" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/**
 * Image variant (Paper 1C8-0): header + text + image block + timestamp + stats.
 * from Paper
 * https://app.paper.design/file/01M1DEEQY42BZFA01XT004M9ZZ/01K4GP58P8JRM8PGBP0586VKYV/1C8-0
 * on Sep 12, 2026
 */
export function TwitterPostImage({
  avatarUrl = TWITTER_AVATAR,
  authorName = 'Username',
  handle = '@username',
  body = 'Edit this text',
  imageSrc = TWITTER_PHOTO,
  timestamp = '12:00 PM · Sep 12, 2026',
  views = '999',
  replies = '999',
  reposts = '999',
  likes = '999',
}: {
  avatarUrl?: string
  authorName?: string
  handle?: string
  body?: string
  imageSrc?: string
  timestamp?: string
  views?: string
  replies?: string
  reposts?: string
  likes?: string
}) {
  return (
    <div className="[font-synthesis:none] [overflow-wrap:anywhere] w-[30.25rem] flex flex-col items-start p-4 rounded-[16px] gap-4 bg-white antialiased">
      <div className="h-8 self-stretch min-w-0 overflow-clip relative shrink-0 bg-white">
        <div className="left-0 top-0 flex items-center gap-4 absolute">
          <div className="relative shrink-0 size-8">
            <div className="left-[0%] top-[0%] rounded-[50%] absolute bg-cover bg-position-[50%] size-full" style={{ backgroundImage: `url(${avatarUrl})` }} />
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1">
              <div className="text-[12px] w-max font-['Satoshi',system-ui,sans-serif] font-[700] leading-4 text-[#171717]">
                {authorName}
              </div>
              <div className="overflow-clip relative shrink-0 size-4">
                <svg viewBox="0 0 13.67 13.67" width="13.67" height="13.67" xmlns="http://www.w3.org/2000/svg" style={{ left: '1.1667px', top: '1.1667px', width: '13.67px', height: '13.67px', overflow: 'visible', position: 'absolute' }}>
                  <path d="M13.667 6.833C13.667 5.880 13.080 5.053 12.207 4.607C12.513 3.680 12.340 2.673 11.667 2.000C10.993 1.327 9.987 1.153 9.060 1.460C8.620 0.587 7.787 0.000 6.833 0.000C5.880 0.000 5.053 0.587 4.613 1.460C3.680 1.153 2.673 1.327 2.000 2.000C1.327 2.673 1.160 3.680 1.467 4.607C0.593 5.053 0.000 5.880 0.000 6.833C0.000 7.787 0.593 8.613 1.467 9.060C1.160 9.987 1.327 10.993 2.000 11.667C2.673 12.340 3.680 12.507 4.607 12.207C5.053 13.080 5.880 13.667 6.833 13.667C7.787 13.667 8.620 13.080 9.060 12.207C9.987 12.507 10.993 12.340 11.667 11.667C12.340 10.993 12.513 9.987 12.207 9.060C13.080 8.613 13.667 7.787 13.667 6.833ZM5.860 9.633C5.860 9.633 3.367 7.140 3.367 7.140C3.367 7.140 4.307 6.193 4.307 6.193C4.307 6.193 5.813 7.700 5.813 7.700C5.813 7.700 9.013 4.213 9.013 4.213C9.013 4.213 9.993 5.120 9.993 5.120C9.993 5.120 5.860 9.633 5.860 9.633Z" fillRule="nonzero" fill="#1D9BF0" />
                </svg>
              </div>
            </div>
            <div className="text-[12px] w-max font-['Satoshi',system-ui,sans-serif] leading-4 text-[#536471]">
              {handle}
            </div>
          </div>
        </div>
        <svg viewBox="0 0 16 16" width="16" height="16" xmlns="http://www.w3.org/2000/svg" style={{ left: '436px', top: '0px', width: '16px', height: '16px', overflow: 'visible', position: 'absolute' }}>
          <g transform="matrix(1 0 0 1 2 6.667)">
            <path d="M0.000 1.333C0.000 0.600 0.600 0.000 1.333 0.000C2.067 0.000 2.667 0.600 2.667 1.333C2.667 2.067 2.067 2.667 1.333 2.667C0.600 2.667 0.000 2.067 0.000 1.333ZM6.000 2.667C6.733 2.667 7.333 2.067 7.333 1.333C7.333 0.600 6.733 0.000 6.000 0.000C5.267 0.000 4.667 0.600 4.667 1.333C4.667 2.067 5.267 2.667 6.000 2.667ZM10.667 2.667C11.400 2.667 12.000 2.067 12.000 1.333C12.000 0.600 11.400 0.000 10.667 0.000C9.933 0.000 9.333 0.600 9.333 1.333C9.333 2.067 9.933 2.667 10.667 2.667Z" fillRule="nonzero" fill="#536471" />
          </g>
        </svg>
      </div>
      <div className="w-[28.25rem] self-stretch min-w-0 text-[24px] tracking-[-0.01em] line-clamp-3 font-['Satoshi',system-ui,sans-serif] font-[300] leading-[1.875rem] text-black">
        {body}
      </div>
      <div className="w-[28.25rem] h-[15.875rem] rounded-[8px] overflow-clip shrink-0 bg-cover bg-position-[50%]" style={{ backgroundImage: `url(${imageSrc})` }} />
      <div className="w-[28.25rem] self-stretch min-w-0 text-[12px] tracking-[-0.01em] font-['Satoshi',system-ui,sans-serif] font-[300] leading-4 text-black">
        {timestamp}
      </div>
      <svg viewBox="0 0 452 1" width="452" height="1" xmlns="http://www.w3.org/2000/svg" style={{ alignSelf: 'stretch', minWidth: '0px', height: '1px', overflow: 'visible', flexShrink: '0' }}>
        <path d="M0 0L452.000 0" vectorEffect="non-scaling-stroke" fill="none" stroke="#C8D1D9" />
      </svg>
      <div className="flex items-start gap-4 bg-white">
        <div className="flex items-center gap-1">
          <div className="overflow-clip relative shrink-0 size-4">
            <svg viewBox="0 0 10.67 12" preserveAspectRatio="none" width="10.67" height="12" xmlns="http://www.w3.org/2000/svg" style={{ left: '2.6667px', top: '2px', width: '10.67px', height: '12px', overflow: 'visible', position: 'absolute' }}>
              <path d="M3.167 12.000C3.167 12.000 3.167 0.000 3.167 0.000C3.167 0.000 4.500 0.000 4.500 0.000C4.500 0.000 4.500 12.000 4.500 12.000C4.500 12.000 3.167 12.000 3.167 12.000ZM9.333 12.000C9.333 12.000 9.333 3.667 9.333 3.667C9.333 3.667 10.667 3.667 10.667 3.667C10.667 3.667 10.667 12.000 10.667 12.000C10.667 12.000 9.333 12.000 9.333 12.000ZM0.000 12.000C0.000 12.000 0.003 5.333 0.003 5.333C0.003 5.333 1.336 5.333 1.336 5.333C1.336 5.333 1.333 12.000 1.333 12.000C1.333 12.000 0.000 12.000 0.000 12.000ZM6.165 12.000C6.165 12.000 6.165 7.333 6.165 7.333C6.165 7.333 7.499 7.333 7.499 7.333C7.499 7.333 7.499 12.000 7.499 12.000C7.499 12.000 6.165 12.000 6.165 12.000Z" fillRule="nonzero" fill="#536471" />
            </svg>
          </div>
          <div className="text-[12px] w-max font-['Satoshi',system-ui,sans-serif] leading-4 text-[#536471]">
            {views}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="overflow-clip relative shrink-0 size-4">
            <svg viewBox="0 0 13.67 13.13" width="13.67" height="13.13" xmlns="http://www.w3.org/2000/svg" style={{ left: '1.1673px', top: '1.3333px', width: '13.67px', height: '13.13px', overflow: 'visible', position: 'absolute' }}>
              <path d="M0.000 5.333C0.000 2.387 2.389 0.000 5.337 0.000C5.337 0.000 8.247 0.000 8.247 0.000C11.241 0.000 13.667 2.427 13.667 5.420C13.667 7.393 12.595 9.207 10.869 10.160C10.869 10.160 5.500 13.133 5.500 13.133C5.500 13.133 5.500 10.673 5.500 10.673C5.500 10.673 5.455 10.673 5.455 10.673C2.462 10.740 0.000 8.333 0.000 5.333C0.000 5.333 0.000 5.333 0.000 5.333ZM5.337 1.333C3.125 1.333 1.333 3.127 1.333 5.333C1.333 7.580 3.180 9.387 5.425 9.340C5.425 9.340 5.659 9.333 5.659 9.333C5.659 9.333 6.833 9.333 6.833 9.333C6.833 9.333 6.833 10.867 6.833 10.867C6.833 10.867 10.225 8.993 10.225 8.993C11.525 8.273 12.333 6.907 12.333 5.420C12.333 3.160 10.504 1.333 8.247 1.333C8.247 1.333 5.337 1.333 5.337 1.333C5.337 1.333 5.337 1.333 5.337 1.333Z" fillRule="nonzero" fill="#536471" />
            </svg>
          </div>
          <div className="text-[12px] w-max font-['Satoshi',system-ui,sans-serif] leading-4 text-[#536471]">
            {replies}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="overflow-clip relative shrink-0 size-4">
            <svg viewBox="0 0 15.91 10.83" width="15.91" height="10.83" xmlns="http://www.w3.org/2000/svg" style={{ left: '0.0453px', top: '2.5867px', width: '15.91px', height: '10.83px', overflow: 'visible', position: 'absolute' }}>
              <path d="M2.955 0.000C2.955 0.000 5.909 2.760 5.909 2.760C5.909 2.760 5.000 3.733 5.000 3.733C5.000 3.733 3.621 2.447 3.621 2.447C3.621 2.447 3.621 8.080 3.621 8.080C3.621 8.813 4.219 9.413 4.955 9.413C4.955 9.413 8.621 9.413 8.621 9.413C8.621 9.413 8.621 10.747 8.621 10.747C8.621 10.747 4.955 10.747 4.955 10.747C3.482 10.747 2.288 9.553 2.288 8.080C2.288 8.080 2.288 2.447 2.288 2.447C2.288 2.447 0.909 3.733 0.909 3.733C0.909 3.733 0.000 2.760 0.000 2.760C0.000 2.760 2.955 0.000 2.955 0.000ZM10.955 1.413C10.955 1.413 7.288 1.413 7.288 1.413C7.288 1.413 7.288 0.080 7.288 0.080C7.288 0.080 10.955 0.080 10.955 0.080C12.427 0.080 13.621 1.273 13.621 2.747C13.621 2.747 13.621 8.380 13.621 8.380C13.621 8.380 15.000 7.093 15.000 7.093C15.000 7.093 15.909 8.067 15.909 8.067C15.909 8.067 12.955 10.827 12.955 10.827C12.955 10.827 10.000 8.067 10.000 8.067C10.000 8.067 10.909 7.093 10.909 7.093C10.909 7.093 12.288 8.380 12.288 8.380C12.288 8.380 12.288 2.747 12.288 2.747C12.288 2.013 11.691 1.413 10.955 1.413Z" fillRule="nonzero" fill="#536471" />
            </svg>
          </div>
          <div className="text-[12px] w-max font-['Satoshi',system-ui,sans-serif] leading-4 text-[#536471]">
            {reposts}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="overflow-clip relative shrink-0 size-4">
            <svg viewBox="0 0 13.33 11.77" width="13.33" height="11.77" xmlns="http://www.w3.org/2000/svg" style={{ left: '1.3331px', top: '2.3345px', width: '13.33px', height: '11.77px', overflow: 'visible', position: 'absolute' }}>
              <path d="M9.798 1.332C8.984 1.292 8.012 1.672 7.205 2.772C7.205 2.772 6.668 3.499 6.668 3.499C6.668 3.499 6.131 2.772 6.131 2.772C5.323 1.672 4.351 1.292 3.536 1.332C2.708 1.379 1.970 1.852 1.596 2.605C1.228 3.352 1.174 4.459 1.916 5.819C2.632 7.132 4.087 8.665 6.668 10.225C9.248 8.665 10.703 7.132 11.419 5.819C12.160 4.459 12.106 3.352 11.737 2.605C11.363 1.852 10.626 1.379 9.798 1.332ZM12.590 6.459C11.689 8.112 9.922 9.872 7.004 11.572C7.004 11.572 6.668 11.772 6.668 11.772C6.668 11.772 6.332 11.572 6.332 11.572C3.413 9.872 1.646 8.112 0.744 6.459C-0.162 4.792 -0.196 3.219 0.402 2.012C0.993 0.819 2.166 0.072 3.469 0.005C4.570 -0.055 5.714 0.379 6.668 1.345C7.620 0.379 8.765 -0.055 9.865 0.005C11.168 0.072 12.341 0.819 12.932 2.012C13.530 3.219 13.496 4.792 12.590 6.459C12.590 6.459 12.590 6.459 12.590 6.459Z" fillRule="nonzero" fill="#536471" />
            </svg>
          </div>
          <div className="text-[12px] w-max font-['Satoshi',system-ui,sans-serif] leading-4 text-[#536471]">
            {likes}
          </div>
        </div>
        <div className="overflow-clip relative shrink-0 size-4">
          <svg viewBox="0 0 12 12.27" width="12" height="12.27" xmlns="http://www.w3.org/2000/svg" style={{ left: '2px', top: '1.7267px', width: '12px', height: '12.27px', overflow: 'visible', position: 'absolute' }}>
            <path d="M6.000 0.000C6.000 0.000 9.800 3.800 9.800 3.800C9.800 3.800 8.860 4.747 8.860 4.747C8.860 4.747 6.667 2.547 6.667 2.547C6.667 2.547 6.667 8.940 6.667 8.940C6.667 8.940 5.333 8.940 5.333 8.940C5.333 8.940 5.333 2.547 5.333 2.547C5.333 2.547 3.133 4.747 3.133 4.747C3.133 4.747 2.193 3.800 2.193 3.800C2.193 3.800 6.000 0.000 6.000 0.000ZM12.000 8.273C12.000 8.273 11.987 10.613 11.987 10.613C11.987 11.533 11.240 12.273 10.320 12.273C10.320 12.273 1.667 12.273 1.667 12.273C0.740 12.273 0.000 11.527 0.000 10.607C0.000 10.607 0.000 8.273 0.000 8.273C0.000 8.273 1.333 8.273 1.333 8.273C1.333 8.273 1.333 10.607 1.333 10.607C1.333 10.793 1.480 10.940 1.667 10.940C1.667 10.940 10.320 10.940 10.320 10.940C10.507 10.940 10.653 10.793 10.653 10.607C10.653 10.607 10.667 8.273 10.667 8.273C10.667 8.273 12.000 8.273 12.000 8.273Z" fillRule="nonzero" fill="#536471" />
          </svg>
        </div>
      </div>
    </div>
  );
}
