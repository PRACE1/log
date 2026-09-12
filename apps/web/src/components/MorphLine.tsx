import { useEffect, useState } from 'react'
import { TextMorph } from 'torph/react'

const LINES = [
  'someone just asked for a plumber in dallas. real time.',
  'we read the internet so you don\'t have to.',
  'that rant? it\'s a lead.',
  'your customers are complaining online right now.',
  'we heard it. we saved it. you can bill for it.',
  'yes, we read that reddit thread.',
  'the internet is a phone call you keep missing.',
  'less scrolling. more showing up.',
]

const STEP_MS = 2200

export function MorphLine({ className }: { className?: string }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((v) => (v + 1) % LINES.length)
    }, STEP_MS)
    return () => window.clearInterval(id)
  }, [])

  return (
    <TextMorph
      as="p"
      duration={650}
      ease="cubic-bezier(0.19, 1, 0.22, 1)"
      locale="en"
      respectReducedMotion
      className={`morph-line ${className ?? ''}`.trim()}
    >
      {LINES[index]}
    </TextMorph>
  )
}