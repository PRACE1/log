# Dashboard Design

Design + implementation notes for the ListeningKit dashboard app shell (`apps/web`), written as a record of the work done and the rules it follows.

## Scope

- `apps/web/src/components/Dashboard*.tsx` — shell, sidebar, header, and the five dashboard routes (Overview, Groups, Accounts, Messages, Settings)
- `apps/web/src/lib/connections/` — id-keyed account store powering Settings ↔ Accounts
- `apps/web/src/lib/social-icons.tsx` — shared social identity (icons + squircle badges)
- `packages/ui` — shared primitives the dashboard is built from (`squircle`, `select`, `table`, `badge`, `button`, `toast`)

## App shell (`DashboardLayout.tsx`)

- Full-viewport brand-blue (`#2A8CFF`) backdrop, `p-4 sm:p-6`.
- Centered content cap: `max-w-[1600px]`.
- The panel is a single squircle (radius **28**) in `#FBFCFE`, clipped via `useSquircleClip` and outlined with a `useSquircleBorder` SVG stroke of `#FBFCFE` (10px) so the blue backdrop reads as a continuous gutter around the rounded shape.
- Inner flex row: `DashboardSidebar` (left) | header + scrollable `<main><Outlet/></main>` (right).
- **Collapse toggle**: a small squircle button (r14, white, 1px border, panel-seam position at the content column's left edge, vertically centered) with `PanelLeftClose` / `PanelLeftOpen` glyphs. It owns the single `sidebarCollapsed` state that drives the whole sidebar.

## Squircle design system (`packages/ui/src/squircle.tsx`)

Everything rounded in the dashboard is a **squircle** (continuous corner curve, `figma-squircle`), not a plain `border-radius`:

| Surface | Radius | Notes |
|---|---|---|
| App panel | 28 | `useSquircleClip` + matching border stroke |
| Sidebar card | 20 | rounded corners on the **right** only (`topRight`, `bottomRight`) — left edge flush to the viewport |
| Connection row card (Settings) | 20 | white card per account |
| User card (sidebar footer) | 16 | `#FBFCFE` fill |
| Select floating surface | 16 | clip + border-svg two-layer pattern |
| Table header band | 14 | full-width squircle band, `bg-[#EFF6FF]` |
| Table rows | 12 | alternating bands on even rows, `bg-[#F4F9FF]` |
| Nav icon box | 12 (`rounded-xl`) | 28px box, glyph 16px |
| Sidebar active tab | 7 | left edge squared (`topLeft: 0, bottomLeft: 0`), right corners rounded |
| Collapse toggle button | 14 | near-circular squircle |
| Social avatar badge | 12 | two-layer (see below) |

Two-layer pattern (clip + stroke): a `clipPath` erases outer box-shadows, so any squircle that needs a border composes `useSquircleClip` on the element with a `useSquircleBorder` SVG path (radius +1, 1–2px stroke) rendered as an absolute child. Used by the select surface and `SocialBadge`.

## Sidebar (`DashboardSidebar.tsx` + `DashboardSidebarUser.tsx`)

Structure: white squircle card, `w-64 p-6` expanded ↔ `w-20 px-3 py-6` collapsed.

1. **Wordmark** — logo (`/logo.svg`, 44px, r12) + "ListeningKit / Live social listening" block.
2. **Nav** — two columns:
   - **Indicator column** (left): flush to the nav edge, no left padding, `w-1.5`. Holds the active tab — a full-row-height (`h-full`) blue (`#2A8CFF`) squircle with squared left edge, sliding between rows via `translateY(activeIndex * 52px)` (48px row + 4px gap). Fades + shrinks to `w-0` in icon-rail mode because the pill background already shows state.
   - **Rows**: `h-12 w-full rounded-2xl`, icon box + label. Active row = `bg-brand-600/10` pill + solid blue icon box (white glyph); inactive = transparent, hover `bg-black/[0.04]`.
3. **User card** — avatar initials chip + name/plan, anchored to the footer.

### Collapse animation (the rule)

Collapse is **one continuous width animation** — nothing re-centers or snaps:

- `aside` transitions `[width, padding]` only; the collapsed class swaps padding values, never layout direction.
- Every text block (nav labels, wordmark, user name/plan) **stays mounted** and collapses `w-auto → w-0` with `opacity` on `transition-[width,opacity]` (300ms), instead of unmounting or truncating into a sliver. `aria-hidden` follows so screen readers skip the invisible text.
- Gaps that separate icon from text animate via `transition-[gap]` (`gap-3 → gap-0`), so icons glide to their rail position while text fades — no instant reflow frame.
- Interaction: clicking the **active** row toggles collapse; clicking while collapsed expands (and routes); the layout toggle button mirrors the same state.

## Shared primitives used by the dashboard

- **`Select`** (`packages/ui/src/select.tsx`) — floating listbox via `@floating-ui/react` + `motion`. RADIUS 16 squircle surface; `visibility: hidden` until first position resolves (no 0,0 flash); `matchWidth` middleware; icon-per-option support (platform glyphs, `Plus` for action selects); `value=""` + `placeholder` + `icon` = action-select pattern used by the Accounts "Add account" control.
- **`Table`** (`packages/ui/src/table.tsx`) — headless structure, squircle bands: header band (r14, `#EFF6FF` — deliberately the **same blue as the `gray` Button variant**), alternating even row bands (r12, `#F4F9FF`), no dividers, `py-4` cells.
- **`Badge`** (`packages/ui/src/badge.tsx`) — single source of status styling: `muted` (slate pill), `success` (+ `dot`), `warning`, `danger`, `info`, `brand`. **All** dashboard status pills must use it — no hand-rolled `rounded-full` pills.
- **`Button`** — variants in play: `blue` (primary actions), `gray` (secondary, e.g. table Connect), `ghost` (row Disconnect), `destructive` (Delete).
- **`useToast`** — error messaging rule: dashboard components **never render inline error text**; failures always go through toasts.

## Connections: data model + screens

### Model (`apps/web/src/lib/connections/`)

- `ConnectionPlatform = 'facebook' | 'x' | 'reddit'` (Upwork was removed product-wide in this pass).
- `ConnectionRecord = { id, platform, label, viaProxy, connectedAt: string | null }` — **id-keyed** (UUID), not platform-keyed. Multiple accounts per platform are first-class.
- Store (`store.ts`): persisted to `localStorage['listeningkit.accounts.v2']` as a record list.
  - Auto-migrates legacy platform-keyed `listeningkit.connections.v1`.
  - First-run seed: facebook/x/reddit, not connected. An explicit `[]` is respected (no re-seed after delete-all).
  - `isValidRecord` filters stale/unknown platforms (this is how Upwork rows disappear from existing storage).
- Lib (`index.ts`): `addAccount`, `loadAccounts`, `findAccount`, `saveAccount`, `removeAccount`, `disconnectAccount` (keeps the row, clears `connectedAt` + `viaProxy`), `connectAccount` / `testConnection` (dry-run vs handshake, share cookie+proxy validation, fake latency, `AbortSignal`-aware).

### Settings → "Where we listen" (`DashboardSettingsConnections.tsx`)

- Renders the **whole persisted account list** (store-driven, never a fixed platform set).
- Each row: squircle card (r20), platform glyph, label, and a `Badge` status — `muted` "Not connected" / `warning` (pulsing) "Connecting…" / `success` (dot) "Connected"; errors are toast-only, with a Retry affordance.
- Expanded row: cookie (password input) + optional proxy inputs, then contextual buttons — Connect / Test Connection (not connected), Test Connection / Delete (connected).
- **"Add another account"** duplicates the clicked row **directly below it** (same platform, cookie/proxy copied), opens it, assigns a fresh id — no second "add" ritual needed.
- Connect is **effect-driven**: button sets `phase='connecting'`, an effect dials the lib, cleanup cancels; success reconciles with the store.

### Accounts (`DashboardAccounts.tsx`)

- Same persisted list — Settings and Accounts can never disagree.
- Header: title + **filter select** (All platforms, or each platform, with platform glyphs) + **"Add account" action-select** (adds a not-yet-connected row, toasts, jumps to Settings to finish the connect).
- Table (squircle banded): Platform (squircle `SocialBadge` + label) | Status (`success` dot / `muted`) | Connected (date, `—` if none) | Proxy (`Via proxy` / `Direct`) | Actions (ghost **Disconnect** when connected, `gray` **Connect** → Settings when not).
- A `useEffect` on `location` re-reads the store so changes made in Settings appear when navigating back.
- Footer hint when some accounts are not yet connected (with a Settings link), plus empty states for "no accounts" vs "filtered out".

### Keywords table account badge (`DashboardKeywords.tsx`)

- The table view carries an **Account** column: a `neutral` `Badge` with the
  scoped group's `accountLabel` (the account the group was joined as, so the
  account the keyword's signals arrive through); `—` when scopeless.
- Hovering the badge opens the same dark tooltip bubble as the analytics
  `Info` tooltips, sized up for the row context (`w-64 p-3`): bold account
  name + which group it serves and what it means. A native `title` attr
  backs it; the bubble is `pointer-events-none` so row-click navigation
  never breaks.
- Placement constraint: the bubble opens to the **right** of the badge
  (`left-full`, vertically centered), never below — table rows carry a
  squircle `clipPath` and the table scrolls horizontally, so anything
  overflowing the row box top/bottom would be clipped.

## Social identity (`social-icons.tsx`)

## Analytics charts (`DashboardAnalytics.tsx`)

Per-keyword graphs (`/dashboard/analytics/:keywordId`, row one) plus the
firehose console (row two). The graphs follow a single-hue brand-blue board
— one hero hue, darkest = most important — so the whole row reads as one family.

### Color board (custom, locked — do not mix in other hues)

Derived from the brand blue `#2A8CFF`:

| Token | Value | Role |
|---|---|---|
| `HERO` | `#2A8CFF` | Brand blue — trend line + dots, top-ranked row, positive slice |
| `DEEP` | `#0B3B8F` | Darkest — most important (rank-1 row, active dot) |
| `MID` | `#6FA8F5` | Mid rank |
| `SOFT` | `#9DC2F7` | Neutral slice |
| `PALE` | `#D3E5FA` | Palest — lowest rank / negative slice |
| `GRID` | `#E4E7EC` | Hairline grid + tooltip border |
| `TICK` | `#64748B` | Axis ticks, bar count labels |
| Value ink | `#0B0B0C` | **All** metric values — Satoshi Black (see below), never blue |

- `ROW_RAMP = [DEEP, HERO, MID, PALE]` — signal-mix rows ranked darkest-first.
- `SENTIMENT_COLORS = [HERO, SOFT, PALE]` — sentiment stays in-hue; the
  positive/neutral/negative meaning is carried by labels, never color alone.
- Chart fills are `HERO` at 0.32 → 0.02 opacity; stroke width ~2.75 (ink boost)
  so thin lines survive on white.

### Value typography — Satoshi Black, always

Every metric value (`222 mentions`, `120 signals`, `% positive`, donut center,
legend numbers, bar `LabelList` counts) renders in **Satoshi 900** at
`#0B0B0C`:

```tsx
style={{ fontFamily: "'Satoshi', Inter, system-ui, sans-serif", fontWeight: 900, color: '#0B0B0C' }}
```

Blue is reserved for the geometry and the header badge — values are never blue.

### Card anatomy (top to bottom)

1. **Header** — a `Badge` (`variant="brand"`, per rule 4) with the conclusion
   title (`Mentions peaked at 24 on Sep 8`, `Questions carry the stream`,
   `38% of mentions read positive`). No hand-rolled pills.
2. **Metric** — Satoshi Black value + an `Info` (lucide) icon carrying the
   how-to-read note in a hover tooltip (`title` attr + custom `group-hover`
   bubble). The old sub-captions (`one dot = one day…`) and source captions
   (`Hairline line · F2 · …`) were removed — the note lives only in the tooltip.
3. **Chart** — `h-56` recharts surface (see grammar below).
4. Cards are r20 squircles (`useSquircleClip`), `bg-white p-5`.

### Tooltip minis

Each info tooltip pairs its note with a minified inline-SVG visual on the
left (frosted `bg-white/10` chip inside the dark bubble), illustrating what
the card shows:

- `MiniTrend` — 64×30 area + dot line (mentions).
- `MiniRows` — 4 ranked rounded bars, darkest first (signal mix).
- `MiniDonut` — 3-tick blue donut (sentiment).

`ChartCard` takes `info: string` + optional `infoVisual: ReactNode`; the
bubble is `w-56 flex` so the mini sits left, text right. Screen readers get
the note via `sr-only` (the visual is `aria-hidden`).

### Chart grammar

- **Mentions trend** — hairline area + per-day dots (`r=2.5`, `activeDot` in
  `DEEP` with white ring). Tooltip: `Sep 12 · phrase — N mentions`. Header
  names the peak; the metric carries the 14-day total + average lives in the
  tooltip note.
- **Signal mix** — horizontal bars by event kind
  (mention/question/complaint/praise, ranked), value labels at bar ends in
  Satoshi Black. This replaced the old "by platform" card, which could only
  ever render **one** bar for a platform-scoped keyword.
- **Sentiment donut** — `innerRadius 66% / outerRadius 88%`, `paddingAngle 3`,
  `cornerRadius 4`, white 2px separators; center overlay repeats the positive
  % in Satoshi Black; legend dots + names + Satoshi Black %s below.

### Libraries in play

- **`recharts`** (`apps/web/package.json`) — `AreaChart`/`Area`, `BarChart`/`Bar`
  + `LabelList`/`Cell`, `PieChart`/`Pie`, `CartesianGrid`, `XAxis`/`YAxis`,
  `Tooltip`, `ResponsiveContainer`. No ECharts dependency.
- **`lucide-react`** — `Info` icon for the how-to-read tooltips.
- **`@listeningkit/ui`** — `Badge` (card headers), `useSquircleClip` (card shape).

## Hard rules (user-enforced, do not regress)

1. **No hover color transitions** — hover states snap instantly (no `transition-colors` on hover targets).
2. **Toasts for errors, always** — no inline error text in dashboard components.
3. **Squircle everywhere** — new rounded surfaces must use the squircle hooks, with radii consistent with the table above; borders go through the two-layer pattern.
4. **One status vocabulary** — all status pills through `Badge`; table header blue = gray-Button blue (`#EFF6FF`).
5. **One source of truth** — Settings and Accounts render from the same id-keyed store.
6. **Continuous collapse** — sidebar state changes animate as one width/gap/opacity transition; no mount/unmount or re-centering frames.

## File map

| File | Role |
|---|---|
| `apps/web/src/components/DashboardLayout.tsx` | Shell: backdrop, panel squircle, seam toggle |
| `apps/web/src/components/DashboardSidebar.tsx` | Wordmark, indicator column, nav rows (continuous collapse) |
| `apps/web/src/components/DashboardSidebarUser.tsx` | Footer user card (collapses with the rail) |
| `apps/web/src/components/DashboardHeader.tsx` | Top bar + overlapping `SocialBadge` cluster |
| `apps/web/src/components/DashboardSettingsConnections.tsx` | Store-driven connect/duplicate/delete flow |
| `apps/web/src/components/DashboardAccounts.tsx` | Store-driven table, filter, add-account |
| `apps/web/src/components/DashboardKeywords.tsx` | Keywords cards/table, account badge + tooltip, keyword form slot |
| `apps/web/src/components/DashboardAnalytics.tsx` | Per-keyword graphs: brand-blue board, Satoshi Black values, Badge headers, tooltip minis |
| `apps/web/src/components/DashboardAnalyticsConsole.tsx` | Firehose console: type filter tabs, capped event list |
| `apps/web/src/components/DashboardAnalyticsOverview.tsx` | Analytics landing: platform filter + full firehose |
| `apps/web/src/components/DashboardAnalyticsPage.tsx` | Per-keyword route: header meta + graphs + console |
| `apps/web/src/lib/analytics/{types,mock,index}.ts` | Analytics model + deterministic mock aggregates |
| `apps/web/src/lib/connections/{types,store,index,cookie,proxy}.ts` | Account model, persistence, connect/test lib |
| `apps/web/src/lib/social-icons.tsx` | Icons, `SocialGlyph`, `SocialBadge` |
| `packages/ui/src/squircle.tsx` | Squircle path/clip/border hooks |
| `packages/ui/src/select.tsx` | Floating squircle select |
| `packages/ui/src/table.tsx` | Banded squircle table primitives |
| `packages/ui/src/badge.tsx` | Status badge variants |
| `packages/ui/src/button.tsx` | Button variants |

## Verification

- `pnpm run typecheck` in `apps/web` and `packages/ui` — the bar for every change.