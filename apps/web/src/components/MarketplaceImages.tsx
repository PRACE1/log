import { useState } from 'react'

interface MarketplaceImagesProps {
  /** Listing photos; up to four are fanned in the row. */
  images: string[]
  /** Listing title, used for the per-photo alt text. */
  title: string
}

// Resting size of a fanned card; hovering a card scales it up to 100%.
const CARD_W = 48
const CARD_H = 85 // 9:16 of CARD_W
const STEP_X = 14 // horizontal overlap between fanned cards
const FAN_DEG = 8 // per-position fan spread
const REST_SCALE = 0.72

/**
 * In-row fanned photo deck for a listing: up to four 9:16 cards opened out
 * from a shared bottom axis (first card on top), sitting to the left of the
 * row's text. Cards rest small; hovering one scales it up, bottom-anchored.
 */
export function MarketplaceImages({ images, title }: MarketplaceImagesProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const cards = images.slice(0, 4)

  if (cards.length === 0) return null

  return (
    <span className="relative block h-[92px] w-[96px] shrink-0">
      {cards.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`${title} — photo ${i + 1} of ${cards.length}`}
          loading="lazy"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          className="absolute bottom-0 left-0 cursor-pointer transition-transform duration-200 ease-out"
          style={{
            width: CARD_W,
            height: CARD_H,
            objectFit: 'cover',
            borderRadius: 12,
            border: '2px solid #fff',
            transformOrigin: '50% 100%',
            transform: `translateX(${i * STEP_X}px) rotate(${i * FAN_DEG}deg) scale(${
              hovered === i ? 1 : REST_SCALE
            })`,
            zIndex: hovered === i ? cards.length + 1 : cards.length - i
          }}
        />
      ))}
    </span>
  )
}