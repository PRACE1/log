# Hackathon log

- **Project:** ListeningKit Logbook
- **Event:** Convex All Gas Hackathon
- **What it does:** Social-listening dashboard that watches Facebook, X, and Reddit for keywords you care about and pushes a notification on hits.
- **Live app:** not deployed
- **Repo:** https://github.com/matthewdonsemail-lab/log
- **Frontend:** Convex static hosting
- **Convex deployment:** not deployed
- **Components:** none
- **Convex features:** none yet
- **Auth:** none
- **AI models:** none
- **Started:** 2026-09-12T21:03:28Z
- **Last updated:** 2026-09-14T07:37:57Z

## Log

### 2026-09-13 - 1ca849b
Initial commit of the ListeningKit Logbook open-source client. README lays out
the architecture: Camoufox action clients feed a Hono API, Convex holds storage
and queries, Bark push notifies the phone (`README.md`).

### 2026-09-13 - 00a897d
Listings dashboard work in progress plus dashboard cleanup: red button variant
with hard shadow, delete wiring (`apps/web/src/components/DashboardListings.tsx`,
`packages/ui/src/`).

### 2026-09-13 - d1192e8
Dashboard groups/keywords/listings forms with Continue gates, URL join flow,
and the overlay rail (`apps/web/src/components/DashboardGroupsForm.tsx`,
`DashboardKeywordsForm.tsx`, `DashboardListingsForm.tsx`).

### 2026-09-14 - c3a797d
Analytics and account console, dashboard polish, and Railcode deploy
scaffolding (`apps/web/src/components/DashboardAnalytics*.tsx`,
`DashboardAccount*.tsx`, `manifest.yaml`, `railcode.json`).

### 2026-09-13 - working tree
Analytics charts render statically so opening the inspect sheet no longer
replays the numbers; console rows deep-link with `?eventId=` and auto-open the
post inspect sheet; scrim dismiss resets the selection
(`apps/web/src/components/DashboardAnalytics.tsx`,
`DashboardAnalyticsConsole.tsx`, `DashboardAnalyticsPage.tsx`,
`DashboardLayout.tsx`).

### 2026-09-14 - feat/listings-create-form
Brand reveal runs on a forward-only XState machine (competitors to keywords
to groups): a No appends an inline retry round, a Yes continues from the
accepted round instead of rewinding. Keyword retries show selectable keyword
cards per round with per-round picks; the groups familiar loop keeps retry
history and the interested step uses the accepted set
(`apps/web/src/lib/reveal/machine.ts`, `apps/web/src/lib/reveal/flow.ts`,
`apps/web/src/components/onboarding/BrandRevealStep.tsx`).
Continue scrolls the reveal up and fades it out before the fill step mounts;
the fill shows torph copy first (logo at 88%) and the white rises as liquid
instead of flashing or smoking
(`apps/web/src/pages/onboarding/OnboardingSteps.tsx`,
`apps/web/src/components/ReadyFill.tsx`). Dev-only skip bar jumps between
onboarding steps. Deps: xstate, @xstate/react (`apps/web/package.json`).
