# ListeningKit Logbook

A live log of what's happening on the social channels that matter to your business — **Facebook, X (Twitter), and Reddit** — with push notifications the moment a word, keyword, or phrase you care about shows up in the channels you own, the groups you're a member of, and the communities you follow.

This is the **open-source client** for ListeningKit, a **Convex hackathon** submission. The whole stack is built directly on top of **OpenMagpie** — the open-source social-listening tool that the team works on — and on the shared Camoufox action clients below.

## The goal, in one sentence

You tell ListeningKit what to listen for; it watches your accounts, groups, and communities for you, notifies you (Bark push) on hits, and can take action where it counts — including **joining the groups you want to be in**.

## How it fits together

```mermaid
flowchart LR
  subgraph sources["Channels you own / follow"]
    FB[Facebook groups & pages]
    XT[X / Twitter]
    RD[Reddit communities]
  end

  subgraph action["Camofox action clients"]
    FBC["facebook-camofox-client"]
    TWK["twtkit"]
    RDC["reddit-camofox-client"]
  end

  FB --> FBC
  XT --> TWK
  RD --> RDC

  FBC & TWK & RDC -->|REST| HONO["Hono API<br/>(deployed on Railcode)"]
  HONO <--> CX[("Convex<br/>storage + queries")]

  KW["Keyword analysis<br/>local LLM or OpenAI-compatible endpoint"] --> CX
  FC["Firecrawl research<br/>Google dorks, area-scoped"] --> CX

  CX --> WEB["ListeningKit client<br/>(this repo)"]
  WEB --> BARK["Bark push"]
  BARK --> PH((Your phone))
```

| Piece | What it does |
|---|---|
| **Camofox action clients** | `facebook-camofox-client`, `twtkit`, `reddit-camofox-client` — hand-built REST APIs that expose the [Camoufox](https://github.com/daijro/camoufox) browser binary through its Playwright bindings with `humanize=true`. They don't just read — they **take action**: post, message, poll, and submit group-join forms. |
| **Hono API** | The single entry point the client talks to. Deployed directly on **Railcode**. |
| **Convex** | The backend — and the point of the hackathon submission. We're **dropping Postgres**: all indexed posts, keyword state, and account/connection state lives in Convex. |
| **Keyword analysis** | Unified analysis built on top of the tooling from contributor [@matthewdonsemail-lab](https://github.com/matthewdonsemail-lab), which ListeningKit is built on. Hits are scored by a **local LLM or any OpenAI-compatible endpoint**, then written to Convex. |
| **Community research (Firecrawl)** | Finds and curates communities **scoped by area** using [Firecrawl](https://firecrawl.dev) with Google search operators / dorking strategies, then curates against the stored, indexed posts across the communities and areas you're targeting. |
| **Bark** | [Bark](https://bark.app) push notifications — keyword hits and group-acceptance events land on your phone. |

## Multi-account proxying

Connect **every account you own**, each with its own cookie and an optional proxy route. Accounts are **id-keyed** (not platform-keyed), so multiple accounts per platform are first-class, and traffic can be pinned to a per-account proxy for isolation. The client's connection store, connect/test handshakes, and duplicate-flow all live in `apps/web/src/lib/connections`.

## Group discovery → join → auto-listen

Per platform you get **listings** of communities. On Facebook, listings drive the join flow end-to-end:

```mermaid
sequenceDiagram
  participant U as You
  participant W as ListeningKit client
  participant H as Hono API (Railcode)
  participant F as facebook-camofox-client
  participant B as Bark

  U->>W: pick a listed group, join
  W->>H: submit join (platform REST API)
  H->>F: send the content the group requires (join-form answers)
  F->>F: Camoufox browser submits with humanize=true
  F->>B: push "accepted into group"
  B-->>U: notification on your phone
  F->>H: account starts polling the group automatically
  H-->>W: new posts stream into the log
```

The join REST call returns the **actual content required to get into the group** (forms, questions); the respective platform client submits it through the humanized browser.

## This repo — the client architecture

The important part of the architecture lives in `apps/web/src/lib/`. Every data surface is a **Hono-shaped API** — mock-backed today, same routes and response shapes when pointed at the real Hono/Railcode backend, so the client never changes.

### [`lib/connections/`](apps/web/src/lib/connections) — accounts & proxies

| File | Responsibility |
|---|---|
| [`types.ts`](apps/web/src/lib/connections/types.ts) | `ConnectionPlatform` (`facebook \| x \| reddit`), id-keyed `ConnectionRecord { id, platform, label, viaProxy, connectedAt }`, `ConnectInput` |
| [`store.ts`](apps/web/src/lib/connections/store.ts) | `listeningkit.accounts.v2` persistence, v1→v2 migration, first-run seeding, strict record validation (stale platforms are filtered out on read) |
| [`index.ts`](apps/web/src/lib/connections/index.ts) | `connectAccount` (handshake + persist), `testConnection` (dry-run), `disconnectAccount`, and the store re-exports — all `AbortSignal`-aware with fake-latency delays that mirror the real backends |
| [`cookie.ts`](apps/web/src/lib/connections/cookie.ts) / [`proxy.ts`](apps/web/src/lib/connections/proxy.ts) | Cookie validation and proxy-URL normalization shared by test + connect |

### [`lib/feed/`](apps/web/src/lib/feed) — the log

| File | Responsibility |
|---|---|
| [`server.ts`](apps/web/src/lib/feed/server.ts) | Hono-shaped feed app: `GET /feed`, `GET /feed/:platform` — mock rows today, real backend tomorrow, same contract |
| [`mock.ts`](apps/web/src/lib/feed/mock.ts) | Seed rows for the three platforms |
| [`index.ts`](apps/web/src/lib/feed/index.ts) | Client that requests through the Hono app |

Rendered in `DashboardFeed` as per-platform columns with real platform card layouts (post-text, post-image, comment).

### [`lib/messaging/`](apps/web/src/lib/messaging) — in-app messaging

Mirror of the feed pattern: a Hono app per platform ([`facebook/server.ts`](apps/web/src/lib/messaging/facebook/server.ts), [`twitter/server.ts`](apps/web/src/lib/messaging/twitter/server.ts), [`reddit/server.ts`](apps/web/src/lib/messaging/reddit/server.ts)) mounted at `/facebook`, `/twitter`, `/reddit` by [`index.ts`](apps/web/src/lib/messaging/index.ts), which aggregates `getThreads()` across all three. Shared shapes in [`types.ts`](apps/web/src/lib/messaging/types.ts) (`Thread`, `ChatMessage`, `Participant`).

### [`lib/notifications/bark.ts`](apps/web/src/lib/notifications/bark.ts) — push

Bark client: configurable server (defaults to `https://api.day.app`), device-key validation, a GET-form **test URL** (open it directly — no CORS), and `sendBarkPush` (POST JSON; Bark returns HTTP 200 even on failure, so the response `code` is what decides). Config persists to `listeningkit.bark.v1`.

### [`lib/communities.ts`](apps/web/src/lib/communities.ts) & [`lib/social-icons.tsx`](apps/web/src/lib/social-icons.tsx)

Community directory model (the listings the Groups screen joins/leaves, persisted to `listeningkit.joined.v1`), and the shared social identity: `simple-icons` paths for the three platforms plus the two-layer squircle `SocialBadge` used across header and tables.

### Shell & design system

The app shell, sidebar, and pages live in [`apps/web/src/components/`](apps/web/src/components) — see **[DASHBOARD_DESIGN.md](DASHBOARD_DESIGN.md)** for the full design record (squircle system, continuous collapse, status vocabulary, hard rules). Shared primitives come from [`packages/ui`](packages/ui) (`select`, `table`, `badge`, `button`, `squircle`, `toast`).

## Quickstart

```bash
pnpm install
pnpm dev        # runs apps/web on http://localhost:3000, proxies /api -> http://localhost:4000
```

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | dev server for `apps/web` |
| `pnpm build` | `pnpm -r build` across workspaces |
| `pnpm typecheck` | `pnpm -r typecheck` across workspaces |
| `pnpm lint` | `pnpm -r lint` across workspaces |

## Layout

```
listeningkit-hackathon/
  apps/
    web/              # Vite React client (port 3000)
  packages/
    ui/               # @listeningkit/ui shared package
  pnpm-workspace.yaml
```

Add a new app: copy `apps/web` to `apps/<name>`, rename `name` in its `package.json`, and `pnpm install`.

## Contributing

Contributors to this hackathon submission: [@matthewdonsemail-lab](https://github.com/matthewdonsemail-lab) · [@PACER1](https://github.com/PACER1) · [@deepmroot](https://github.com/deepmroot) · [@john11099](https://github.com/john11099)