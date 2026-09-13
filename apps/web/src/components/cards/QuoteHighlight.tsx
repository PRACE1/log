import { Fragment, type ReactNode } from 'react'

function escapeRegExp(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Wraps every case-insensitive occurrence of the listened phrases in blue
 * quotation marks: font-black, brand blue, dashed underline. Longest
 * phrases match first so overlaps resolve to the widest span; original
 * casing is preserved. No phrases (or no match) returns the text
 * untouched, so cards render identically when nothing is listened for.
 */
export function highlightQuote(text: string, phrases: string[] | undefined): ReactNode {
  const terms = (phrases ?? [])
    .map((phrase) => phrase.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
  if (terms.length === 0 || text.length === 0) return text
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi')
  const parts = text.split(pattern)
  if (parts.length === 1) return text
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <span
        key={index}
        className="font-black text-[#2A8CFF] underline decoration-dashed underline-offset-2"
      >
        “{part}”
      </span>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    )
  )
}
