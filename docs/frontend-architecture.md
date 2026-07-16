# Frontend Architecture

The frontend is a React + TypeScript + Vite app. It is local-first for user
progress: UI reads and writes IndexedDB through model classes, then synchronization
pushes/pulls Supabase changes.

## App Boot Sequence

`frontend/src/App.tsx` owns app-wide initialization:

| Step | Owner | Effect |
| --- | --- | --- |
| Auth initialization | `useAuthStore.initializeAuth` | Loads Supabase session, listens for auth changes, sets monitoring user. |
| Audio settings load | `useAudioLoader` | Initializes per-user volume from localStorage. |
| User stats sync | `useUserStoreSync` | Clears stats on sign-out or triggers stats reload events on sign-in. |
| Theme load | `useThemeLoader` | Loads per-user or guest theme and applies DOM classes/meta color. |
| Periodic data sync | `usePeriodicSync` | Starts delayed sync, periodic sync, and unmount sync. |
| Daily stats reset | `useDailyStatsReset` | Polls date changes and reloads daily/level stats after midnight. |
| Global UI shells | `ToastContainer`, `OverlayMask`, `Header` | Renders global notifications, overlay mask, and navigation. |

## Routes

Routes are configured in `frontend/src/config/routes.config.ts` and wired in
`frontend/src/App.tsx`.

| Route | Page | Access |
| --- | --- | --- |
| `/` | `Home` | Public |
| `/privacy-policy` | `PrivacyPolicy` | Public |
| `/guide` | `Guide` | Public |
| `/practice/vocabulary` | `Practice mode="vocabulary"` | Protected |
| `/practice/new-grammar` | `NewGrammarPractice` | Protected |
| `/practice/grammar` | `Practice mode="grammar"` | Protected |
| `/practice-overview` | `PracticeOverview` | Protected |
| `/profile` | `Profile` | Protected |
| `/levels` | `Levels` | Protected |
| `/topics` | `Topics` | Protected |
| `/topics/:blockId` | `TopicItems` | Protected |
| `/grammar` | `Grammar` | Protected |
| `/vocabulary` | `Vocabulary` | Protected |

`ProtectedLayout` gates protected routes. Unknown routes render a page-not-found
notification.

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

- `Practice` uses `usePracticeDeck` for vocabulary and review grammar.
- `NewGrammarPractice` uses `useNewGrammarPracticeDeck` for the special new
  grammar learning flow.

Overview pages are route-level shells around feature components and model queries.

## Feature Boundaries

Pages should stay thin: they compose feature components, route parameters, and
navigation. Feature modules own interaction logic through hooks/components and
call Dexie model classes for durable progress state. Zustand stores carry
session, UI, and cached aggregate state; they should not replace IndexedDB as the
source of truth for user progress.

When a behavior crosses features, identify the connection point first: a route,
a Zustand store, a browser event such as `levelsUpdated`, a localStorage fallback,
or a model method. The feature catalog in [features.md](features.md) is the
highest-level map of those boundaries.
