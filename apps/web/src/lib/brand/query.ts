import type { FirehoseEvent } from '../analytics'
import type { AiFollowUpAction, AiQuery, BrandProfile } from './types'

/**
 * Build the query a follow-up action runs: the captured event plus the
 * brand snapshot the mock AI drafts against. The sheet snapshots the brand
 * when the action opens so later onboarding edits can't shift a draft
 * mid-read.
 */
export function buildAiQuery(
  action: AiFollowUpAction,
  event: FirehoseEvent,
  brand: BrandProfile | null,
  trackedPhrases: string[]
): AiQuery {
  return {
    action,
    eventId: event.id,
    keywordId: event.keywordId,
    platform: event.platform,
    author: event.author,
    group: event.group,
    type: event.type,
    sentiment: event.sentiment,
    text: event.text,
    url: event.url,
    trackedPhrases,
    brand,
  }
}

const STOPWORDS = new Set(
  'a,an,and,are,as,at,be,but,by,can,could,did,do,does,for,from,had,has,have,here,how,if,in,into,is,it,its,just,like,look,looking,me,my,need,not,now,of,off,on,one,or,our,out,over,said,so,some,supposed,take,than,that,the,their,there,they,this,three,through,to,too,very,was,we,were,what,when,where,which,who,will,with,you,your,anyone,dealt,lately,pointers,week,alone,weekend,list,adding,quick,call,someone,cost,supposed,whole,still,waiting,third,month,quoted,double,neighbour,paid,again,shoutout,crew,sorted,visit,done,dusted,half,feared,spotless,work,anybody,dealt'.split(
    ','
  )
)

function tokensOf(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .map((word) => word.replace(/^'+|'+$/g, ''))
    .filter((word) => word.length >= 4 && !STOPWORDS.has(word))
}

/**
 * Candidate keyword phrases from the event text: surviving single tokens
 * plus adjacent bigrams, minus anything already tracked. Deterministic —
 * the same post always suggests the same phrases in the same order.
 */
export function suggestKeywords(event: FirehoseEvent, trackedPhrases: string[], limit = 5): string[] {
  const tracked = new Set(trackedPhrases.map((phrase) => phrase.toLowerCase().trim()))
  const tokens = tokensOf(event.text).filter((token) => ![...tracked].some((phrase) => phrase.includes(token)))
  const seen = new Set<string>()
  const out: string[] = []
  const push = (phrase: string) => {
    const clean = phrase.trim()
    if (!clean || tracked.has(clean) || seen.has(clean)) return
    seen.add(clean)
    if (out.length < limit) out.push(clean)
  }
  for (let i = 0; i < tokens.length && out.length < limit; i++) {
    if (i + 1 < tokens.length) push(`${tokens[i]} ${tokens[i + 1]}`)
    push(tokens[i])
  }
  return out
}

/**
 * Mock reply draft: the event's own words answered in the brand's voice.
 * Without a brand (onboarding skipped) it falls back to generic phrasing —
 * never invents a business name.
 */
export function draftReply(query: AiQuery): string {
  const brandName = query.brand?.identity.name
  const offering = query.brand?.offerings.items[0]
  const area = query.brand?.voice.serviceAreas[0]
  const signoff = brandName ? ` — ${brandName}` : ' — the team'
  const serviceBit = offering ? ` We do ${offering.toLowerCase()}${area ? ` across ${area}` : ''}.` : ''
  switch (query.type) {
    case 'question':
      return `Hi ${query.author} — great question.${serviceBit} Send us a DM with the details and we'll sort a time that suits.${signoff}`
    case 'complaint':
      return `Hi ${query.author} — really sorry about this, that's not how it should go.${serviceBit} DM us your details and we'll make it right.${signoff}`
    case 'praise':
      return `Thank you ${query.author}! Reviews like this keep the crew going.${serviceBit ? ` If you ever need ${offering?.toLowerCase()} again, you know where to find us.` : ''}${signoff}`
    default:
      return `Hi ${query.author} — thanks for posting this.${serviceBit} Give us a shout if we can help.${signoff}`
  }
}
