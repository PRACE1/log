import { assign, setup } from 'xstate'
import { GROUP_SETS, RETRY_SEARCH_SETS } from './flow'

/**
 * Brand-reveal flow machine.
 *
 * Forward-only interrogation: competitors → keywords (relate + confirm) →
 * groups (familiar + interested). A No appends a retry round and re-asks
 * INLINE at the same stage — the machine never transitions backwards, so
 * when Yes finally lands the downstream subtree renders AFTER the
 * successful round instead of jumping back up to the first question.
 *
 * Acceptance is recorded as WHERE Yes happened:
 * - competitorAcceptedAt: null = pending, -1 = initial ask, >=0 = index
 *   into competitorRetries (the retry round whose re-ask got Yes).
 * - keywordAcceptedAt: same shape against keywordRetries.
 * - groupAcceptedAt: same shape against groupRetries (initial set is
 *   GROUP_SETS[0]; retry i uses its stored setIndex).
 */

export interface RevealRetryRound {
  setIndex: number
  /** The card picked inside this round (keywords only; null until picked). */
  pick: string | null
}

export interface RevealContext {
  competitorRetries: RevealRetryRound[]
  /** null = still asking, -1 = initial ask accepted, >=0 = retry index accepted */
  competitorAcceptedAt: number | null
  /** Frozen pick from the initial relate step — history never clears it. */
  keywordInitialPick: string | null
  /** Active phrase for downstream saves — latest pick (initial or retry). */
  keywordRelated: string | null
  keywordRetries: RevealRetryRound[]
  /** null = still asking, -1 = initial confirm accepted, >=0 = retry index accepted */
  keywordAcceptedAt: number | null
  groupRetries: RevealRetryRound[]
  /** null = still asking, -1 = initial ask accepted, >=0 = retry index accepted */
  groupAcceptedAt: number | null
  groupsFamiliar: boolean | null
  interested: string[]
}

export type RevealEvent =
  | { type: 'COMPETITORS_YES'; at: number }
  | { type: 'COMPETITORS_NO'; at: number }
  | { type: 'KEYWORD_SELECT'; phrase: string }
  | { type: 'KEYWORD_RETRY_SELECT'; phrase: string; at: number }
  | { type: 'KEYWORDS_YES'; at: number }
  | { type: 'KEYWORDS_NO'; at: number }
  | { type: 'GROUPS_YES'; at: number }
  | { type: 'GROUPS_NO'; at: number }
  | { type: 'GROUPS_TOGGLE'; id: string }

function nextSetIndex(count: number, origin: 'competitors' | 'keywords'): number {
  const sets = RETRY_SEARCH_SETS[origin]
  return count % sets.length
}

export const revealMachine = setup({
  types: {
    context: {} as RevealContext,
    events: {} as RevealEvent,
  },
}).createMachine({
  id: 'brandReveal',
  initial: 'competitors',
  context: {
    competitorRetries: [],
    competitorAcceptedAt: null,
    keywordInitialPick: null,
    keywordRelated: null,
    keywordRetries: [],
    keywordAcceptedAt: null,
    groupRetries: [],
    groupAcceptedAt: null,
    groupsFamiliar: null,
    interested: [],
  },
  states: {
    competitors: {
      on: {
        COMPETITORS_NO: {
          // Ignore No while the latest round is still streaming — the UI
          // guards this too; the machine stays put with no context change.
          // Here we always append; UI must only send once streaming done.
          actions: assign({
            competitorRetries: ({ context }) => [
              ...context.competitorRetries,
              { setIndex: nextSetIndex(context.competitorRetries.length, 'competitors'), pick: null },
            ],
          }),
        },
        COMPETITORS_YES: {
          target: 'keywordsRelate',
          actions: assign({
            competitorAcceptedAt: ({ event }) => event.at,
          }),
        },
      },
    },
    keywordsRelate: {
      on: {
        KEYWORD_SELECT: {
          target: 'keywordsConfirm',
          actions: assign({
            keywordInitialPick: ({ event }) => event.phrase,
            keywordRelated: ({ event }) => event.phrase,
          }),
        },
      },
    },
    keywordsConfirm: {
      on: {
        KEYWORDS_NO: {
          target: 'keywordsRetry',
          actions: assign({
            keywordRetries: ({ context }) => [
              ...context.keywordRetries,
              { setIndex: nextSetIndex(context.keywordRetries.length, 'keywords'), pick: null },
            ],
            // Clear the active phrase so the retry round forces a fresh
            // card pick; the initial pick stays frozen as history.
            keywordRelated: () => null,
          }),
        },
        KEYWORDS_YES: {
          target: 'groupsFamiliar',
          actions: assign({
            keywordAcceptedAt: () => -1,
          }),
        },
      },
    },
    keywordsRetry: {
      on: {
        KEYWORD_RETRY_SELECT: {
          actions: assign({
            keywordRetries: ({ context, event }) =>
              context.keywordRetries.map((round, index) =>
                index === event.at ? { ...round, pick: event.phrase } : round,
              ),
            keywordRelated: ({ event }) => event.phrase,
          }),
        },
        KEYWORDS_NO: {
          // Self-loop with fresh round each No — history persists, only the
          // latest round animates (UI renders earlier rounds as complete).
          actions: assign({
            keywordRetries: ({ context }) => [
              ...context.keywordRetries,
              { setIndex: nextSetIndex(context.keywordRetries.length, 'keywords'), pick: null },
            ],
            keywordRelated: () => null,
          }),
        },
        KEYWORDS_YES: {
          target: 'groupsFamiliar',
          actions: assign({
            keywordAcceptedAt: ({ event }) => event.at,
          }),
        },
      },
    },
    groupsFamiliar: {
      on: {
        GROUPS_NO: {
          // New community set as a fresh retry round — history persists and
          // only the latest round animates, same as competitors/keywords.
          // Initial set is index 0, so the first retry starts at 1.
          actions: assign({
            groupRetries: ({ context }) => [
              ...context.groupRetries,
              {
                setIndex: (context.groupRetries.length + 1) % GROUP_SETS.length,
                pick: null,
              },
            ],
            groupsFamiliar: () => null,
          }),
        },
        GROUPS_YES: {
          target: 'groupsInterested',
          actions: assign({
            groupAcceptedAt: ({ event }) => event.at,
            groupsFamiliar: () => true,
          }),
        },
      },
    },
    groupsInterested: {
      on: {
        GROUPS_TOGGLE: {
          actions: assign({
            interested: ({ context, event }) =>
              context.interested.includes(event.id)
                ? context.interested.filter((row) => row !== event.id)
                : [...context.interested, event.id],
          }),
        },
      },
    },
  },
})
