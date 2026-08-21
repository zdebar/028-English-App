# Frontend Architecture

The frontend is a React + TypeScript + Vite app. It is local-first for user
progress: UI reads and writes IndexedDB through model classes, then synchronization
pushes/pulls Supabase changes.

## App Boot Sequence

`frontend/src/main.tsx` starts the auth lifecycle before creating route loads. The
root layout in `frontend/src/App.tsx` owns the remaining app-wide initialization:

| Step | Owner | Effect |
| --- | --- | --- |
| Auth initialization | `startAuthLifecycle` | Loads Supabase session before protected loaders, listens for auth changes, sets monitoring user. |
| Audio settings load | `useAudioLoader` | Initializes per-user volume from localStorage. |
| User stats sync | `useUserStoreSync` | Maintains active-user Dexie subscriptions and handles local-date rollover. |
| Theme load | `useThemeLoader` | Loads per-user or guest theme and applies DOM classes/meta color. |
| Periodic data sync | `usePeriodicSync` | Starts delayed sync, periodic sync, and unmount sync. |
| Global UI shells | `ToastContainer`, `OverlayMask`, `Header` | Renders global notifications, overlay mask, and navigation. |

## Routes

Route paths are configured in `frontend/src/config/routes.config.ts` and wired as
a hash-based React Router data router in `frontend/src/router.tsx`. `App` is the
root layout and renders route content through `Outlet`.

| Route | Page | Access |
| --- | --- | --- |
| `/` | `Home` | Public |
| `/privacy-policy` | `PrivacyPolicy` | Public |
| `/guide` | `Guide` | Public |
| `/practice` | `Practice` | Protected |
| `/practice/block-training?blockId=…` | `BlockTrainingPractice` | Protected |
| `/practice/pronunciation` | `PronunciationPractice` | Protected |
| `/practice-overview` | `PracticeOverview` | Protected |
| `/profile` | `Profile` | Protected |
| `/levels` | `Levels` | Protected |
| `/topics` | `Topics` | Protected |
| `/topics/:blockId` | `TopicItems` | Protected |
| `/grammar` | `Grammar` | Protected |
| `/vocabulary` | `Vocabulary` | Protected |
| `/pronunciation` | `PronunciationOverviewPage` | Protected |
| `/pronunciation/:groupId` | `PronunciationGroupPage` | Protected |

Protected loaders await the initial authentication result and redirect guests to
Home. Unknown routes render a page-not-found notification.

## Route Data And Navigation Handoff

Route-critical IndexedDB queries are represented by typed descriptors in
`frontend/src/routing/route-data.ts`. Data routes consume these descriptors before
rendering their destination page. Navigation controls load required data after a
click and navigate only when the request succeeds.

The storage in `route-data-handoff.ts` is only a short handoff: concurrent requests are
deduplicated, successful unconsumed results expire after ten seconds, and a route
loader consumes an entry once. Failures are evicted immediately so a click can
retry. Mutations invalidate matching unconsumed descriptors; IndexedDB remains the
source of truth.

`DataNavigationButton` and `DataNavigationLink` start loading after a click and keep
the current route visible while loading runs. A successful request navigates; a
failure leaves the user on the current page and reports the standard loading toast.
Direct URLs, refresh, and history navigation run the same route loaders without
relying on prepared data.

## State Categories

| Category | Examples | Notes |
| --- | --- | --- |
| Remote source | Supabase Auth, PostgreSQL, Storage | Used by sync, auth, audio archive download. |
| Local source of truth | Dexie IndexedDB models in `frontend/src/database/models` | Practice and overview features read local data. |
| Global UI/app state | Zustand stores in `frontend/src/features/**/use-*-store.ts` | Auth, sync flags, dashboard stats, audio, theme, toast, help, overlay, PWA prompt. |
| Feature-local state | React state inside pages/hooks | Practice queues, reveal state, modal/detail views, search terms. |
| localStorage | Theme, volume, sync timestamp, unsaved practice progress, search/UI preferences | Used for lightweight persistence and crash/unload recovery. |

## Page Composition

`Home` is the main user hub. It reads auth state, daily stats, sync error state,
and renders `HomePracticeButtons` plus dashboard and overview links.

Practice routes share `PracticeSessionCard` where possible:

- `Practice` uses one `usePracticeDeck` for vocabulary, grammar review, and new-item discovery.
- `BlockTrainingPractice` uses a query-string block ID so refresh and direct
  navigation can load the same mandatory initial-training flow.

Overview pages are route-level shells around feature components and model queries.

## Feature Boundaries

Pages should stay thin: they compose feature components, route parameters, and
navigation. Feature modules own interaction logic through hooks/components and
call Dexie model classes for durable progress state. Zustand stores carry
session, UI, and cached aggregate state; they should not replace IndexedDB as the
source of truth for user progress.

When a behavior crosses features, identify the connection point first: a route,
a Zustand store, a Dexie live query, a localStorage fallback, or a model method.
The feature catalog in [features.md](features.md) is the
highest-level map of those boundaries.
