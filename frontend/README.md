# Zdeněk Barth's English Learning App 0.1.0

## Description

A personal learning app with focus on drill. Learning games are not working.

### Basic functionality

Data management is frontend storage first. Practice data are stored in IndexedDB and regularly synchronized.

## Git Guidelines

### Branching Strategies

- **master**: Deployment branch  
  ├── **0.1.0**: Development branch

### Commit Message Standard

Format: `<type>: <description>`

#### Commit Types:

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation updates
- **style**: UI or design changes
- **refactor**: Code refactoring
- **chore**: Dependency or installation updates
- **test**: Adding or updating tests
- **perf**: Performance optimizations
- **ios**: iOS-specific changes
- **android**: Android-specific changes

### Styling Guide

Vite File Structure: kebab-case (e.g., `use-fetch.ts`)  
Database Table Names: snake_case (e.g., `user_items`)  
IndexedDB Object Store Names: snake_case (e.g., `user_items`)  
React & TypeScript: Hook `useFetch`, Component `PracticeCard`

## App Structure

### Frontend

- **Build tool**: Vite
- **Language**: TypeScript
- **Framework**: React
- **UI framework**: Tailwind CSS
- **State management**: Zustand
- **Database wrapper**: Dexie (for IndexedDB)

### Backend

- **Platform**: Supabase (BaaS)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Database**: PostgreSQL

### Supabase PostgreSQL Database Structure

- **users**: Stores user id.
- **items**: Stores practice items (vocabulary words and grammar sentences).
- **grammar**: Stores grammar explanations.
- **user_items**: Tracks user's items progress score, next practice date, etc.
- **user_score**: Tracks daily practice scores for users.

## Storage

Stores audio files zips. Separated into multiple batches. First one smaller to enable faster start.

### Data Types

- **SQL** Data as stored on Supabase
- **Local** Data as used on frontend. Mostly nulls converted to nullReplacementValue. More in Null Replacement Values.

### IndexedDB Structure

The app uses IndexedDb for locally storing data. It enables offline function as long as refresh toke lasts, and it limits server traffic.

#### Null Replacement Values

- **Primary keys:** IndexedDB does not allow `null` or `undefined` in primary keys (including compound keys).
- **Sorting:** IndexedDB always sorts `null` values first in ascending order and last in descending order.
- **Between:** Dexie is incapable using `null` values in between filtering.
- **Backend sync:** After "get" from backend, `null` values are replaced with `config.nullReplacementValues` where necessary.<br>
  Before "post" to backend, `config.nullReplacementValues` are replaced with `null` where necessary.

### Synchronization

App is sync on every refresh or every 24 hours with -**SyncSinceLastSync**- and every 7 days with **SyncAll**

- **SyncAll** First synchronizes changes to backend, then fetches all data from backend and replaces entire IndexedDB store. To ensure IndexedDB correctness.
- **SyncSinceLastSync** First synchronizes changes to backend, then fetches only changed data. To ensure minimal traffic.

#### IndexedDB Stores

- **metada**
  - Stores last synchronization dates
  - **Stores synced_at date for:**
    - `grammar`
    - `user_scores`
    - `user_items`
  - **Null Replacements:**
    - `config.nullReplacementUserId` — used because `userId` is part of a compound primary key.
- **grammar**
  - Stores grammar explanation
- **user_scores**
  - Stores user's daily practice
- **audio_metada**
  - Stores fatched_at date for archive_name of audio files
- **audio_records**
  - Stores audio files
- **user_items**
  - Stores all relevant information for practicing items. Basically merges backends "items" and "user_items" tables.
  - **Null Replacements:**
    - `config.nullReplacementDate` - used for started_at, next_at, mastered_at; On fetch Dates are converted on backend, on post Dates are converted in frontend
    - `config.nullReplacementNumber` - used for grammar_id

## Features

- **auth**: User management - register, sign in, sign out, delete user profile, via supabase auth
  - managed by Supabase Auth
- **dashboard**: Shows started items count
- **error-handler**: Error Handling Management

  Error Handling Approach
  - catch errors at hook / component level
  - showFailure toast to user
  - log with error-handler - to console in development, to online logging service in production
  - ErrorBoundary - for unexpected errors

- **grammar**: Grammar overview
- **help**: Help text hints

  HelpButton
  - switches on global overlay state

  HelpText
  - with absolute positioning, to be placed at appropriate element
  - visibility driven by global help state

- **key-listener**:

  A React hook that listens for specific key presses on the window and executes a callback when those keys are pressed.
  It can optionally be disabled when an overlay is open, based on the `disabledOnOverlayOpen` flag.

- **modal**: Button with Confirmation Modal

- **overlay**: Global Overlay Screen

  Layout Overlay
  - Covers the screen to reduce the visibility of components below the overlay (z-level)
  - Prevents click events from propagating to underlying components
  - Optionally disables key listeners below, based on individual component settings
  - Closed by pressing Escape or onClick (closing could be linked to feature using Overlay)

- **practice**: Manages practice deck, and its logic

- **privacy-policy**: Privacy Policy Content

- **theme**: Theming

  This hook handles theme detection, persistence, and application:
  - Detects the system's preferred color scheme (light or dark).
  - Reads the stored theme from localStorage if available.
  - Applies the theme by toggling CSS classes on the document root.
  - Persists the chosen theme to localStorage only when user changes theme.

- **toast**: Notification Toasts

  Displays notification to user.

  Types:
  - success
  - error
  - infor

- **vocabulary**: Vocabulary overview

## Future Development

### Database

- Backup
- Prevent out-of-range values
- Do not synchronize already mastered audio files
- Paginate sync

### Layout

- Support for multiple real screens

### Error Handling

- Prevent repeated requests to failed services
- Logging services
- Resync on Grammar Failure, only limited tries

### PWA

- Screenshots
- If localStorage stored unsynced, sync
