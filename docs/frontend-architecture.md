# Frontend Architecture

The frontend is a React, TypeScript, and Vite application. User progress is
written to IndexedDB first and synchronized with Supabase by background and
explicit sync flows.

## Startup

`frontend/src/main.tsx` handles the browser entrypoint:

1. Cleans up OAuth error parameters before the hash router interprets the URL.
2. Requests persistent browser storage when the Storage API supports it.
3. Starts the Supabase auth lifecycle and listens for the PWA install prompt.
4. Registers `public/service-worker.js` after page load in production. In
   development it unregisters a worker scoped to the app and clears that app's
   caches.
5. Mounts the hash-based React Router under `StrictMode` and an error boundary.

The root layout in `frontend/src/App.tsx` owns app-wide hooks and UI:

| Owner | Effect |
| --- | --- |
| `usePracticeAvailabilityStoreSync` | Loads Home practice availability and refreshes it on focus or when the page becomes visible. |
| `useAudioLoader` | Loads per-user audio volume from localStorage. |
| `useThemeLoader` | Loads the user or guest theme and applies it to the document. |
| `usePeriodicSync` | Schedules delayed and daily Supabase sync, prepares local practice/overview queries, and performs best-effort user-data sync on unmount. |
| App shell | Renders the header, footer, route outlet, toast container, identity-link modal, and overlay. |

## Routes

Paths are declared in `frontend/src/config/routes.config.ts` and wired in
`frontend/src/router.tsx`.

| Route | Page | Access |
| --- | --- | --- |
| `/` | `Home` | Public |
| `/privacy-policy` | `PrivacyPolicy` | Public |
| `/guide` | `Guide` | Public |
| `/practice`, `/practice/grammar` | `Practice` | Protected grammar review |
| `/practice/vocabulary` | `Practice` | Protected vocabulary review |
| `/practice/initial-training` | `InitialTrainingPractice` | Protected |
| `/profile` | `Profile` | Protected |
| `/overviews` | `Overviews` | Protected |
| `/topics` | `Topics` | Protected |
| `/topics/:topicId` | `TopicItems` | Protected |
| `/grammar` | `Grammar` | Protected |
| `/vocabulary` | `Vocabulary` | Protected |
| `/sounds` | `Sounds` | Protected |
| `/sounds/:groupId` | `SoundGroupPage` | Protected |
| `/pronunciation` | `PronunciationOverviewPage` | Protected |
| `/pronunciation/:groupId` | `PronunciationGroupPage` | Protected |

The protected parent loader waits for auth initialization and redirects signed-out
users to Home. Route loaders get data from local models and in-memory query
caches; feature pages do not query Supabase directly. Unknown routes show the
page-not-found notification.

## Route Data And Queries

`frontend/src/routing/route-data.ts` defines typed data descriptors for review,
initial training, and overview pages. The router awaits those descriptors before
rendering the corresponding protected page. After sign-in,
`usePeriodicSync` warms the practice selection arrays and pre-reads overview
queries. After sync it invalidates and rebuilds the practice arrays.

Navigation buttons only navigate. Dexie `liveQuery` subscriptions in
`useLiveQueryData` and `observeSharedQuery` keep selected overview and dashboard
queries current while their consumers are mounted. Home practice availability
uses its own store and explicit refresh controller; it is refreshed after sync,
practice writes, resets, focus, and visibility changes.

## State Boundaries

| State | Examples | Role |
| --- | --- | --- |
| Supabase | Auth session, PostgreSQL rows, Storage objects | Remote account, content, progress, settings, and audio source. |
| Dexie IndexedDB | Models under `frontend/src/database/models` | Local read/write store for practice, content, and user settings. |
| Zustand | Auth, sync, availability, theme, audio, toasts, help, overlay, and pronunciation UI state | Runtime state and cached view data; not the durable progress store. |
| React state | Current card, reveal state, selected detail, modal state, vocabulary search | Feature-local interaction state. |
| localStorage | Theme, audio volume, full-sync timestamp, search text, simulation toggle | Small browser-persisted preferences and sync metadata. |
| sessionStorage | Temporary anonymous session fallback during Google sign-in | Short-lived OAuth recovery data. |

## Page Composition

Home shows sign-in actions for signed-out users. Signed-in users see buttons for
new lesson training, grammar review, and vocabulary review, along with a
lesson-start dashboard and a sync warning when needed.

Review routes use `Practice` and `usePracticeDeck`; the route selects grammar or
vocabulary review. Answers are saved to IndexedDB one at a time. Initial training
uses `InitialTrainingPractice` and `useInitialTrainingDeck`; it selects remaining
unstarted items from the next lesson and saves each answer locally.

The `/overviews` page links to topics, grammar, vocabulary, sounds, and
pronunciation. Detail pages compose feature UI with local model queries and reset
actions.

## Feature Boundaries

Pages compose route data, feature components, and navigation. Feature modules own
interaction logic. Dexie models own durable local records and synchronization
methods. Zustand stores expose session, status, availability, and cached display
state. When tracing a side effect, follow its route loader, model write, explicit
cache refresh, or live query subscription.
