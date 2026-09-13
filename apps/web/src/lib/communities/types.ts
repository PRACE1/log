import type { ConnectionPlatform } from '../connections'

/**
 * Where a join request stands. `pending` = request sent, waiting on the
 * group to accept; `accepted` = the user is a member.
 */
export type CommunityJoinState = 'none' | 'pending' | 'accepted'

export interface Community {
  id: string
  platform: ConnectionPlatform
  name: string
  handle: string
  /** Display-only size, e.g. "48k members". */
  members: string
  description: string
  /**
   * Canonical link for the community. Facebook rows carry their group URL —
   * the group step on the facebook path joins by this URL (the form takes a
   * pasted link, passes it through the API, and the mock registers it from
   * the slug when it isn't tracked yet).
   */
  url: string | null
  /**
   * Hardcoded entry questions the group asks before accepting (facebook
   * groups gate entry). The form resolves the pasted URL into these and
   * sends the typed answers along with the join request.
   */
  entryQuestions: string[]
  /** Answers sent with the join request (pending/accepted rows). */
  answers: string[]
  /** Where the join request for this community stands. */
  joinState: CommunityJoinState
  /**
   * The account the request was sent / joined with. Facebook groups are
   * joined through a connected account, so this is set for pending and
   * accepted facebook communities; null otherwise.
   */
  accountId: string | null
  /** Label of the joining account, resolved from the connections domain. */
  accountLabel: string | null
}

export interface CommunitiesResponse {
  communities: Community[]
}

export interface CommunityResponse {
  community: Community
  communities: Community[]
}