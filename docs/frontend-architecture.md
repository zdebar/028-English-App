# Frontend architecture

The frontend is a React, TypeScript, and Vite application. IndexedDB is the durable local store for curriculum and user progress. Supabase provides authentication, remote data, and audio storage.

## Startup and app shell

**frontend/src/main.tsx** normalizes OAuth callback parameters, starts the auth and PWA lifecycles, and mounts the hash router inside StrictMode and an error boundary.

The PWA lifecycle in **frontend/src/features/pwa/pwa-lifecycle.ts** requests persistent browser storage when supported, listens for installation events, registers the service worker after page load in production, and removes app-scoped registrations and caches in development.

**frontend/src/App.tsx** owns the application shell and connects account-scoped lifecycles:

| Owner | Responsibility |
| --- | --- |
| **useDataManagerLifecycle** | Initializes the local data snapshot when the account changes and prepares Home data on Home. |
| **usePeriodicSync** | Starts and stops the singleton sync manager and attempts a best-effort user-data sync when the session ends. |
| **useAudioLoader** | Loads per-user audio volume preference. |
| **useThemeLoader** | Loads and applies the user or guest theme. |
| App shell | Renders navigation, route outlet, toast container, overlay, and identity-link modal. |

## Routes and data

Paths are declared in **frontend/src/config/routes.config.ts** and wired in **frontend/src/router.tsx**. **frontend/src/routing/route-loaders.ts** handles auth checks, invalid detail IDs, and redirect behavior. **frontend/src/routing/route-data.ts** ensures the corresponding package in the data manager.

| Route group | Examples | Data preparation |
| --- | --- | --- |
| Public | Home, privacy policy, guide | Home loader prepares Home package for a signed-in user. |
| Practice | Grammar review, vocabulary review, initial training | Loaders ensure the relevant review or training package before rendering. |
| Overviews | Overviews, topics, grammar, vocabulary, sounds, pronunciation | Each route ensures its page package before navigation. |
| Details | Topic, sound, pronunciation group details | The loader validates the route ID and prepares the parameter-specific package. |
| Profile | Profile | Uses auth/profile state and does not require a curriculum package. |

After the loader completes, a page subscribes through **useDataPackage**. The loader and component therefore use the same package cache rather than maintaining separate copies. Invalid or missing details redirect to their parent overview.

## Shared state boundaries

| State owner | Holds |
| --- | --- |
| Supabase | Remote auth session, PostgreSQL records, and audio objects. |
| Dexie / IndexedDB | Durable curriculum mirror, user progress, local audio records, sync metadata. |
| Central data manager | In-memory snapshot for the active user, derived review data, and cached typed page packages. |
| Feature Zustand stores | Auth and sync status, theme, audio preferences, toast, help, overlay, and PWA prompt state. |
| React component state | Temporary interaction state such as selected item, reveal state, search results, and modal state. |
| localStorage / sessionStorage | Small user preferences and temporary OAuth recovery data. |

The data manager excludes audio blobs and sync checkpoint metadata. Audio remains in its own cache; sync cursors remain in the synchronization layer.

## Practice and overview composition

Home reads its dashboard and practice availability from the Home package. Review and initial-training pages subscribe to their own packages. An active practice queue remains local to its session so a background data refresh does not reorder the current session.

Overview and detail pages subscribe to prepared packages built in **frontend/src/database/state/data-package-builders.ts** from selectors in **data-selectors.ts**. Pages may call model commands for user actions such as progress reset; they do not create a second source for displayed curriculum data.

For persistence and change delivery, see [data-and-sync.md](data-and-sync.md) and [state-and-events.md](state-and-events.md).
