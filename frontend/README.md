# Zdeněk Barth's English Learning App 0.1.0

## Description

A personal learning app with focus on drill. Learning games are not working.

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

### IndexedDB Structure

The app uses IndexedDb for locally storing data. It enables offline function as long as refresh toke lasts, and it limits server traffic.

Null for certains columns are replaced with nullReplacementDate or nullReplacementNumber. IndexedDB doesn't enables indexing for nulls.
To minimize data synchronization update methods utilize lastSyncedAt Date (inclusive), for sync precision app methods utilize newSyncedAt Date (exclusive).
Combined keys: many uses as primary keys combined keys (usually "userId + itemId" etc.) because IndexedDB cannot naturally do combined primary key from multiple columns.

- **audio_metada**
  - stores synced_at date for audio_records
- **audio_records**
  - store audio files
- **metada**
  - stores synced_at date for grammar, user_scores, user_items
- **grammar**
  - stores grammar explanation
- **user_scores**
  - stores user's daily practice
- **user_items**
  - stores all relevant information for practicing items. Basically merges backends "items" and "user_items" tables.

### Features

- **auth**: User management - register, sign in, sign out, delete user profile, via supabase auth
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
