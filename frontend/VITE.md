# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Sentry Monitoring (Production)

Sentry is initialized in `src/main.tsx` only when all conditions below are met:

- build runs in production mode
- `VITE_SENTRY_DSN` is set
- `VITE_SENTRY_ENABLED` is not set to `false`

### Setup

1. Create `.env.production` from `.env.production.example`.
2. Set a real DSN from your Sentry project.
3. Keep sample rates conservative for external testing first.

Default sample rates in the example:

- `VITE_SENTRY_TRACES_SAMPLE_RATE=0.1`
- `VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0`
- `VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1`

This gives low-overhead performance traces, no full-session replay, and full replay capture when an error occurs.

### App-level helpers

Use centralized helpers from `src/features/logging/monitoring-handler.ts`:

- `reportError(message, error, context?)`
- `reportInfo(message, context?)`
- `setMonitoringUser(userId)`

Use these helpers directly in app code and tests.

`setMonitoringUser` is now called automatically from auth state changes, so Sentry issues are linked to the current user ID when signed in.

Current sync events sent as `info`/`error` messages:

- `data_sync_started`
- `data_sync_succeeded`
- `data_sync_failed`
- `audio_sync_started`
- `audio_sync_succeeded`
- `unmount_sync_succeeded`
- `unmount_sync_failed`

### Build release version

The `build` script now generates `VITE_APP_VERSION` automatically for release tracking.

Default format:

- `<package-name>@<package-version>+<git-sha>`

Example:

- `028-english-app@0.0.0+1a2b3c4`

Implementation file:

- `scripts/build-with-version.mjs`

Behavior:

- If `VITE_APP_VERSION` is already set in environment, it is preserved.
- If git SHA is unavailable, fallback suffix is `+local`.
