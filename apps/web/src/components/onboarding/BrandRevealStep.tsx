import { useEffect, useState } from 'react'
import { Button } from '@listeningkit/ui'
import { GlobeIcon, Map, SearchIcon, Swords } from 'lucide-react'
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

function toolChipFor(word: string): { logo: string; name: string; trailing: string } | null {
  const trailing = word.match(/[.,!?;:]+$/)?.[0] ?? ''
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

  return (
    <div className="mb-auto mt-8 w-full">
      <div className="w-full text-left">
        <ChainOfThought className="space-y-0 text-white [&_svg.lucide]:size-6">
          <ChainOfThoughtHeader className="text-6xl font-bold leading-tight text-white sm:text-8xl [&>span]:text-center [&>svg]:hidden">
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
                  <div className="flex flex-wrap items-center gap-2 pt-1">
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
                <ChainOfThought className="space-y-0 pt-8 text-white">
                  <ChainOfThoughtStep
                    icon={Map}
                    status={mappingDone ? 'complete' : 'active'}
                    elbow
                    label={
                      <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                        <StreamedLabel words={mappingWords} shown={mappingShown} complete={mappingDone} />
                      </span>
                    }
                    className="pb-3 text-xl text-white sm:text-2xl [&>div:first-child>div:last-child]:mt-0 [&>div:first-child>div:last-child]:bottom-auto [&>div:first-child>div:last-child]:h-[96px]"
                  />
                </ChainOfThought>
              </ChainOfThoughtStep>
            </div>
          ) : null}
        </ChainOfThought>
      </div>
      {mappingDone ? (
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
