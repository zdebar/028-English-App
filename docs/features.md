# Feature Catalog

This catalog maps current user-visible behavior to the frontend owners and data
sources. Start here when a change crosses a route, model, store, or sync boundary.

## App Shell And Routing

| Feature | Main entrypoints | Data and state | Behavior |
| --- | --- | --- | --- |
| App shell | `main.tsx`, `App.tsx`, `Header`, `Footer` | Auth, sync, theme, audio, availability stores | Starts global hooks and renders route content, toast, overlay, identity-link modal, and navigation. |
| Public routes | `/`, `/guide`, `/privacy-policy` | Auth store | Home offers sign-in to signed-out users; the guide and privacy page are static. |
| Protected routes | `router.tsx`, `ProtectedLayout` | `useAuthStore.userId` | Protected route loaders wait for auth initialization and redirect signed-out users to Home. |

## Auth And Account

| Feature | Main entrypoints | Behavior |
| --- | --- | --- |
| Session initialization | `startAuthLifecycle`, `useAuthStore` | Restores and validates the Supabase session, handles OAuth callbacks, and keeps auth state current. |
| Anonymous sign-in | `AnonymousSigninButton`, `anonymous-auth-service` | Creates a guest account for trying the app. |
| Google sign-in and conversion | `GoogleAuthButton`, `ConvertAnonymousUserButton`, `anonymous-session-fallback` | Signs in or links a guest account. A short-lived sessionStorage fallback supports OAuth recovery and identity-link conflict handling. |
| Profile | `/profile`, `Profile` | Shows the account name/email, offers full sync and sign-out/delete actions, and saves `max_new_lessons_per_day`. |
| Account deletion | `DeleteUserButton`, `useAuthStore`, `hard_delete_user` RPC | Permanently deletes the authenticated Supabase user and their linked data after confirmation. |

## Home

| Feature | Main entrypoints | Data and state | Behavior |
| --- | --- | --- | --- |
| Signed-out Home | `/`, `Home`, auth buttons | `useAuthStore` | Shows app information, guide/install links, anonymous sign-in, and Google sign-in. |
| Signed-in Home | `Home`, `Dashboard`, `PracticeButton` | Local models, `useUserStore`, `useSyncStore` | Shows a test-mode notice, practice buttons, a lesson-start dashboard, and a sync warning when needed. |
| Practice availability | `PracticeButton`, `practice-availability-controller` | `usePracticeAvailabilityStore` | Shows New, Grammar Review, and Vocabulary Review. Review buttons show due counts; availability rules are in [home-readiness.md](home-readiness.md). |
| Lesson dashboard | `Dashboard`, `Levels.getOverview` | `levels`, `lessons`, `user_items`, `user_lessons` | Displays lesson progress by level. It is informational and does not navigate. |
| Simulated progress | `SimulateDataButton`, `simulate-data-service` | `UserItem`, `UserLesson`, localStorage | For anonymous users, applies a local vocabulary fixture to the first 100 curriculum lessons with vocabulary and marks those lessons started. Requires sync completion and confirmation. |

## Practice And Learning

| Feature | Main entrypoints | Data and state | Behavior |
| --- | --- | --- | --- |
| Grammar review | `/practice`, `/practice/grammar`, `PracticeCard`, `usePracticeDeck` | `UserItem`, review arrays | Selects due grammar items in an enabled review direction; saves each answer locally before advancing. |
| Vocabulary review | `/practice/vocabulary`, `PracticeCard`, `usePracticeDeck` | `UserItem`, review arrays | Selects due vocabulary items and uses the same per-answer save path. |
| Initial training | `/practice/initial-training`, `InitialTrainingPractice`, `useInitialTrainingDeck` | `UserItem`, `UserLesson`, `Groups` | Trains eligible unstarted items from the next lesson and records the lesson start under the user's daily limit. |
| Practice details | `PracticeSessionCard`, `GrammarDetailCard`, `VocabularyDetailCard` | `notes`, `groups`, `group_items`, audio store | Shows available grammar/note details and audio alongside a practice item. |

See [practice-flows.md](practice-flows.md) for queue and answer behavior.

## Overviews

| Feature | Route | Main data source | Behavior |
| --- | --- | --- | --- |
| Overview menu | `/overviews` | Local availability queries | Links to sounds, pronunciation, vocabulary, topics, and grammar. |
| Topics | `/topics`, `/topics/:topicId` | `groups`, `group_items`, started lessons/items | Lists topic groups and their initiated items. Topic membership is stored in `group_items`. |
| Grammar | `/grammar` | `groups`, `group_items`, `group_relations` | Displays the grammar hierarchy and available examples using the unified group model. |
| Vocabulary | `/vocabulary` | `user_items`, item content | Searches initiated vocabulary and stores the search term in localStorage. |
| Sounds | `/sounds`, `/sounds/:groupId` | Sound-typed groups and item memberships | Organizes sounds by category and shows examples available from started lessons. |
| Pronunciation contrasts | `/pronunciation`, `/pronunciation/:groupId` | Pronunciation groups, contrast relations, sound groups | Shows contrasts and examples with audio; a contrast becomes active when its linked sounds are available. |

Feature adapters such as `Topic`, `GrammarTopic`, `GrammarChunk`, `SoundGroup`,
and `PronunciationGroup` query `groups`, `group_items`, and `group_relations`; they
do not correspond to separate current content tables.

## Data, Sync, And Offline Behavior

| Feature | Main entrypoints | Behavior |
| --- | --- | --- |
| Local-first data | Dexie models under `frontend/src/database/models` | Practice and overview features read local content and user records. User progress writes land in IndexedDB first. |
| Periodic sync | `usePeriodicSync`, `dataSync` | Pushes local user changes, pulls shared/user updates, refreshes practice availability, and then syncs audio archives. |
| Full sync | `Profile`, `dataSync(userId, true)` | Reconciles local and remote records and refreshes the audio archive cache. |
| Logout/unmount sync | `handleLogout`, `dataSyncOnUnmount` | Attempts an incremental sync of user items, lesson starts, and user settings when a valid session exists. |
| Audio | `useAudioManager`, `AudioRecord`, `AudioMetadata` | Downloads audio from Supabase Storage on demand, caches blobs in IndexedDB, and refreshes changed archives. |

See [data-and-sync.md](data-and-sync.md) for cursors, storage keys, and merge
behavior.

## Global UI And PWA

| Feature | Main entrypoints | Behavior |
| --- | --- | --- |
| Theme | `useThemeLoader`, `useThemeStore`, `theme-utils` | Persists a light or dark choice for the user or guest and applies it to the document. |
| Toasts | `useToastStore`, `ToastContainer` | Displays transient success, error, and loading messages. |
| Help and overlay | `useHelpStore`, `useOverlayStore`, `HelpText`, `Modal`, `OverlayMask` | Coordinates contextual help, modal callbacks, and backdrop state. |
| PWA install | `InstallPwaButton`, `usePwaStore` | Captures the browser install prompt event and lets the user invoke it. |
| Service worker | `main.tsx`, `scripts/generate-sw.mjs`, `public/service-worker.js` | Production builds generate a precache manifest and register the worker after page load. Development removes an app-scoped registration and its caches. |
| Responsive layout | `useResponsiveLayout`, `useSideHeaderOrientation` | Sets layout attributes used by the app shell at different viewport sizes. |

## Observability

`monitoring-handler` reports errors and informational events from auth, sync,
audio, route loading, and progress actions. `GoogleAnalytics` is mounted by the
app shell when analytics is configured.
