import { useEffect, useState } from 'react'
import { useToast } from '@listeningkit/ui'
import {
  createKeyword,
  getKeywords,
  type Keyword
} from '../lib/keywords'
import { platformLabel, type ConnectionPlatform } from '../lib/connections'
import { getCommunities, type Community } from '../lib/communities'
import { SOCIAL_ICONS, SocialBadge, type SocialIcon } from '../lib/social-icons'
import { DashboardFormSheet } from './DashboardFormSheet'
import { EmptyLine, LoadingLine, PickRow, PlatformPick } from './DashboardFormPrimitives'

function iconFor(platform: ConnectionPlatform): SocialIcon {
  return SOCIAL_ICONS.find((icon) => icon.id === platform) ?? SOCIAL_ICONS[0]
}

/**
 * Add a keyword. The step shape follows the platform relation:
 *  - x: platform → phrase (2 steps) — X is word-based; the words are
 *    combined into one phrase, there is no group to scope under.
 *  - facebook / reddit: platform → group → phrase (3 steps) — the keyword
 *    must be scoped to a group you're already joined.
 * Fetches on a step confirm drive the sheet's busy state until the data is
 * ready, so a step never unlocks half-loaded.
 */
export function DashboardKeywordsForm({
  open,
  onClose,
  onCreated
}: {
  open: boolean
  onClose: () => void
  /** Fires after a successful create so the parent page can reconcile. */
  onCreated: () => void
}) {
  const { success, error: notifyError } = useToast()
  const [platform, setPlatform] = useState<ConnectionPlatform | null>(null)
  // Selecting a platform tile only marks the card — the sheet's Continue
  // button flips this and unlocks the next step, so step one never
  // auto-advances.
  const [platformConfirmed, setPlatformConfirmed] = useState(false)
  // Same gate for the group step: picking a group only marks the row;
  // Continue unlocks the phrase step.
  const [groupConfirmed, setGroupConfirmed] = useState(false)
  const [joinedGroups, setJoinedGroups] = useState<Community[] | null>(null)
  const [groupId, setGroupId] = useState<string | null>(null)
  const [existing, setExisting] = useState<Keyword[] | null>(null)
  const [phrase, setPhrase] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setPlatform(null)
    setPlatformConfirmed(false)
    setGroupConfirmed(false)
    setJoinedGroups(null)
    setGroupId(null)
    setExisting(null)
    setPhrase('')
    setBusy(false)
  }, [open])

  const stepCount = platform === null ? 0 : platform === 'x' ? 2 : 3
  const step = !platformConfirmed ? 1 : platform === 'x' ? 2 : !groupConfirmed ? 2 : 3
  const pickingGroup = platform !== null && platformConfirmed && platform !== 'x' && !groupConfirmed
  const composing = platform !== null && platformConfirmed && (platform === 'x' ? step === 2 : groupConfirmed)
  const selectedGroup = (joinedGroups ?? []).find((group) => group.id === groupId) ?? null

  // The keyword scope (platform + group) is fixed by the time we compose —
  // pull the phrases already listening there so the user can see them.
  useEffect(() => {
    if (!open || !composing || !platform) {
      setExisting(null)
      return
    }
    let cancelled = false
    getKeywords({ platform, groupId: platform === 'x' ? null : groupId })
      .then((list) => {
        if (!cancelled) setExisting(list)
      })
      .catch(() => {
        if (!cancelled) setExisting([])
      })
    return () => {
      cancelled = true
    }
  }, [open, composing, platform, groupId])

  const stepHint =
    step === 1
      ? 'Pick the platform, then press Continue.'
      : pickingGroup
        ? 'Pick the group, then press Continue.'
        : platform === 'x'
          ? 'Combine the words you want to see together — all of them must appear.'
          : `Phrase to watch in ${selectedGroup?.name ?? 'the group'}.`

  function back() {
    if (composing && platform !== 'x') {
      // Phrase → group step.
      setPhrase('')
      setExisting(null)
      setGroupId(null)
      setGroupConfirmed(false)
      return
    }
    // Everything else collapses to the platform pick.
    setPlatform(null)
    setPlatformConfirmed(false)
    setGroupConfirmed(false)
    setJoinedGroups(null)
    setGroupId(null)
    setExisting(null)
    setPhrase('')
  }

  // Fetching the accepted roster happens on Continue: confirming the
  // platform tile flips the step immediately, so the group step shows its
  // loading line the whole time the fetch is in flight. Pending requests
  // aren't scopes yet — we're not listening there until the group accepts.
  function loadRoster(platformToLoad: ConnectionPlatform) {
    setBusy(true)
    getCommunities({ platform: platformToLoad })
      .then((list) => setJoinedGroups(list.filter((community) => community.joinState === 'accepted')))
      .catch((err: unknown) =>
        notifyError('Could not load groups', err instanceof Error ? err.message : 'Something went wrong.')
      )
      .finally(() => setBusy(false))
  }

  // Step one's Continue: confirm the platform pick and unlock the next
  // step. Facebook / reddit land on the group step immediately, so fetch
  // it here — the roster drives the busy state until it resolves.
  function continueFromPlatform() {
    if (platform === null || platformConfirmed || busy) return
    setPlatformConfirmed(true)
    if (platform !== 'x') loadRoster(platform)
  }

  // Group step's Continue: confirm the group pick and unlock the phrase
  // step. Selecting a row only marks it — the existing-keywords fetch for
  // the phrase step fires off `composing`, which only flips here.
  function continueFromGroup() {
    if (groupId === null || groupConfirmed || busy) return
    setGroupConfirmed(true)
  }

  async function confirm() {
    // Confirm only ever runs the final action: create the keyword.
    if (!composing || !platform || busy) return
    const trimmed = phrase.trim()
    if (!trimmed) return
    setBusy(true)
    try {
      await createKeyword({ phrase: trimmed, platform, groupId: platform === 'x' ? null : groupId })
      success(`“${trimmed}” added`, `${platformLabel(platform)} listening set updated.`)
      onCreated()
      onClose()
    } catch (err: unknown) {
      notifyError('Could not add the keyword', err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <DashboardFormSheet
      open={open}
      title="Add a keyword"
      subtitle="Phrases we listen for — grouped by where you're listening."
      step={step}
      stepCount={stepCount}
      stepHint={stepHint}
      busy={busy}
      confirmLabel={step === 1 || pickingGroup ? 'Continue' : composing ? 'Add keyword' : undefined}
      confirmDisabled={step === 1 ? platform === null : pickingGroup ? groupId === null : phrase.trim() === ''}
      onConfirm={step === 1 ? continueFromPlatform : pickingGroup ? continueFromGroup : confirm}
      onBack={back}
      backDisabled={step === 1}
      onClose={onClose}
    >
      {step === 1 ? (
        <PlatformPick
          value={platform}
          onChange={(next) => {
            setPlatform(next)
            setJoinedGroups(null)
            setGroupId(null)
            setExisting(null)
          }}
        />
      ) : null}

      {pickingGroup && platform ? (
        joinedGroups === null ? (
          <LoadingLine label={`Loading ${platformLabel(platform)} groups…`} />
        ) : joinedGroups.length === 0 ? (
          <EmptyLine
            label={`You aren't joined to any ${platformLabel(platform)} group yet — add one from the Groups page first.`}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {joinedGroups.map((group) => (
              <PickRow
                key={group.id}
                active={groupId === group.id}
                onClick={() => setGroupId(group.id)}
                label={group.name}
                sub={`${group.handle} · ${group.members}${group.accountLabel ? ` · joined as ${group.accountLabel}` : ''}`}
                icon={<SocialBadge icon={iconFor(group.platform)} />}
              />
            ))}
          </div>
        )
      ) : null}

      {composing && platform ? (
        <PhraseStep
          platform={platform}
          group={selectedGroup}
          phrase={phrase}
          existing={existing}
          onPhraseChange={setPhrase}
          onConfirm={confirm}
        />
      ) : null}
    </DashboardFormSheet>
  )
}

function PhraseStep({
  platform,
  group,
  phrase,
  existing,
  onPhraseChange,
  onConfirm
}: {
  platform: ConnectionPlatform
  group: Community | null
  phrase: string
  existing: Keyword[] | null
  onPhraseChange: (value: string) => void
  onConfirm: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      {platform !== 'x' && group ? (
        <div className="flex items-center gap-2 rounded-xl bg-black/[0.03] px-3 py-2.5">
          <SocialBadge icon={iconFor(group.platform)} />
          <span className="truncate text-sm font-semibold text-text-primary">{group.name}</span>
          <span className="ml-auto shrink-0 text-xs text-text-secondary">{group.handle}</span>
        </div>
      ) : null}
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">
          {platform === 'x' ? 'Phrase (words are combined)' : 'Phrase'}
        </span>
        <input
          type="text"
          autoFocus
          value={phrase}
          onChange={(event) => onPhraseChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onConfirm()
          }}
          placeholder={platform === 'x' ? 'e.g. plumber needed near me' : 'e.g. leaking pipe'}
          autoComplete="off"
          className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 placeholder:text-slate-400 focus:border-[#2a8cff] focus:outline-none disabled:opacity-60"
        />
      </label>
      {existing ? (
        existing.length > 0 ? (
          <p className="text-xs text-text-secondary">
            Already listening here:{' '}
            {existing.map((keyword, index) => (
              <span key={keyword.id}>
                <span className="font-semibold text-text-primary">“{keyword.phrase}”</span>
                {index < existing.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
        ) : (
          <p className="text-xs text-text-secondary">No keywords in this scope yet — this is the first.</p>
        )
      ) : (
        <p className="text-xs text-text-secondary">Loading existing keywords…</p>
      )}
    </div>
  )
}