import { useEffect, useRef, useState, type RefObject } from 'react'
import { useMachine } from '@xstate/react'
import { Button, useSquircleClip } from '@listeningkit/ui'
import { Check, GlobeIcon, HelpCircle, KeyRound, Map, SearchIcon, Swords, Target, Users } from 'lucide-react'
import { SOCIAL_ICONS, SocialGlyph } from '@/lib/social-icons'
import PixelBlast from '@/components/PixelBlast'
import { highlightQuote } from '@/components/cards/QuoteHighlight'
import type { BrandProfile } from '@/lib/brand'
import { saveKeywordMapping } from '@/lib/brand'
import { COMPETITORS, GROUP_QUERIES, GROUP_SETS, KEYWORD_TARGETS, RETRY_SEARCH_SETS, revealQuestion, SITE_PAGE_PATHS } from '@/lib/reveal/flow'
import { revealMachine } from '@/lib/reveal/machine'
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought'
import {
  entryStep,
  mainStep,
  nestedIntroStep,
  nestedTerminalStep,
  subStep,
  terminalStep,
  trunkStep,
} from '@/components/ai-elements/chain-joints'
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
function InlineToolChip({ logo, name, blast }: { logo?: string; name: string; blast?: boolean }) {
  return (
    <span className="shadow-hard relative inline-flex items-center gap-1.5 overflow-hidden rounded-sm bg-white px-0.5 py-0.5 text-black">
      {blast ? (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0">
          <PixelBlast
            variant="circle"
            pixelSize={7}
            color="#ff6a00"
            patternScale={2}
            patternDensity={2.8}
            pixelSizeJitter={0.4}
            enableRipples={false}
            liquid
            liquidStrength={0.1}
            liquidRadius={1}
            liquidWobbleSpeed={4}
            speed={1}
            edgeFade={0.45}
            transparent
          />
        </span>
      ) : null}
      <span className="relative z-10 inline-flex items-center gap-1.5">
        {logo ? <img src={logo} alt="" aria-hidden="true" className="size-5 shrink-0" /> : null}
        {name}
      </span>
    </span>
  )
}

function toolChipFor(word: string): { logo?: string; name: string; trailing: string; blast?: boolean } | null {  const trailing = word.match(/[.,!?;:]+$/)?.[0] ?? ''
  const clean = trailing ? word.slice(0, -trailing.length) : word
  if (clean === 'Firecrawl') return { logo: '/brand-assets/firecrawl-logo.svg', name: 'Firecrawl', trailing, blast: true }
  if (clean === 'Treg') return { logo: '/brand-assets/treglogo.svg', name: 'Treg', trailing }
  if (clean === 'DataForSEO') return { logo: '/brand-assets/dataforseo.svg', name: 'DataForSEO', trailing }
  return null
}

function renderStreamedWords(all: string[], shown: number, complete: boolean) {
  return (
    <>
      {all.slice(0, shown).map((word, index, arr) => {
        const chip = toolChipFor(word)
        return (
          <span key={index}>
            {chip ? <InlineToolChip logo={chip.logo} name={chip.name} blast={chip.blast} /> : word}
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
 * White variant of the dashboard KeywordCard: same squircle surface, icon
 * rail and quoted-phrase layout, but paper-white for the onboarding backdrop.
 * Single-select — picking one saves the mapping and unlocks Continue.
 */
const OPERATOR_STOP = new Set(['AND', 'OR', 'NOT', 'NEAR'])

/** Operand terms of a dork phrase, for QuoteHighlight — operators excluded. */
function operandTerms(phrase: string): string[] {
  return phrase.split(/[^a-zA-Z]+/).filter((word) => word.length > 2 && !OPERATOR_STOP.has(word.toUpperCase()))
}

function RelateKeywordCard({
  phrase,
  selected,
  onSelect,
}: {
  phrase: string
  selected: boolean
  onSelect: () => void
}) {
  const clip = useSquircleClip<HTMLDivElement>(20)
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected} title={`Select “${phrase}”`} className="w-full text-left">
      <span
        ref={clip.ref}
        style={clip.style}
        className={`shadow-hard flex items-center gap-4 bg-white p-5 ${
          selected ? 'ring-4 ring-white ring-offset-2 ring-offset-[#2a8cff]' : ''
        }`}
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-lg font-bold text-slate-900">{highlightQuote(phrase.replace(/"/g, ''), operandTerms(phrase))}</span>
        </span>
        <span
          aria-hidden="true"
          className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            selected ? 'border-[#2a8cff] bg-[#2a8cff]' : 'border-slate-300 bg-transparent'
          }`}
        >
          {selected ? <Check aria-hidden="true" className="size-4 text-white" /> : null}
        </span>
      </span>
    </button>
  )
}

export function BrandRevealStep({
  profile,
  onContinue,
  leaving = false,
}: {
  profile: BrandProfile
  onContinue: () => void
  leaving?: boolean
}) {
  const fullText = `Okay the brand we're looking for is ${profile.identity.name} — let's use Firecrawl to go through and find out a bit more about who they are.`
  const words = fullText.split(' ')
  const [shown, setShown] = useState(0)
  const done = shown >= words.length
  const sourcesText = `Spinning up a research agent on ${profile.identity.name}. It will scrape the homepage, pull the offerings, and map the brand voice — then hand everything back here.`
  const sourcesWords = sourcesText.split(' ')
  const [sourcesShown, setSourcesShown] = useState(0)
  const sourcesDone = sourcesShown >= sourcesWords.length
  const [pageFound, setPageFound] = useState(0)
  const pageAll = pageFound >= SITE_PAGE_PATHS.length
  const siteBase = profile.identity.website.replace(/\/$/, '')
  const competitorsText = `Let's map out the competitors from the keywords with Treg to see who else is listening.`
  const competitorsWords = competitorsText.split(' ')
  const [competitorsShown, setCompetitorsShown] = useState(0)
  const competitorsDone = competitorsShown >= competitorsWords.length
  const mappingText = `Use Treg to call DataForSEO to get competitors.`
  const mappingWords = mappingText.split(' ')
  const [mappingShown, setMappingShown] = useState(0)
  const mappingDone = mappingShown >= mappingWords.length
  const [foundCount, setFoundCount] = useState(0)
  const foundAll = foundCount >= COMPETITORS.length
  // Forward-only flow machine: competitors → keywords → groups. A No appends
  // a retry round inline at the same stage; Yes records WHERE it happened
  // (initial ask = -1, else retry index) and the downstream subtree renders
  // AFTER that successful round — never jumping back to the first question.
  const [snapshot, send] = useMachine(revealMachine)
  const {
    competitorRetries,
    competitorAcceptedAt,
    keywordInitialPick,
    keywordRetries,
    keywordAcceptedAt,
    groupRetries,
    groupAcceptedAt,
    groupsFamiliar,
    interested,
  } = snapshot.context
  const related = snapshot.context.keywordRelated
  const competitorsAccepted = competitorAcceptedAt !== null
  const keywordsAccepted = keywordAcceptedAt !== null
  const kwLabelText = `Reading all about your competitors with DataForSEO to find the top keywords they're ranking for — oh, this is interesting.`
  const kwLabelWords = kwLabelText.split(' ')
  const [kwShown, setKwShown] = useState(0)
  const kwDone = kwShown >= kwLabelWords.length
  const [kwFound, setKwFound] = useState(0)
  const kwAll = kwFound >= KEYWORD_TARGETS.length
  // Combined history for the shared retry stream: competitor rounds first,
  // then keyword rounds (stages run in order, so only the tail animates).
  const retryRounds = [
    ...competitorRetries.map((round) => ({ origin: 'competitors' as const, setIndex: round.setIndex })),
    ...keywordRetries.map((round) => ({ origin: 'keywords' as const, setIndex: round.setIndex })),
  ]
  const [retryShown, setRetryShown] = useState(0)
  const [retryFound, setRetryFound] = useState(0)
  const activeRound = retryRounds.length ? retryRounds[retryRounds.length - 1] : null
  const retrySet = activeRound ? RETRY_SEARCH_SETS[activeRound.origin][activeRound.setIndex] : null
  const retryWords = retrySet ? retrySet.label.split(' ') : []
  const retryDone = retryShown >= retryWords.length
  const retryAllDone = retrySet ? retryFound >= retrySet.items.length : false
  const kwBranchRef = useRef<HTMLDivElement>(null)
  const groupsRef = useRef<HTMLDivElement>(null)
  const retryAskRef = useRef<HTMLDivElement>(null)

  function scrollToRef(ref: RefObject<HTMLDivElement | null>) {
    requestAnimationFrame(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ref.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    })
  }

  // Guarantee the re-ask is seen: when the latest round completes, bring its
  // question into view (the bottom-pinning autoscroll only follows new
  // content downward — it never brings earlier content back up).
  useEffect(() => {
    if (!activeRound || !retryAllDone || !retryAskRef.current) return
    scrollToRef(retryAskRef)
  }, [activeRound, retryAllDone])
  const groupLabelText = `Looking up Facebook groups and subreddits near you…`
  const groupLabelWords = groupLabelText.split(' ')
  const [groupShown, setGroupShown] = useState(0)
  const groupDone = groupShown >= groupLabelWords.length
  // Initial round uses GROUP_SETS[0]; retry i uses its stored setIndex.
  const initialGroupSet = GROUP_SETS[0]
  const acceptedGroupSet =
    groupAcceptedAt === null
      ? null
      : groupAcceptedAt === -1
        ? GROUP_SETS[0]
        : GROUP_SETS[groupRetries[groupAcceptedAt].setIndex % GROUP_SETS.length]
  const fqText = `We're going to be using Firecrawl to go through and find some queries.`
  const fqWords = fqText.split(' ')
  const [fqShown, setFqShown] = useState(0)
  const fqDone = fqShown >= fqWords.length
  const [queryFound, setQueryFound] = useState(0)
  const queryAll = queryFound >= GROUP_QUERIES.length
  const fitText = `We found some groups — making sure they're a fit, searching again to add more.`
  const fitWords = fitText.split(' ')
  const [fitShown, setFitShown] = useState(0)
  const fitDone = fitShown >= fitWords.length

  function resetGroupStream() {
    setGroupShown(0)
    setFqShown(0)
    setQueryFound(0)
    setFitShown(0)
  }

  function selectRelated(phrase: string) {
    // Initial relate only — once retry rounds exist the initial cards freeze
    // as history; picks happen inside the latest retry round instead.
    if (keywordRetries.length > 0) return
    send({ type: 'KEYWORD_SELECT', phrase })
    saveKeywordMapping({
      targets: KEYWORD_TARGETS.map((target) => ({ ...target, pages: [...target.pages] })),
      strategies: [],
      selectedPhrase: phrase,
    })
  }

  function selectRetryRelated(phrase: string, at: number) {
    send({ type: 'KEYWORD_RETRY_SELECT', phrase, at })
    saveKeywordMapping({
      targets: KEYWORD_TARGETS.map((target) => ({ ...target, pages: [...target.pages] })),
      strategies: [],
      selectedPhrase: phrase,
    })
  }

  function answerCompetitorsYes(at: number) {
    send({ type: 'COMPETITORS_YES', at })
  }

  function answerCompetitorsNo(at: number) {
    // Only one round plays at a time — a fresh No while the latest round is
    // still streaming is ignored; completed rounds stay put as history.
    if (activeRound && !retryAllDone) return
    send({ type: 'COMPETITORS_NO', at })
    setRetryShown(0)
    setRetryFound(0)
  }

  function answerKeywordsYes(at: number) {
    send({ type: 'KEYWORDS_YES', at })
  }

  function answerKeywordsNo(at: number) {
    if (activeRound && !retryAllDone) return
    send({ type: 'KEYWORDS_NO', at })
    setRetryShown(0)
    setRetryFound(0)
  }

  function groupSetFor(at: number) {
    return at === -1 ? GROUP_SETS[0] : GROUP_SETS[groupRetries[at].setIndex % GROUP_SETS.length]
  }

  function answerFamiliar(yes: boolean, at: number) {
    if (yes) {
      send({ type: 'GROUPS_YES', at })
      saveKeywordMapping({
        targets: KEYWORD_TARGETS.map((target) => ({ ...target, pages: [...target.pages] })),
        strategies: [],
        selectedPhrase: related ?? undefined,
        groups: groupSetFor(at).map(({ id, platform, name, detail }) => ({ id, platform, name, detail })),
        interested: [],
      })
    } else {
      send({ type: 'GROUPS_NO', at })
      resetGroupStream()
    }
  }

  function toggleInterested(id: string) {
    if (!acceptedGroupSet) return
    const next = interested.includes(id) ? interested.filter((row) => row !== id) : [...interested, id]
    send({ type: 'GROUPS_TOGGLE', id })
    saveKeywordMapping({
      targets: KEYWORD_TARGETS.map((target) => ({ ...target, pages: [...target.pages] })),
      strategies: [],
      selectedPhrase: related ?? undefined,
      groups: acceptedGroupSet.map(({ id: groupId, platform, name, detail }) => ({ id: groupId, platform, name, detail })),
      interested: next,
    })
  }

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
    if (!sourcesDone || pageAll) return
    const id = window.setTimeout(() => setPageFound((prev) => prev + 1), 550)
    return () => window.clearTimeout(id)
  }, [sourcesDone, pageAll, pageFound])

  useEffect(() => {
    if (!pageAll || competitorsDone) return
    const id = window.setTimeout(
      () => setCompetitorsShown((prev) => Math.min(prev + 1, competitorsWords.length)),
      90
    )
    return () => window.clearTimeout(id)
  }, [pageAll, competitorsShown, competitorsDone, competitorsWords.length])

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

  useEffect(() => {
    if (!competitorsAccepted || kwDone) return
    const id = window.setTimeout(() => setKwShown((prev) => Math.min(prev + 1, kwLabelWords.length)), 90)
    return () => window.clearTimeout(id)
  }, [competitorsAccepted, kwShown, kwDone, kwLabelWords.length])

  useEffect(() => {
    if (!kwDone || kwAll) return
    const id = window.setTimeout(() => setKwFound((prev) => prev + 1), 550)
    return () => window.clearTimeout(id)
  }, [kwDone, kwAll, kwFound])

  useEffect(() => {
    if (!keywordsAccepted || groupDone) return
    const id = window.setTimeout(() => setGroupShown((prev) => Math.min(prev + 1, groupLabelWords.length)), 90)
    return () => window.clearTimeout(id)
  }, [keywordsAccepted, groupShown, groupDone, groupLabelWords.length])

  useEffect(() => {
    if (!groupDone || fqDone) return
    const id = window.setTimeout(() => setFqShown((prev) => Math.min(prev + 1, fqWords.length)), 90)
    return () => window.clearTimeout(id)
  }, [groupDone, fqShown, fqDone, fqWords.length])

  useEffect(() => {
    if (!fqDone || queryAll) return
    const id = window.setTimeout(() => setQueryFound((prev) => prev + 1), 550)
    return () => window.clearTimeout(id)
  }, [fqDone, queryAll, queryFound])

  useEffect(() => {
    if (!queryAll || fitDone) return
    const id = window.setTimeout(() => setFitShown((prev) => Math.min(prev + 1, fitWords.length)), 90)
    return () => window.clearTimeout(id)
  }, [queryAll, fitShown, fitDone, fitWords.length])

  useEffect(() => {
    if (!retrySet || retryDone) return
    const id = window.setTimeout(() => setRetryShown((prev) => Math.min(prev + 1, retryWords.length)), 90)
    return () => window.clearTimeout(id)
  }, [retrySet, retryShown, retryDone, retryWords.length])

  useEffect(() => {
    if (!retrySet || !retryDone || retryAllDone) return
    const id = window.setTimeout(() => setRetryFound((prev) => prev + 1), 550)
    return () => window.clearTimeout(id)
  }, [retrySet, retryDone, retryFound, retryAllDone])

  function blurAnd(sendFn: () => void) {
    return (e: React.MouseEvent<HTMLButtonElement>) => {
      // Blur first: this button unmounts on answer, and a focused node
      // vanishing mid-transition makes the browser fire its own scroll that
      // cancels ours.
      e.currentTarget.blur()
      sendFn()
    }
  }

  // One groups lookup trunk: when `active` it streams from the shared
  // counters, otherwise it renders complete as frozen history.
  function renderGroupTrunk({
    set,
    active,
    attemptKey,
  }: {
    set: typeof initialGroupSet
    active: boolean
    attemptKey: string
  }) {
    const gShown = active ? groupShown : groupLabelWords.length
    const gDone = active ? groupDone : true
    const fShown = active ? fqShown : fqWords.length
    const fDone = active ? fqDone : true
    const qFound = active ? queryFound : GROUP_QUERIES.length
    const qAll = active ? queryAll : true
    const ftShown = active ? fitShown : fitWords.length
    const ftDone = active ? fitDone : true
    return (
      <ChainOfThoughtStep
        icon={Users}
        status={gDone ? 'complete' : 'active'}
        label={
          <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
            <StreamedLabel words={groupLabelWords} shown={gShown} complete={gDone} />
          </span>
        }
        className={trunkStep()}
      >
        {gDone ? (
        <ChainOfThought className="space-y-0 pt-8 text-white">
          <ChainOfThoughtStep
            icon={SearchIcon}
            status={fDone ? 'complete' : 'active'}
            elbow
            label={
              <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                <StreamedLabel words={fqWords} shown={fShown} complete={fDone} />
              </span>
            }
            className={nestedIntroStep()}
          />
          {GROUP_QUERIES.slice(0, qFound).map((query, index) => {
            const isLastQuery = qAll && index === qFound - 1
            return (
              <ChainOfThoughtStep
                key={query}
                icon={Check}
                status="complete"
                compact={!isLastQuery}
                elbow={isLastQuery ? 'out' : undefined}
                label={
                  <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                    Found query {index + 1} — {query}
                  </span>
                }
                className={subStep()}
              />
            )
          })}
          {qAll ? (
            <ChainOfThoughtStep
              icon={Check}
              status={ftDone ? 'complete' : 'active'}
              label={
                <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                  <StreamedLabel words={fitWords} shown={ftShown} complete={ftDone} />
                </span>
              }
              className={nestedTerminalStep()}
            />
          ) : null}
        </ChainOfThought>
        ) : null}
        {ftDone ? (
          <div className="flex flex-col gap-2" key={attemptKey}>
            {set.map((group) => {
              const icon = SOCIAL_ICONS.find((row) => row.id === group.platform)
              return (
                <div
                  key={group.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3"
                >
                  {icon ? (
                    <SocialGlyph icon={icon} className="size-8 shrink-0 text-white" />
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-white">{group.name}</span>
                    <span className="block truncate text-sm text-white/70">{group.detail}</span>
                  </span>
                </div>
              )
            })}
          </div>
        ) : null}
      </ChainOfThoughtStep>
    )
  }

  function renderFamiliarAsk({ at, state }: { at: number; state: 'buttons' | 'history' }) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <ChainOfThoughtStep
          icon={HelpCircle}
          status={state === 'buttons' ? 'active' : 'complete'}
          label={
            <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
              {revealQuestion('groups-familiar')}
            </span>
          }
          className={terminalStep()}
        >
          {state === 'buttons' ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => answerFamiliar(true, at)}
                className="rounded-lg bg-white px-5 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-white/90"
              >
                Yes — familiar
              </button>
              <button
                type="button"
                onClick={() => answerFamiliar(false, at)}
                className="rounded-lg border border-white/40 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                No — try again
              </button>
            </div>
          ) : (
            <p className="text-base text-white/80">No problem — checking the next batch below.</p>
          )}
        </ChainOfThoughtStep>
      </div>
    )
  }

  function renderInterested(set: typeof initialGroupSet) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <ChainOfThoughtStep
          icon={Users}
          status={interested.length > 0 ? 'complete' : 'active'}
          label={
            <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
              {revealQuestion('groups-interested')}
            </span>
          }
          className={terminalStep()}
        >
          <div className="flex flex-col gap-2">
            {set.map((group) => {
              const icon = SOCIAL_ICONS.find((row) => row.id === group.platform)
              const active = interested.includes(group.id)
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => toggleInterested(group.id)}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                    active
                      ? 'border-white bg-white'
                      : 'border-white/20 bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {icon ? (
                    <SocialGlyph
                      icon={icon}
                      className={`size-8 shrink-0 ${active ? 'text-[#2a8cff]' : 'text-white'}`}
                    />
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate font-bold ${active ? 'text-slate-900' : 'text-white'}`}>
                      {group.name}
                    </span>
                    <span className={`block truncate text-sm ${active ? 'text-slate-500' : 'text-white/70'}`}>
                      {group.detail}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      active ? 'border-[#2a8cff] bg-[#2a8cff]' : 'border-white/40 bg-transparent'
                    }`}
                  >
                    {active ? <Check aria-hidden="true" className="size-4 text-white" /> : null}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-sm text-white/60">
            Posting and listening starts where your people already are.
          </p>
        </ChainOfThoughtStep>
      </div>
    )
  }

  // Groups subtree renders AFTER the successful keyword confirm — either
  // right after the initial confirm or inside the accepted retry round. A No
  // appends a retry round inline (same pattern as competitors/keywords):
  // history persists, only the latest round animates, and Yes continues
  // forward from the accepted round with that round's community set.
  function renderGroupsSubtree() {
    const isInitialActive = groupRetries.length === 0 && groupAcceptedAt === null
    const initialAccepted = groupAcceptedAt === -1
    const initialTrunkDone = isInitialActive ? fitDone : true
    return (
      <>
        <div ref={groupsRef} className="mx-auto w-full max-w-2xl">
          {renderGroupTrunk({ set: initialGroupSet, active: isInitialActive, attemptKey: 'groups-initial' })}
        </div>
        {initialTrunkDone && isInitialActive
          ? renderFamiliarAsk({ at: -1, state: 'buttons' })
          : null}
        {initialTrunkDone && !isInitialActive && !initialAccepted
          ? renderFamiliarAsk({ at: -1, state: 'history' })
          : null}
        {initialAccepted && groupsFamiliar && acceptedGroupSet ? renderInterested(acceptedGroupSet) : null}
        {groupRetries.map((round, roundIndex) => {
          const set = GROUP_SETS[round.setIndex % GROUP_SETS.length]
          const isLatest = roundIndex === groupRetries.length - 1 && groupAcceptedAt === null
          const isAcceptedHere = groupAcceptedAt === roundIndex
          const active = isLatest
          const trunkDone = active ? fitDone : true
          return (
            <div key={`groups-${round.setIndex}-${roundIndex}`} className="mx-auto w-full max-w-2xl">
              {renderGroupTrunk({ set, active, attemptKey: `groups-retry-${roundIndex}` })}
              {trunkDone && isLatest ? renderFamiliarAsk({ at: roundIndex, state: 'buttons' }) : null}
              {trunkDone && !isLatest && !isAcceptedHere
                ? renderFamiliarAsk({ at: roundIndex, state: 'history' })
                : null}
              {isAcceptedHere && groupsFamiliar && acceptedGroupSet
                ? renderInterested(acceptedGroupSet)
                : null}
            </div>
          )
        })}
      </>
    )
  }

  // Keyword subtree renders AFTER the successful competitor ask — either
  // right after the initial ask or inside the accepted retry round.
  function renderKeywordSubtree() {
    const showInitialConfirmButtons = keywordRetries.length === 0 && keywordAcceptedAt === null
    return (
      <>
        <div ref={kwBranchRef} className="mx-auto w-full max-w-2xl">
          {/* TRUNK (same pattern as Swords above): fixed 64px rail, never
              full height, + overflow-visible for the entry elbow below. */}
          <ChainOfThoughtStep
            icon={KeyRound}
            status={kwDone ? 'complete' : 'active'}
            label={
              <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                <StreamedLabel words={kwLabelWords} shown={kwShown} complete={kwDone} />
              </span>
            }
            className={trunkStep()}
          >
            {kwDone ? (
            <ChainOfThought className="space-y-0 pt-8 text-white">
              {/* First target takes the ENTRY elbow, the final target
                  takes the EXIT elbow (dropping `compact`); middle steps
                  keep compact rails. Same joints as the competitors chain. */}
              {KEYWORD_TARGETS.slice(0, kwFound).map((target, index) => {
                const isLastTarget = index === KEYWORD_TARGETS.length - 1
                return (
                <ChainOfThoughtStep
                  key={target.phrase}
                  icon={Target}
                  status="complete"
                  compact={!isLastTarget}
                  elbow={isLastTarget ? 'out' : index === 0 ? 'in' : undefined}
                  label={
                    <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                      {target.phrase} — {target.intent}
                    </span>
                  }
                  className={subStep()}
                >
                  <div className="flex flex-wrap items-center gap-2 -mt-1">
                    {target.pages.map((page) => (
                      <Source key={page.href} href={page.href}>
                        <SourceTrigger showFavicon label={page.title} className="rounded-sm" />
                        <SourceContent title={page.title} description={`Ranking page for “${target.phrase}”.`} />
                      </Source>
                    ))}
                  </div>
                </ChainOfThoughtStep>
                )
              })}
            </ChainOfThought>
            ) : null}
          </ChainOfThoughtStep>
        </div>
        {kwAll ? (
          <div className="mx-auto w-full max-w-2xl">
            <ChainOfThoughtStep
              icon={HelpCircle}
              status={keywordInitialPick ? 'complete' : 'active'}
              label={
                <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                  {revealQuestion('keyword-relate')}
                </span>
              }
              className={mainStep()}
            >
              <div className="grid grid-cols-1 gap-4">
                {KEYWORD_TARGETS.map((target) => (
                  <RelateKeywordCard
                    key={target.phrase}
                    phrase={target.phrase}
                    selected={keywordInitialPick === target.phrase}
                    onSelect={() => selectRelated(target.phrase)}
                  />
                ))}
              </div>
            </ChainOfThoughtStep>
          </div>
        ) : null}
        {keywordInitialPick ? (
          <div className="mx-auto w-full max-w-2xl">
            <ChainOfThoughtStep
              icon={Check}
              status={keywordsAccepted ? 'complete' : 'active'}
              label={
                <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                  {revealQuestion('keywords-sound-good')}
                </span>
              }
              className={terminalStep()}
            >
              {showInitialConfirmButtons ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={blurAnd(() => answerKeywordsYes(-1))}
                    className="rounded-lg bg-white px-5 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-white/90"
                  >
                    Yes — sounds good
                  </button>
                  <button
                    type="button"
                    onClick={blurAnd(() => answerKeywordsNo(-1))}
                    className="rounded-lg border border-white/40 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    No — pick again
                  </button>
                </div>
              ) : keywordAcceptedAt === -1 ? (
                <p className="text-base text-white/80">Sounds good — locking that in.</p>
              ) : keywordRetries.length > 0 && keywordAcceptedAt === null ? (
                <p className="text-base text-white/80">No problem — running another scan below.</p>
              ) : null}
            </ChainOfThoughtStep>
          </div>
        ) : null}
        {keywordAcceptedAt === -1 ? renderGroupsSubtree() : null}
        {keywordRetries.map((round, roundIndex) => {
          const roundSet = RETRY_SEARCH_SETS.keywords[round.setIndex]
          const roundWords = roundSet.label.split(' ')
          const isLatestOverall =
            roundIndex === keywordRetries.length - 1 &&
            keywordAcceptedAt === null
          const isAcceptedHere = keywordAcceptedAt === roundIndex
          const shown = isLatestOverall ? retryShown : roundWords.length
          const found = isLatestOverall ? retryFound : roundSet.items.length
          const labelDone = shown >= roundWords.length
          const allDone = found >= roundSet.items.length
          const interactive = isLatestOverall && !isAcceptedHere
          return (
          <div key={`keywords-${round.setIndex}-${roundIndex}`} className="mx-auto w-full max-w-2xl">
            <ChainOfThoughtStep
              icon={SearchIcon}
              status={labelDone ? 'complete' : 'active'}
              label={
                <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                  <StreamedLabel words={roundWords} shown={shown} complete={labelDone} />
                </span>
              }
              className={trunkStep()}
            >
              {labelDone ? (
              <ChainOfThought className="space-y-0 pt-8 text-white">
                {roundSet.items.slice(0, found).map((item, index) => {
                  const isLastRetry = allDone && index === found - 1
                  return (
                    <ChainOfThoughtStep
                      key={item.title}
                      icon={Check}
                      status="complete"
                      compact={!isLastRetry}
                      elbow={isLastRetry ? 'out' : index === 0 ? 'in' : undefined}
                      label={
                        <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                          {item.title} — {item.detail}
                        </span>
                      }
                      className={subStep()}
                    />
                  )
                })}
              </ChainOfThought>
              ) : null}
            </ChainOfThoughtStep>
            {allDone ? (
              <div ref={interactive && !round.pick ? retryAskRef : undefined} className="mx-auto mt-6 w-full max-w-2xl">
                <ChainOfThoughtStep
                  icon={HelpCircle}
                  status={round.pick ? 'complete' : 'active'}
                  label={
                    <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                      {revealQuestion('keyword-relate')}
                    </span>
                  }
                  className={mainStep()}
                >
                  <div className="grid grid-cols-1 gap-4">
                    {roundSet.items.map((item) => (
                      <RelateKeywordCard
                        key={item.title}
                        phrase={item.title}
                        selected={round.pick === item.title}
                        onSelect={
                          interactive
                            ? () => selectRetryRelated(item.title, roundIndex)
                            : () => {}
                        }
                      />
                    ))}
                  </div>
                </ChainOfThoughtStep>
              </div>
            ) : null}
            {allDone && round.pick ? (
              <div ref={interactive ? retryAskRef : undefined} className="mx-auto mt-6 w-full max-w-2xl">
                <ChainOfThoughtStep
                  icon={HelpCircle}
                  status={isAcceptedHere ? 'complete' : 'active'}
                  label={
                    <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                      {revealQuestion('keywords-sound-good')}
                    </span>
                  }
                  className={terminalStep()}
                >
                  {isAcceptedHere ? (
                    <p className="text-base text-white/80">Sounds good — locking that in.</p>
                  ) : interactive ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={blurAnd(() => {
                        answerKeywordsYes(roundIndex)
                        scrollToRef(groupsRef)
                      })}
                      className="rounded-lg bg-white px-5 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-white/90"
                    >
                      Yes — sounds good
                    </button>
                    <button
                      type="button"
                      onClick={blurAnd(() => answerKeywordsNo(roundIndex))}
                      className="rounded-lg border border-white/40 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      No — search again
                    </button>
                  </div>
                  ) : (
                    <p className="text-base text-white/80">Not quite — scanning again below.</p>
                  )}
                </ChainOfThoughtStep>
              </div>
            ) : null}
            {isAcceptedHere ? renderGroupsSubtree() : null}
          </div>
          )
        })}
      </>
    )
  }

  const showInitialCompetitorButtons = competitorAcceptedAt === null && competitorRetries.length === 0

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
              className={mainStep()}
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
                className={trunkStep()}
              >
                {sourcesDone ? (
                <ChainOfThought className="space-y-0 pt-8 text-white">
                  {SITE_PAGE_PATHS.slice(0, pageFound).map((page, index) => {
                    const isLastPage = pageAll && index === pageFound - 1
                    return (
                      <ChainOfThoughtStep
                        key={page.path}
                        icon={Check}
                        status="complete"
                        compact={!isLastPage}
                        elbow={isLastPage ? 'out' : index === 0 ? 'in' : undefined}
                        label={
                          <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                            Found page {index + 1} — /{page.path}
                          </span>
                        }
                        className={subStep()}
                      >
                        <div className="flex flex-wrap items-center gap-2 -mt-1">
                          <Source href={`${siteBase}/${page.path}`}>
                            <SourceTrigger showFavicon label={page.title} className="rounded-sm" />
                            <SourceContent
                              title={`${profile.identity.name} — ${page.title}`}
                              description={`Scraped from ${siteBase}.`}
                            />
                          </Source>
                        </div>
                      </ChainOfThoughtStep>
                    )
                  })}
                </ChainOfThought>
                ) : null}
                {pageAll ? (
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
          {pageAll ? (
            <div className="mx-auto w-full max-w-2xl">
              {/* TRUNK: fixed 64px rail (never full height — that would double
                  the nested rails into one long line) + overflow-visible so
                  the entry elbow below isn't clipped by the content column. */}
              <ChainOfThoughtStep
                icon={Swords}
                status={mappingDone ? 'complete' : 'active'}
                label={
                  <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                    <StreamedLabel words={competitorsWords} shown={competitorsShown} complete={competitorsDone} />
                  </span>
                }
                className={trunkStep()}
              >
                {competitorsDone ? (
                <ChainOfThought className="space-y-0 pt-8 text-white">
                  {/* ENTRY: elbow branches off the trunk above and curves
                      right into this icon. Rail is fixed 96px (never auto —
                      an auto rail grows while streaming and drifts). */}
                  <ChainOfThoughtStep
                    icon={Map}
                    status={mappingDone ? 'complete' : 'active'}
                    elbow="in"
                    label={
                      <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                        <StreamedLabel words={mappingWords} shown={mappingShown} complete={mappingDone} />
                      </span>
                    }
                    className={entryStep()}
                  />
                  {COMPETITORS.slice(0, foundCount).map((competitor, index) => {
                    // EXIT: only the final found competitor gets elbow="out"
                    // (and drops `compact`) — its rail curves back out left
                    // to rejoin the trunk instead of running straight down.
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
                        className={subStep()}
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
              {/* TERMINAL: bottom-0 ends this rail flush at its row — the last
                  step in a run must not dangle past it. */}
              <ChainOfThoughtStep
                icon={HelpCircle}
                status={showInitialCompetitorButtons ? 'active' : 'complete'}
                label={
                  <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                    Do any of these competitors ring a bell?
                  </span>
                }
                className={terminalStep()}
              >
                {showInitialCompetitorButtons ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={blurAnd(() => answerCompetitorsYes(-1))}
                      className="rounded-lg bg-white px-5 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-white/90"
                    >
                      Yes — I know them
                    </button>
                    <button
                      type="button"
                      onClick={blurAnd(() => answerCompetitorsNo(-1))}
                      className="rounded-lg border border-white/40 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      No — new to me
                    </button>
                  </div>
                ) : (
                  <p className="text-base text-white/80">
                    {competitorAcceptedAt === -1
                      ? `Nice — we'll track them against ${profile.identity.name}.`
                      : 'No problem — we\u2019ll keep listening anyway.'}
                  </p>
                )}
              </ChainOfThoughtStep>
            </div>
          ) : null}
          {/* Yes at the initial ask continues right here; Yes inside a retry
              continues inside that round below — never jumps back up. */}
          {competitorAcceptedAt === -1 ? renderKeywordSubtree() : null}
          {competitorRetries.map((round, roundIndex) => {
            const roundSet = RETRY_SEARCH_SETS.competitors[round.setIndex]
            const roundWords = roundSet.label.split(' ')
            const isLatestOverall =
              roundIndex === competitorRetries.length - 1 &&
              competitorAcceptedAt === null &&
              keywordRetries.length === 0
            const isAcceptedHere = competitorAcceptedAt === roundIndex
            const shown = isLatestOverall ? retryShown : roundWords.length
            const found = isLatestOverall ? retryFound : roundSet.items.length
            const labelDone = shown >= roundWords.length
            const allDone = found >= roundSet.items.length
            const showAsk = allDone && (isLatestOverall || isAcceptedHere)
            return (
            <div key={`competitors-${round.setIndex}-${roundIndex}`} className="mx-auto w-full max-w-2xl">
              <ChainOfThoughtStep
                icon={SearchIcon}
                status={labelDone ? 'complete' : 'active'}
                label={
                  <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                    <StreamedLabel words={roundWords} shown={shown} complete={labelDone} />
                  </span>
                }
                className={trunkStep()}
              >
                {labelDone ? (
                <ChainOfThought className="space-y-0 pt-8 text-white">
                  {roundSet.items.slice(0, found).map((item, index) => {
                    const isLastRetry = allDone && index === found - 1
                    return (
                      <ChainOfThoughtStep
                        key={item.title}
                        icon={Check}
                        status="complete"
                        compact={!isLastRetry}
                        elbow={isLastRetry ? 'out' : index === 0 ? 'in' : undefined}
                        label={
                          <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                            {item.title} — {item.detail}
                          </span>
                        }
                        className={subStep()}
                      />
                    )
                  })}
                </ChainOfThought>
                ) : null}
              </ChainOfThoughtStep>
              {showAsk ? (
                <div ref={isLatestOverall && !isAcceptedHere ? retryAskRef : undefined} className="mx-auto mt-6 w-full max-w-2xl">
                  <ChainOfThoughtStep
                    icon={HelpCircle}
                    status={isAcceptedHere ? 'complete' : 'active'}
                    label={
                      <span className="text-xl font-medium leading-relaxed text-white sm:text-2xl">
                        {revealQuestion('competitors-familiar')}
                      </span>
                    }
                    className={terminalStep()}
                  >
                    {isAcceptedHere ? (
                      <p className="text-base text-white/80">
                        {`Nice — we'll track them against ${profile.identity.name}.`}
                      </p>
                    ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={blurAnd(() => {
                          answerCompetitorsYes(roundIndex)
                          scrollToRef(kwBranchRef)
                        })}
                        className="rounded-lg bg-white px-5 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-white/90"
                      >
                        Yes — I know them
                      </button>
                      <button
                        type="button"
                        onClick={blurAnd(() => answerCompetitorsNo(roundIndex))}
                        className="rounded-lg border border-white/40 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                      >
                        No — new to me
                      </button>
                    </div>
                    )}
                  </ChainOfThoughtStep>
                </div>
              ) : null}
              {/* The loop-back lands here: keywords continue from this exact
                  round onwards, visually staying put instead of rewinding to
                  the first question. */}
              {isAcceptedHere ? renderKeywordSubtree() : null}
            </div>
            )
          })}
        </ChainOfThought>
      </div>
      {interested.length > 0 ? (
        <Button
          type="button"
          onClick={onContinue}
          disabled={leaving}
          size="xl"
          shadow="hard"
          className="mt-10 h-14 rounded-xl bg-white px-10 font-bold text-slate-900 hover:bg-white/90 disabled:opacity-70"
        >
          {leaving ? 'Wrapping up…' : 'Continue'}
        </Button>
      ) : null}
    </div>
  )
}
