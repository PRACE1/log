import { useEffect, useState } from 'react'
import { Button } from '@listeningkit/ui'
import { Check, GlobeIcon, HelpCircle, Map, SearchIcon, Swords } from 'lucide-react'
import type { BrandProfile } from '@/lib/brand'
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought'
import {
  Source,
  SourceContent,
  SourceTrigger,
} from '@/components/ai-elements/source'

/**
 * Brand reveal: the brand name in very large plain white text, then a very
 * large ChainOfThought, centered, streaming its first step word by word.
 * Continue appears once the stream finishes.
 */
function InlineToolChip({ logo, name }: { logo: string; name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm bg-white px-0.5 py-0.5 text-black">
      <img src={logo} alt="" aria-hidden="true" className="size-5 shrink-0" />
      {name}
    </span>
  )
}

function toolChipFor(word: string): { logo: string; name: string; trailing: string } | null {  const trailing = word.match(/[.,!?;:]+$/)?.[0] ?? ''
  const clean = trailing ? word.slice(0, -trailing.length) : word
  if (clean === 'Firecrawl') return { logo: '/brand-assets/firecrawl-logo.svg', name: 'Firecrawl', trailing }
  if (clean === 'Treg') return { logo: '/brand-assets/treglogo.svg', name: 'Treg', trailing }
  return null
}

function renderStreamedWords(all: string[], shown: number, complete: boolean) {
  return (
    <>
      {all.slice(0, shown).map((word, index, arr) => {
        const chip = toolChipFor(word)
        return (
          <span key={index}>
            {chip ? <InlineToolChip logo={chip.logo} name={chip.name} /> : word}
            {chip ? chip.trailing : ''}
            {index < arr.length - 1 ? ' ' : ''}
          </span>
        )
      })}
      {complete ? '' : '▍'}
    </>
  )
}

/**
 * Streams words without moving layout: the full text renders invisibly to
 * reserve the final height, while the visible copy streams over the top.
 * Rails and elbows anchored to these rows stay pixel-perfect throughout.
 */
function StreamedLabel({ words, shown, complete }: { words: string[]; shown: number; complete: boolean }) {
  return (
    <span className="relative block">
      <span aria-hidden="true" className="invisible">
        {renderStreamedWords(words, words.length, true)}
      </span>
      <span className="absolute inset-0" aria-live="polite">
        {renderStreamedWords(words, shown, complete)}
      </span>
    </span>
  )
}

/**
 * Mock competitors surfaced by the Treg lookup — name, domain, and how many
 * tracked keywords they also rank for. Mirrors the platform cards from step 0
 * of onboarding when presented below.
 */
const COMPETITORS = [
  { name: 'BluePipe Co', domain: 'bluepipe.co', shared: 12 },
  { name: 'RapidFix', domain: 'rapidfix.com', shared: 9 },
  { name: 'HomeServe Local', domain: 'homeservelocal.com', shared: 8 },
  { name: 'ProDrain', domain: 'prodrain.io', shared: 6 },
  { name: 'Fixly', domain: 'fixly.co', shared: 4 },
]

export function BrandRevealStep({ profile, onContinue }: { profile: BrandProfile; onContinue: () => void }) {
  const fullText = `Okay the brand we're looking for is ${profile.identity.name} — let's use Firecrawl to go through and find out a bit more about who they are.`
  const words = fullText.split(' ')
  const [shown, setShown] = useState(0)
  const done = shown >= words.length
  const sourcesText = `Spinning up a research agent on ${profile.identity.name}. It will scrape the homepage, pull the offerings, and map the brand voice — then hand everything back here.`
  const sourcesWords = sourcesText.split(' ')
  const [sourcesShown, setSourcesShown] = useState(0)
  const sourcesDone = sourcesShown >= sourcesWords.length
  const competitorsText = `Let's map out the competitors from the keywords with Treg to see who else is listening.`
  const competitorsWords = competitorsText.split(' ')
  const [competitorsShown, setCompetitorsShown] = useState(0)
  const competitorsDone = competitorsShown >= competitorsWords.length
  const mappingText = `Use Treg to call DataForSeo to get competitors.`
  const mappingWords = mappingText.split(' ')
  const [mappingShown, setMappingShown] = useState(0)
  const mappingDone = mappingShown >= mappingWords.length
  const [foundCount, setFoundCount] = useState(0)
  const foundAll = foundCount >= COMPETITORS.length
  const [answer, setAnswer] = useState<'yes' | 'no' | null>(null)

  useEffect(() => {
    console.log('Brand profile:', profile)
  }, [profile])

  useEffect(() => {
    if (done) return
    const id = window.setTimeout(() => setShown((prev) => Math.min(prev + 1, words.length)), 90)
    return () => window.clearTimeout(id)
  }, [shown, done, words.length])

  useEffect(() => {
    if (!done || sourcesDone) return
    const id = window.setTimeout(
      () => setSourcesShown((prev) => Math.min(prev + 1, sourcesWords.length)),
      90
    )
    return () => window.clearTimeout(id)
  }, [done, sourcesShown, sourcesDone, sourcesWords.length])

  useEffect(() => {
    if (!sourcesDone || competitorsDone) return
    const id = window.setTimeout(
      () => setCompetitorsShown((prev) => Math.min(prev + 1, competitorsWords.length)),
      90
    )
    return () => window.clearTimeout(id)
  }, [sourcesDone, competitorsShown, competitorsDone, competitorsWords.length])

  useEffect(() => {
    if (!competitorsDone || mappingDone) return
    const id = window.setTimeout(
      () => setMappingShown((prev) => Math.min(prev + 1, mappingWords.length)),
      90
    )
    return () => window.clearTimeout(id)
  }, [competitorsDone, mappingShown, mappingDone, mappingWords.length])

  useEffect(() => {
    if (!mappingDone || foundAll) return
    const id = window.setTimeout(() => setFoundCount((prev) => prev + 1), 550)
    return () => window.clearTimeout(id)
  }, [mappingDone, foundAll, foundCount])

  return (
    <div className="mb-auto mt-8 w-full">
      <div className="w-full text-left">
        <ChainOfThought className="space-y-0 text-white [&_svg.lucide]:size-6">
          <ChainOfThoughtHeader className="pb-8 text-6xl font-bold leading-tight text-white sm:text-8xl [&>span]:text-center [&>svg]:hidden">
            Tracking {profile.identity.name}
          </ChainOfThoughtHeader>
          <div className="mx-auto w-full max-w-2xl">
            <ChainOfThoughtStep
              icon={SearchIcon}
              status={done ? 'complete' : 'active'}
              label={
              <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                <StreamedLabel words={words} shown={shown} complete={done} />
              </span>
              }
              className="pb-6 text-xl text-white sm:text-2xl [&>div:first-child>span:first-child]:size-10"
            />
          </div>
          {done ? (
            <div className="mx-auto w-full max-w-2xl">
              <ChainOfThoughtStep
                icon={GlobeIcon}
                status={sourcesDone ? 'complete' : 'active'}
                label={
                  <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                    <StreamedLabel words={sourcesWords} shown={sourcesShown} complete={sourcesDone} />
                  </span>
                }
                className="pb-6 text-xl text-white sm:text-2xl [&>div:first-child>span:first-child]:size-10"
              >                {sourcesDone ? (
                  <div className="flex flex-wrap items-center gap-2 -mt-1">
                    <Source href={profile.identity.website}>
                      <SourceTrigger showFavicon label={profile.identity.name} className="rounded-sm" />
                      <SourceContent
                        title={`${profile.identity.name} — official site`}
                        description={profile.identity.tagline}
                      />
                    </Source>
                    <Source href="https://firecrawl.dev">
                      <SourceTrigger showFavicon label="Firecrawl" className="rounded-sm" />
                      <SourceContent
                        title="Firecrawl"
                        description="Company data and web extraction for the brand lookup."
                      />
                    </Source>
                  </div>
                ) : null}
              </ChainOfThoughtStep>
            </div>
          ) : null}
          {sourcesDone ? (
            <div className="mx-auto w-full max-w-2xl">
              <ChainOfThoughtStep
                icon={Swords}
                status={mappingDone ? 'complete' : 'active'}
                label={
                  <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                    <StreamedLabel words={competitorsWords} shown={competitorsShown} complete={competitorsDone} />
                  </span>
                }
                className="pb-6 text-xl text-white sm:text-2xl [&>div:first-child>span:first-child]:size-10 [&>div:last-child]:overflow-visible [&>div:first-child>div:last-child]:bottom-auto [&>div:first-child>div:last-child]:h-[64px]"
              >
                {competitorsDone ? (
                <ChainOfThought className="space-y-0 pt-8 text-white">
                  <ChainOfThoughtStep
                    icon={Map}
                    status={mappingDone ? 'complete' : 'active'}
                    elbow="in"
                    label={
                      <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                        <StreamedLabel words={mappingWords} shown={mappingShown} complete={mappingDone} />
                      </span>
                    }
                    className="pb-3 text-xl text-white sm:text-2xl [&>div:first-child>div:last-child]:mt-0 [&>div:first-child>div:last-child]:bottom-auto [&>div:first-child>div:last-child]:h-[96px]"
                  />
                  {COMPETITORS.slice(0, foundCount).map((competitor, index) => {
                    const isLastFound = foundAll && index === foundCount - 1
                    return (
                      <ChainOfThoughtStep
                        key={competitor.domain}
                        icon={Check}
                        status="complete"
                        compact={!isLastFound}
                        elbow={isLastFound ? 'out' : undefined}
                        label={
                          <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                            Found Competitor {index + 1} — {competitor.name}
                          </span>
                        }
                        className="text-xl text-white sm:text-2xl"
                      >
                        <div className="flex flex-wrap items-center gap-2 -mt-1">
                          <Source href={`https://${competitor.domain}`}>
                            <SourceTrigger showFavicon label={competitor.name} className="rounded-sm" />
                            <SourceContent
                              title={`${competitor.name} — ${competitor.domain}`}
                              description={`${competitor.shared} shared keywords with ${profile.identity.name}.`}
                            />
                          </Source>
                        </div>
                      </ChainOfThoughtStep>
                    )
                  })}
                </ChainOfThought>
                ) : null}
              </ChainOfThoughtStep>
            </div>
          ) : null}
          {foundAll ? (
            <div className="mx-auto w-full max-w-2xl">
              <ChainOfThoughtStep
                icon={HelpCircle}
                status={answer === null ? 'active' : 'complete'}
                label={
                  <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                    Do any of these competitors ring a bell?
                  </span>
                }
                className="pb-6 text-xl text-white sm:text-2xl [&>div:first-child>span:first-child]:size-10 [&>div:first-child>div:last-child]:bottom-0"
              >
                {answer === null ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setAnswer('yes')}
                      className="rounded-lg bg-white px-5 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-white/90"
                    >
                      Yes — I know them
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnswer('no')}
                      className="rounded-lg border border-white/40 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      No — new to me
                    </button>
                  </div>
                ) : (
                  <p className="text-base text-white/80">
                    {answer === 'yes'
                      ? `Nice — we'll track them against ${profile.identity.name}.`
                      : 'No problem — we\u2019ll keep listening anyway.'}
                  </p>
                )}
              </ChainOfThoughtStep>
            </div>
          ) : null}
        </ChainOfThought>
      </div>
      {answer !== null ? (
        <Button
          type="button"
          onClick={onContinue}
          size="xl"
          shadow="hard"
          className="mt-10 h-14 rounded-xl bg-white px-10 font-bold text-slate-900 hover:bg-white/90"
        >
          Continue
        </Button>
      ) : null}
    </div>
  )
}