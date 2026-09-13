import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, Clock } from 'lucide-react'
import {
  cn,
  Select,
  Spinner,
  useSquircleClip,
  useToast
} from '@listeningkit/ui'
import {
  getAccounts,
  platformLabel,
  type ConnectionPlatform,
  type ConnectionRecord
} from '../lib/connections'
import {
  getCommunities,
  joinCommunity,
  joinCommunityByUrl,
  parseFacebookGroupUrl,
  resolveCommunityByUrl,
  type Community
} from '../lib/communities'
import { SocialBadge, SOCIAL_ICONS, SocialGlyph, type SocialIcon } from '../lib/social-icons'
import { DashboardFormSheet } from './DashboardFormSheet'
import {
  EmptyLine,
  FormInput,
  LoadingLine,
  PickRow,
  PlatformPick
} from './DashboardFormPrimitives'

function iconFor(platform: ConnectionPlatform): SocialIcon {
  return SOCIAL_ICONS.find((icon) => icon.id === platform) ?? SOCIAL_ICONS[0]
}

/**
 * Add a community (group) to the listening set. The step shape follows the
 * platform relation:
 *  - facebook: platform → connected account → group link → entry questions
 *    (4 steps). A facebook group is joined *through* an account, so that
 *    account is chosen first — then the group itself arrives as a pasted
 *    `facebook.com/groups/…` URL, which is exactly what the facebook client
 *    needs. Confirming the URL resolves it through
 *    `POST /communities/resolve` (loading step, like the live client) and
 *    the returned entry questions render as their own step — never inline
 *    under the input, since the real form has steps between the link and
 *    the join. Answering every question unlocks Join, and the answers ride
 *    along on `POST /communities/join-by-url`. Facebook gates entry, so a
 *    fresh request lands in `pending` until the group accepts.
 *  - x / reddit: platform → group (2 steps) — pick from the tracked roster,
 *    accepted immediately.
 * No step auto-advances on select: every step moves exclusively through the
 * sheet's Continue button (see AGENTS.md form rules).
 */
export function DashboardGroupsForm({
  open,
  onClose,
  onJoined,
  initialPlatform = null,
  initialCommunityId = null
}: {
  open: boolean
  onClose: () => void
  /** Fires after a successful join so the parent page can reconcile. */
  onJoined: () => void
  /**
   * Pre-scope the flow when opened from a specific community's Join button:
   * the platform is fixed and the group link is pre-filled. Facebook still
   * lands on the account step — the account that joins has to be chosen.
   */
  initialPlatform?: ConnectionPlatform | null
  initialCommunityId?: string | null
}) {
  const { success, error: notifyError } = useToast()
  const [platform, setPlatform] = useState<ConnectionPlatform | null>(null)
  // Selecting a platform tile only marks the card — the sheet's Continue
  // button flips this and unlocks the next step, so step one never
  // auto-advances.
  const [platformConfirmed, setPlatformConfirmed] = useState(false)
  // Same gate for the facebook account step: picking an account only marks
  // the card; Continue unlocks the group-link step.
  const [accountConfirmed, setAccountConfirmed] = useState(false)
  // Same gate for the group-link step: Continue resolves the URL and unlocks
  // the entry-questions step, which renders what the client returns.
  const [urlConfirmed, setUrlConfirmed] = useState(false)
  const [accounts, setAccounts] = useState<ConnectionRecord[]>([])
  const [communities, setCommunities] = useState<Community[] | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [communityId, setCommunityId] = useState<string | null>(null)
  const [groupUrl, setGroupUrl] = useState('')
  // The resolved group for the pasted URL (entry questions source) plus the
  // typed answers — answers reset only when the resolved group identity
  // changes, so typing the URL doesn't wipe in-progress answers for the
  // same group.
  const [resolvedGroup, setResolvedGroup] = useState<Community | null>(null)
  const [resolving, setResolving] = useState(false)
  const [groupAnswers, setGroupAnswers] = useState<string[]>([])
  const lastResolvedId = useRef<string | null>(null)
  const [busy, setBusy] = useState(false)

  // One reset per open; accounts load up front so the facebook step is ready.
  // Pre-scoped opens fetch the platform roster immediately so the group link
  // can be pre-filled from the tracked community's URL.
  useEffect(() => {
    if (!open) return
    setPlatform(initialPlatform)
    setPlatformConfirmed(initialPlatform !== null)
    setAccountConfirmed(false)
    setUrlConfirmed(false)
    setCommunities(null)
    setAccountId(null)
    setCommunityId(initialCommunityId)
    setGroupUrl('')
    setResolvedGroup(null)
    setResolving(false)
    setGroupAnswers([])
    lastResolvedId.current = null
    setBusy(false)
    getAccounts()
      .then(setAccounts)
      .catch(() => setAccounts([]))
    if (initialPlatform && initialCommunityId) {
      getCommunities({ platform: initialPlatform })
        .then((list) => {
          setCommunities(list)
          setGroupUrl(list.find((community) => community.id === initialCommunityId)?.url ?? '')
        })
        .catch(() => setCommunities([]))
    }
  }, [open, initialPlatform, initialCommunityId])

  const fbAccounts = accounts.filter((account) => account.platform === 'facebook' && account.connectedAt !== null)
  const stepCount = platform === null ? 0 : platform === 'facebook' ? 4 : 2
  const step = !platformConfirmed
    ? 1
    : platform === 'facebook'
      ? !accountConfirmed ? 2 : !urlConfirmed ? 3 : 4
      : 2
  const pickingGroup = platform !== null && platformConfirmed && (platform === 'facebook' ? step === 4 : step === 2)
  const onAccountStep = platformConfirmed && platform === 'facebook' && !accountConfirmed
  const onUrlStep = platformConfirmed && platform === 'facebook' && accountConfirmed && !urlConfirmed

  // The full roster, split into the two visible paths plus what's joinable:
  // pending requests (waiting on acceptance), accepted members, and the
  // untouched remainder. Facebook joins by URL so it never picks from the
  // roster; x / reddit pick from the `none` slice.
  const roster = communities ?? []
  const pending = roster.filter((community) => community.joinState === 'pending')
  const accepted = roster.filter((community) => community.joinState === 'accepted')
  const joinable = roster.filter((community) => community.joinState === 'none')

  const parsedUrl = platform === 'facebook' ? parseFacebookGroupUrl(groupUrl) : null
  const resolvedUrl = parsedUrl?.url ?? null

  // Resolve fires on Continue (urlConfirmed), never while typing — the
  // questions step covers the fetch with a spinner, exactly like the live
  // client will, so each step lines up with a client round-trip instead of
  // rendering under the input. Answers survive re-resolves of the same
  // group so Back/Continue never wipes in-progress answers.
  useEffect(() => {
    if (platform !== 'facebook' || !urlConfirmed || !resolvedUrl) {
      if (!urlConfirmed) {
        setResolvedGroup(null)
        setResolving(false)
      }
      return
    }
    let cancelled = false
    setResolving(true)
    void (async () => {
      try {
        // Minimum visible load alongside the request: the mocked client
        // answers instantly, the live one won't — this keeps the rhythm.
        const [community] = await Promise.all([
          resolveCommunityByUrl(resolvedUrl),
          new Promise((resolve) => setTimeout(resolve, 700)),
        ])
        if (cancelled) return
        console.log('[groups-form] resolve response:', community)
        setResolvedGroup(community)
        if (lastResolvedId.current !== community.id) {
          lastResolvedId.current = community.id
          setGroupAnswers(community.entryQuestions.map(() => ''))
        }
      } catch {
        if (!cancelled) setResolvedGroup(null)
      } finally {
        if (!cancelled) setResolving(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [platform, urlConfirmed, resolvedUrl])

  // Questions render only when they belong to the current input; Join needs
  // every one answered.
  const questionsForUrl =
    resolvedGroup !== null && resolvedGroup.url === resolvedUrl ? resolvedGroup : null
  const answersValid =
    questionsForUrl !== null &&
    groupAnswers.length === questionsForUrl.entryQuestions.length &&
    groupAnswers.every((answer) => answer.trim() !== '')

  const stepHint =
    step === 1
      ? 'Pick the platform, then press Continue.'
      : onAccountStep
        ? 'Choose the account, then press Continue.'
        : onUrlStep || (pickingGroup && platform === 'facebook')
          ? undefined
          : 'Pick the group, then press Continue.'

  function resetTo(stepTo: 1 | 2) {
    // 2 = facebook account step; 1 = platform pick.
    setCommunityId(null)
    setCommunities(null)
    setGroupUrl('')
    setPlatformConfirmed(stepTo === 2)
    setAccountConfirmed(false)
    setUrlConfirmed(false)
    setResolvedGroup(null)
    setResolving(false)
    setGroupAnswers([])
    lastResolvedId.current = null
    if (stepTo === 1) {
      setPlatform(null)
      setAccountId(null)
    } else {
      setAccountId(null)
    }
  }

  // Step one's Continue: confirm the platform pick and unlock the next
  // step. x / reddit land on the group step immediately, so fetch it here —
  // the roster drives the busy state until it resolves.
  function continueFromPlatform() {
    if (platform === null || platformConfirmed || busy) return
    setPlatformConfirmed(true)
    if (platform !== 'facebook') void loadRoster(platform)
  }

  // Account step's Continue: confirm the account pick and unlock the group
  // link step. The roster fetch moves here too — selecting an account only
  // marks the card, so the fetch that unlocks the next step must not fire
  // on select.
  function continueFromAccount() {
    if (accountId === null || accountConfirmed || busy) return
    setAccountConfirmed(true)
    if (communities === null) void loadRoster('facebook')
  }

  // URL step's Continue: confirm the link and unlock the questions step.
  // The resolve (and its loading state) fires here — never while typing,
  // so the questions arrive step-by-step like the live client returns them.
  function continueFromUrl() {
    if (parsedUrl === null || urlConfirmed || busy) return
    setUrlConfirmed(true)
  }

  // Fetching a platform's roster happens on Continue — never on select,
  // since card picks only mark. The fetch drives the busy state until it
  // resolves, so the next step shows its loading line the whole time data
  // is in flight.
  async function loadRoster(platformToLoad: ConnectionPlatform) {
    setBusy(true)
    try {
      setCommunities(await getCommunities({ platform: platformToLoad }))
    } catch (err: unknown) {
      notifyError('Could not load communities', err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  async function confirm() {
    // The confirm button only ever runs the final action: join.
    if (!pickingGroup || !platform || busy) return
    if (platform === 'facebook') {
      // The facebook path joins by URL — the input plus the entry answers
      // are the whole payload, passed straight to the client.
      if (!parsedUrl || !accountId || !answersValid) return
      const account = fbAccounts.find((fb) => fb.id === accountId)
      if (!account) return
      const answers = groupAnswers.map((answer) => answer.trim())
      console.log('[groups-form] join payload:', { url: parsedUrl.url, accountId: account.id, answers })
      setBusy(true)
      try {
        const res = await joinCommunityByUrl(parsedUrl.url, { accountId: account.id, answers })
        console.log('[groups-form] join response:', res.community)
        const joined = res.community
        if (joined.joinState === 'accepted') {
          success(`You're already in ${joined.name}`)
        } else {
          const answerNote =
            answers.length > 0
              ? ` — ${answers.length} answer${answers.length === 1 ? '' : 's'} attached`
              : ''
          success(
            `Request sent to ${joined.name}`,
            `Requested with ${account.label}${answerNote} — waiting on the group to accept.`
          )
        }
        onJoined()
        onClose()
      } catch (err: unknown) {
        notifyError('Could not send the request', err instanceof Error ? err.message : 'Something went wrong.')
      } finally {
        setBusy(false)
      }
      return
    }
    if (!communityId) return
    setBusy(true)
    try {
      const record = await joinCommunity(communityId)
      success(`Joined ${record.name}`)
      onJoined()
      onClose()
    } catch (err: unknown) {
      notifyError('Could not join', err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  function back() {
    if (pickingGroup && platform === 'facebook') {
      // Questions → link step: un-confirm, keep the URL and the answers.
      setUrlConfirmed(false)
      return
    }
    if (onUrlStep) {
      resetTo(2)
      return
    }
    resetTo(1)
  }

  // Pre-scoped opens read their title from the roster once it lands.
  const targetGroup = initialCommunityId
    ? (communities ?? []).find((community) => community.id === initialCommunityId)
    : undefined

  return (
    <DashboardFormSheet
      open={open}
      title={targetGroup ? `Join ${targetGroup.name}` : 'Add a group'}
      subtitle="ListeningKit follows communities and flags posts that match your keywords."
      step={step}
      stepCount={stepCount}
      stepHint={stepHint}
      busy={busy}
      confirmLabel={step === 1 || onAccountStep || onUrlStep ? 'Continue' : pickingGroup ? 'Join group' : undefined}
      confirmDisabled={
        step === 1
          ? platform === null
          : onAccountStep
            ? accountId === null
            : onUrlStep
              ? parsedUrl === null
              : platform === 'facebook'
                ? parsedUrl === null || resolving || !answersValid
                : communityId === null
      }
      onConfirm={
        step === 1
          ? continueFromPlatform
          : onAccountStep
            ? continueFromAccount
            : onUrlStep
              ? continueFromUrl
              : confirm
      }
      onBack={back}
      backDisabled={step === 1}
      onClose={onClose}
    >
      {step === 1 ? (
        <PlatformPick
          value={platform}
          onChange={(next) => {
            setPlatform(next)
            setAccountId(null)
            setCommunityId(null)
            setGroupUrl('')
            setCommunities(null)
          }}
        />
      ) : null}

      {step === 2 ? (
        <AccountPick
          accounts={fbAccounts}
          value={accountId}
          onSelect={setAccountId}
        />
      ) : null}

      {onUrlStep ? (
        <FacebookUrlStep
          accountLabel={accounts.find((account) => account.id === accountId)?.label ?? null}
          groupUrl={groupUrl}
          onUrlChange={setGroupUrl}
          urlValid={parsedUrl !== null}
        />
      ) : null}

      {pickingGroup && platform === 'facebook' ? (
        <FacebookQuestionsStep
          resolving={resolving}
          groupName={questionsForUrl?.name ?? null}
          questions={questionsForUrl?.entryQuestions ?? null}
          answers={groupAnswers}
          onAnswerChange={(index, value) =>
            setGroupAnswers((current) => current.map((answer, i) => (i === index ? value : answer)))
          }
        />
      ) : null}

      {pickingGroup && platform && platform !== 'facebook' ? (
        communities === null ? (
          <LoadingLine label={`Loading ${platformLabel(platform)} communities…`} />
        ) : (
          <div className="flex flex-col gap-4">
            {platform === 'reddit' ? (
              <RedditGroupPick
                communities={joinable}
                value={communityId}
                onSelect={setCommunityId}
              />
            ) : (
              <GroupPick
                platform={platform}
                communities={joinable}
                value={communityId}
                onSelect={setCommunityId}
              />
            )}
            <RelationLists pending={pending} accepted={accepted} />
          </div>
        )
      ) : null}
    </DashboardFormSheet>
  )
}

/**
 * The facebook account step, styled like the onboarding platform cards:
 * full-width tappable cards with a big logo, the account name, and a
 * tap-to-select hint — vertically stacked so the choice reads clearly in
 * the narrow sheet. Shape and stroke come from the squircle primitives.
 */
function AccountPick({
  accounts,
  value,
  onSelect
}: {
  accounts: ConnectionRecord[]
  value: string | null
  onSelect: (id: string) => void
}) {
  if (accounts.length === 0) {
    return <EmptyLine label="No connected Facebook accounts yet — connect one in Settings first." />
  }
  return (
    <div className="flex flex-col gap-3">
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          active={value === account.id}
          onClick={() => onSelect(account.id)}
          label={account.label}
          sub={account.viaProxy ? 'via proxy' : 'direct connection'}
        />
      ))}
    </div>
  )
}

function AccountCard({
  active,
  onClick,
  label,
  sub
}: {
  active: boolean
  onClick: () => void
  label: string
  sub?: string
}) {
  // Squircle clip only — no stroke overlay. The shape stays cohesive with
  // the sheet; selection reads through the tint + check badge.
  const clip = useSquircleClip<HTMLButtonElement>(16)
  return (
    <button
      ref={clip.ref}
      style={clip.style}
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-4 p-4 text-left',
        active ? 'bg-[#F4F9FF]' : 'bg-white hover:bg-black/[0.02]'
      )}
    >
      <SocialGlyph
        icon={iconFor('facebook')}
        className="relative z-10 size-12 shrink-0 text-[#2A8CFF]"
      />
      <span className="relative z-10 min-w-0 flex-1">
        <span className="block truncate text-base font-bold text-text-primary">{label}</span>
        <span className="mt-0.5 block truncate text-sm text-text-secondary">
          {active ? 'Selected — tap to change' : 'Tap to select'}
          {sub ? ` · ${sub}` : ''}
        </span>
      </span>
      <span
        className={cn(
          'relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border',
          active ? 'border-[#2A8CFF] bg-[#2A8CFF] text-white' : 'border-black/20 text-transparent'
        )}
      >
        <Check size={14} strokeWidth={3} aria-hidden="true" />
      </span>
    </button>
  )
}

/**
 * The facebook group step, built exactly like the onboarding "Connect your
 * accounts" panel: platform icon + "what we need" header, numbered steps,
 * then the input. No explanatory paragraphs — the numbered steps do the job.
 */
function FacebookUrlStep({
  accountLabel,
  groupUrl,
  onUrlChange,
  urlValid
}: {
  accountLabel: string | null
  groupUrl: string
  onUrlChange: (value: string) => void
  urlValid: boolean
}) {
  return (
    <div className="flex flex-col gap-4">
      <span className="flex items-center gap-2 text-sm font-bold text-text-primary">
        <SocialGlyph icon={iconFor('facebook')} className="size-5 text-text-primary" />
        What we need from Facebook
      </span>
      <ol className="flex flex-col gap-2">
        <GuideStep n={1}>
          Copy the group link — it looks like{' '}
          <span className="font-semibold">facebook.com/groups/dallas-homeowners</span>.
        </GuideStep>
        <GuideStep n={2}>
          You&apos;re requesting with{' '}
          <span className="font-semibold">{accountLabel ?? 'the account you picked'}</span> — chosen
          in the previous step.
        </GuideStep>
        <GuideStep n={3}>
          Paste it below — the request goes out immediately, then waits on the group to accept.
        </GuideStep>
      </ol>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-slate-700">Facebook group link</span>
        <FormInput
          type="text"
          autoFocus
          value={groupUrl}
          onChange={(event) => onUrlChange(event.target.value)}
          placeholder="facebook.com/groups/dallas-homeowners"
          autoComplete="off"
          inputMode="url"
        />
      </label>
      {groupUrl.trim() !== '' && !urlValid ? (
        <p className="text-xs text-text-secondary">
          That doesn&apos;t look like a group link — paste a facebook.com/groups/… URL.
        </p>
      ) : null}
    </div>
  )
}

/**
 * The facebook questions step: spinner while the resolve is in flight, then
 * one input per entry question exactly as the client returned them — the
 * count and text are dynamic, only the shape is stable.
 */
function FacebookQuestionsStep({
  resolving,
  groupName,
  questions,
  answers,
  onAnswerChange
}: {
  resolving: boolean
  groupName: string | null
  questions: string[] | null
  answers: string[]
  onAnswerChange: (index: number, value: string) => void
}) {
  if (questions === null || groupName === null) {
    // Still fetching → centered spinner; settled with nothing → the link
    // failed to resolve, so say so instead of spinning forever.
    if (!resolving) {
      return <EmptyLine label="Couldn't pull the group's questions — go back and check the link." />
    }
    return <Spinner label="Loading entry questions" />
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-bold text-text-primary">
          Answer {questions.length} entry question{questions.length === 1 ? '' : 's'} for {groupName}
        </p>
        {questions.map((question, index) => (
          <label key={`${groupName}-${index}`} className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{question}</span>
            <FormInput
              type="text"
              value={answers[index] ?? ''}
              onChange={(event) => onAnswerChange(index, event.target.value)}
              placeholder="Type your answer"
              autoComplete="off"
            />
          </label>
        ))}
      </div>
    </div>
  )
}

/** One numbered instruction row, mirroring the onboarding guide steps. */
function GuideStep({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-2.5 text-sm text-text-secondary">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#eaf0f6] text-[11px] font-bold text-text-primary">
        {n}
      </span>
      <span>{children}</span>
    </li>
  )
}

/**
 * The two visible join paths under the group step: requests still waiting
 * on acceptance, and groups already joined. Compact text rows — the join
 * action itself lives above (URL input or pick list).
 */
function RelationLists({ pending, accepted }: { pending: Community[]; accepted: Community[] }) {
  if (pending.length === 0 && accepted.length === 0) return null
  return (
    <div className="flex flex-col gap-1.5">
      {pending.map((community) => (
        <p key={community.id} className="flex items-center gap-2 text-xs text-text-secondary">
          <Clock size={13} strokeWidth={2.25} className="shrink-0 text-amber-600" aria-hidden="true" />
          <span className="min-w-0 truncate">
            <span className="font-semibold text-text-primary">{community.name}</span>
            {' — waiting on acceptance'}
            {community.accountLabel ? ` · ${community.accountLabel}` : ''}
          </span>
        </p>
      ))}
      {accepted.map((community) => (
        <p key={community.id} className="flex items-center gap-2 text-xs text-text-secondary">
          <Check size={13} strokeWidth={2.5} className="shrink-0 text-emerald-600" aria-hidden="true" />
          <span className="min-w-0 truncate">
            <span className="font-semibold text-text-primary">{community.name}</span>
            {' — member'}
          </span>
        </p>
      ))}
    </div>
  )
}

/**
 * The reddit group step picks from a dropdown instead of rows — same
 * selection semantics (marks only, Join acts), just the Select surface.
 */
function RedditGroupPick({
  communities,
  value,
  onSelect
}: {
  communities: Community[]
  value: string | null
  onSelect: (id: string) => void
}) {
  if (communities.length === 0) {
    return (
      <EmptyLine
        label={`You're already in every ${platformLabel('reddit')} group we track.`}
      />
    )
  }
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">Subreddit</span>
      <Select
        value={value ?? undefined}
        onChange={onSelect}
        aria-label="Subreddit to join"
        placeholder="Pick a subreddit…"
        icon={<SocialGlyph icon={iconFor('reddit')} className="size-4" />}
        options={communities.map((community) => ({
          value: community.id,
          label: `${community.name} · ${community.members}`,
          icon: <SocialBadge icon={iconFor(community.platform)} variant="blue" />
        }))}
      />
    </label>
  )
}

function GroupPick({
  platform,
  communities,
  value,
  onSelect
}: {
  platform: ConnectionPlatform
  communities: Community[]
  value: string | null
  onSelect: (id: string) => void
}) {
  if (communities.length === 0) {
    return (
      <EmptyLine
        label={`You're already in every ${platformLabel(platform)} group we track.`}
      />
    )
  }
  return (
    <div className="flex flex-col gap-2">
      {communities.map((community) => {
        const active = value === community.id
        return (
          <PickRow
            key={community.id}
            active={active}
            onClick={() => onSelect(community.id)}
            label={community.name}
            sub={`${community.handle} · ${community.members}`}
            icon={<SocialBadge icon={iconFor(community.platform)} />}
          />
        )
      })}
    </div>
  )
}