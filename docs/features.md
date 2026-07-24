# Feature Catalog

This catalog maps user-visible features to the frontend modules, data sources,
stores, persistence, and refresh signals that make them work. Use it as the
starting point when a change crosses route, store, model, or sync boundaries.

## App Shell And Routing

| Feature | User purpose | Main entrypoints | Data and state | Connection points |
| --- | --- | --- | --- | --- |
| App shell | Initializes the app and renders global UI around routes. | `frontend/src/App.tsx`, `Header`, `Footer` | `useAuthStore`, `useToastStore`, `usePeriodicSync`, `useUserStoreSync`, `useAudioLoader`, `useThemeLoader` | Mounting `App` starts auth, sync, reactive stats, audio, theme, toasts, overlay, and analytics. |
| Public routes | Let unsigned users read static pages or sign in from Home. | `/`, `/guide`, `/privacy-policy` | Auth store decides Home signed-in vs signed-out view. | Unknown routes render a page-not-found notification. |
| Protected routes | Gate practice, profile, and overview pages behind a session. | `ProtectedLayout`, `ROUTES` | `useAuthStore.userId` | Protected route access depends on hydrated auth state, not direct Supabase reads in pages. |
| Navigation | Provides Home/profile/theme navigation and Home footer content. | `Header`, `Footer`, route buttons | Router state, auth state, theme store | Footer renders only on `/`; route buttons use `ROUTES` constants. |

## Auth And Account

| Feature | User purpose | Main entrypoints | Data and state | Connection points |
| --- | --- | --- | --- | --- |
| Session initialization | Restore current Supabase session and keep auth state current. | `useAuthStore.initializeAuth` | Supabase Auth, Sentry/monitoring user context | `App` calls it once; auth changes drive protected route access and user-scoped loaders. |
| Anonymous sign-in | Create a quick trial account. | `AnonymousSigninButton`, `anonymous-auth-service` | Supabase Auth, optional captcha token | Signed-in anonymous users can simulate data from Home after initial sync. |
| Google sign-in | Sign in or convert to a durable account. | `GoogleAuthButton`, `ConvertAnonymousUserButton`, `IdentityLinkConflictModal` | Supabase Auth provider flow, intent-scoped one-time `sessionStorage` guest fallback | Conversion backs up the verified guest before redirect. If the Google identity belongs to another account, callback handling restores the same guest before offering stay-guest or explicit existing-account sign-in; no progress is merged or transferred. |
| Profile page | Show account email and account actions. | `/profile`, `Profile` | `useAuthStore.userEmail` | Links to overview pages and exposes sign-out/delete actions. |
| Sign-out | End the session after best-effort user-data sync. | `SignoutButton`, `useAuthStore.handleLogout` | Supabase Auth, `dataSyncOnUnmount`, theme cleanup | Logout normally syncs user tables before clearing local auth state. |
| Account deletion/reactivation | Soft-delete a user and restore on later sign-in where supported. | `DeleteUserButton`, `useAuthStore` reactivation flow | Supabase user lifecycle RPCs, local auth/session state | Delete clears local state after remote delete; initialization attempts reactivation before finalizing session state. |

## Home

| Feature | User purpose | Main entrypoints | Data and state | Connection points |
| --- | --- | --- | --- | --- |
| Signed-out Home | Presents app title, guide link, install button, and sign-in actions. | `/`, `Home`, auth buttons | `useAuthStore.userId` | Public state renders no local progress queries. |
| Signed-in hub | Shows user name, daily count, practice buttons, dashboard, and sync warning. | `Home`, `Dashboard`, `PracticeOverviewButton`, `HomePracticeButtons` | `useAuthStore`, `useUserStore`, `useSyncStore`, IndexedDB models | Home combines global stores with local model reads; it does not read Supabase directly. |
| Practice readiness button | Enables unified practice when local data is ready. | `HomePracticeButtons` | `UserItem`, Dexie live query | Recalculates after relevant committed writes; timers update future ready counts while Home stays mounted. |
| Sync warning | Warns when the last periodic sync failed. | `Home` | `useSyncStore.isSyncError` | Successful sync clears the warning; failed sync does not prevent local-first practice. |
| Simulated data | Atomically seed anonymous/test item and grammar-block progress once local sync is ready. | `SimulateDataButton`, `simulate-data-service` | `UserItem`, `UserBlock`, localStorage `simulate-data-${userId}` | Advances the first 64 items, masters three grammar blocks, and unlocks the fourth; reactive consumers refresh after commit. |

## Practice And Learning

| Feature | User purpose | Main entrypoints | Data and state | Connection points |
| --- | --- | --- | --- | --- |
| Shared practice card | Display a prompt, answer, controls, audio, and detail buttons. | `PracticeSessionCard`, practice buttons | Hook-provided current item, audio manager state, grammar/note IDs | Used by review practice and new grammar where behavior overlaps. |
| Unified practice | Review vocabulary and started grammar, and introduce new items. | `/practice`, `Practice`, `usePracticeDeck` | `UserItem.getPracticeDeck` | Uses odd/even priority and stops at the first unstarted grammar-block trigger. |
| New grammar | Learn the triggered grammar block in staged rounds. | `/practice/new-grammar`, `NewGrammarPractice`, `useNewGrammarPracticeDeck` | `UserBlock`, `UserItem`, `GrammarChunk` | Completion starts the items, masters the block, and returns to unified practice. |
| Progress actions | Mark an item as hint/repeat/known/skip/mastered. | `HintButton`, `RepeatButton`, `KnownButton`, `MasterItemButton` | `UserItem` progress fields, `UserScore` daily count | Progress writes refresh matching live queries and are pushed by later sync. |
| Audio in practice | Play item audio and respect per-user volume. | `PlayAudioButton`, `useAudioManager`, `useAudioStore` | `AudioRecord`, object URLs, localStorage volume | Audio metadata/records are synchronized separately by periodic sync. |
| Grammar and note details | Show supporting detail cards from practice and overview flows. | `GrammarDetailCard`, `VocabularyDetailCard`, note/grammar viewer hooks | `GrammarChunk`, `Notes`, linked IDs on items | Detail cards are feature-local UI over shared IndexedDB content. |

## Overviews

| Feature | User purpose | Main entrypoints | Data and state | Connection points |
| --- | --- | --- | --- | --- |
| Practice overview | Review recent daily practice counts. | `/practice-overview`, `PracticeOverviewFeature` | `UserScore` | The overview queries score history directly; the current-day snapshot is reactive. |
| Dashboard and levels | Show progress grouped by course structure. | `Dashboard`, `/levels`, levels feature | `Levels`, `Lessons`, `UserItem`, `UserBlock`, `useUserStore` | Active-user live queries refresh cached progress after relevant commits. |
| Topics overview | List ordered blocks marked for the topics UI and allow practice-topic reset. | `/topics`, `TopicsOverview` | `UserBlock`, `UserItem`, audio playback for items | Non-practice topics are always visible without reset; practice topics appear after an item starts. |
| Topic items | Show and reset items inside one topic. | `/topics/:blockId`, `TopicItemsOverview` | `UserBlock`, `UserItem`, audio and detail links | Route parameter retains the underlying block ID. |
| Grammar overview | List started groups with ordered chunk sections and reset group progress. | `/grammar`, `GrammarOverview` | `GrammarGroup`, `GrammarChunk`, `UserItem`, `UserBlock` | Reset traverses every chunk in the selected group. |
| Vocabulary overview | Search and inspect started vocabulary, then reset item progress. | `/vocabulary`, `VocabularyOverview` | `UserItem`, item detail data, localStorage `vocabulary_search_term_${userId}` | Search state persists per user; reset writes local progress and syncs later. |

## Data, Sync, And Offline Behavior

| Feature | User purpose | Main entrypoints | Data and state | Connection points |
| --- | --- | --- | --- | --- |
| Local-first progress | Keep practice responsive and offline-capable. | Dexie models in `frontend/src/database/models` | IndexedDB user tables and shared content tables | UI reads/writes local models first; Supabase is reached through sync/auth/audio flows. |
| Periodic sync | Push local changes and pull remote updates. | `usePeriodicSync`, `dataSync` | Supabase PostgreSQL, sync metadata, `useSyncStore` | Successful sync sets status flags; committed writes refresh live queries and audio archives sync separately. |
| Full sync | Recover or refresh local content/user rows from remote data. | `dataSync(userId, true)` or stale full-sync timestamp | `last-full-sync-at_${userId}`, model `syncFromRemote` methods | Full sync timing is stored in localStorage; model support determines replace behavior. |
| Unmount/logout sync | Try to save user data before leaving or signing out. | `dataSyncOnUnmount`, `handleLogout` | User-scoped models | Runs user-table sync only; failures are reported but should not trap the user in the app. |
| Unsaved practice fallback | Recover buffered review progress after unload or save failure. | `usePracticeDeck`, `restoreUnsavedFromLocalStorage` | localStorage `practiceDeckProgress_${userId}` | The fallback is a crash/unload guard; normal durable progress belongs in IndexedDB. |
| Audio archive sync | Keep local audio records aligned with remote storage metadata. | `AudioRecord.syncFromRemote`, `AudioRecord.removeOrphaned` | Supabase Storage, IndexedDB audio records | Runs after data sync and reports archive errors separately. |

## Global State, Events, And UI Infrastructure

| Feature | User purpose | Main entrypoints | Data and state | Connection points |
| --- | --- | --- | --- | --- |
| Auth store | Expose current user/session to the app. | `useAuthStore` | Supabase Auth session | Drives protected routes, user-scoped loaders, account UI, and sync user ID. |
| Sync store | Expose synchronization status. | `useSyncStore` | In-memory status flags | Home reads `isSyncError`; data refresh follows IndexedDB commits. |
| User stats store | Cache dashboard-level stats. | `useUserStore`, `useUserStoreSync` | Dexie live-query snapshots | Subscribes for the active user and current local date. |
| Theme | Persist and apply user/guest theme. | `useThemeStore`, `useThemeLoader`, `ThemeSwitch` | localStorage theme key, DOM classes | Reloads on user change and affects global document styling. |
| Toasts | Show transient app messages. | `useToastStore`, `ToastContainer` | In-memory toast list | Used by auth, sync, reset, practice, and simulation flows. |
| Help and overlay | Coordinate help text, modals, and backdrop behavior. | `useHelpStore`, `useOverlayStore`, `HelpText`, `Modal`, `OverlayMask` | In-memory UI state | Overlay close can run a registered callback and then clears it. |
| PWA install | Surface browser install prompt. | `InstallPWAButton`, `usePwaStore` | Browser `beforeinstallprompt` event | Prompt state is kept in memory and cleared after handling. |
| Privacy and guide | Provide static user-facing reference pages. | `/privacy-policy`, `/guide` | Static route content | Public routes, no user model dependencies. |

## Observability

| Feature | User purpose | Main entrypoints | Data and state | Connection points |
| --- | --- | --- | --- | --- |
| Error/info reporting | Capture operational failures without blocking local-first use. | `monitoring-handler`, `reportError`, `reportInfo` | Sentry/monitoring configuration | Used by auth, sync, audio, practice saves, reset actions, and loaders. |
| Google Analytics | Track app usage where configured. | `GoogleAnalytics` | Analytics configuration/environment | Mounted once by `App`; independent of IndexedDB progress state. |
