# Zdeněk Barth's English Learning App 0.1.0

## Description

A personal learning app with focus on drill.

### Basic functionality

Data management is frontend storage first. Practice data are stored in IndexedDB and regularly synchronized.

## Git Guidelines

### Branching Strategies

- **master**: Deployment
  ├── **0.1.0**: Basic Functionality
  ├── **0.2.0**: Ease of Life Features
  ├── **0.3.0**: Learning Blocks
  ├── **0.4.0**: Modifications from Testing
  ├── **0.5.0**: Multilanguage

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

### Supabase Database Structure

- **users**: Stores user uuid, and user's data.
- **levels**: Stores levels.
- **lessons**: Stores individual lessons. Every lesson should contain 100 items for simplicity. Every lesson belongs to single level.
- **grammar**: Stores grammar explanations. Grammar are independent of levels and lessons.
- **items**: Stores practice items (vocabulary words and grammar sentences). Every items belongs to single lesson, and refers to single grammar | null.
- **user_items**: Tracks user's items progress score, next practice date, etc.
- **user_scores**: Tracks daily practice scores for users.

### Data Types

- **SQL** Data as stored on Supabase
- **Local** Data as used on frontend. Mostly nulls converted to nullReplacementValue. More in Null Replacement Values.

### Date Types

- **date_at** Generally dates (started_at, next_at, etc.) are stored as TIMESTAMPTZ
- **user_score.date** Is stored as "YYYY-MM-DD". Dates are determined on frontend as stripped local time. Ex. User time is "2026-03-05 14:30:00+08" is determined as "2026-03-05"

### Supabase Database Logic

- **started_at**: Marks started records.
- **updated_at**: Marks updated records. Enables to partially synchronize only items changed from last sync time.
- **next_at**: Stores date of next practice opportunity. User items with next_at > now will filtered out from practice. Next_at should be null for not mastered or deleted items.
- **mastered_at**: Marks already mastered records. Will be filtered out from more practice.
- **deleted_at**: Marks deleted records. Marking them instead of directly deleting them enables partial synchronization.

### Supabase Storage

- **audio-archive**: Stores audio files zips. Separated into multiple batches. First one smaller to enable faster start. Intended for app regular synchronization.
- **audio-files**: Stores individual audio files. Intended for backup fetch of missing audio files.

### IndexedDB Structure

The app uses IndexedDb for locally storing data. It enables offline function as long as refresh toke lasts, and it limits server traffic.

- **metadata**: Stores last sync times for grammar, user_items, user_scores
- **levels**: Corresponds to backend SQL levels table
- **lessons**: Corresponds to backend SQL lesson table
- **grammar**: Corresponds to backend SQL grammar table
- **user_scores**: Corresponds to backend SQL user_scores table
- **user_items**: Flatten data from backend SQL tables items, user_items, lesson, levels
- **audio_metada**: Stores fatched_at date for archive_name of audio files
- **audio_records**: Stores audio files

### Null Replacement Values for IndexeDB

- **Primary keys:** IndexedDB does not allow `null` or `undefined` in primary keys (including compound keys).
- **Sorting:** IndexedDB always sorts `null` values first in ascending order and last in descending order.
- **Between:** Dexie is incapable using `null` values in between filtering.

For aformentioned limitations in IndexedDB, nulls are on sync substituted with nullReplacement values.

- **nullReplacementDate**: Highest possible date value '9999-12-31T23:59:59+00:00', so that in ASC null date are sorted last
- **nullReplacementNumber**: 0, for grammar_id when there is no corresponding grammar, so that in ASC null numbers are sorted first

### Synchronization

App is sync on every refresh or every 24 hours periodically.
Uses SyncAll or partial SyncSinceLastSync. SyncDates (partial, full) are stored in localStorage.

- **SyncAll** First synchronizes changes to backend, then fetches all data from backend and replaces entire IndexedDB store. To ensure IndexedDB correctness.
- **SyncSinceLastSync** First synchronizes changes to backend, then fetches only changed data. To ensure minimal traffic.

## Features

- **auth**: User management - register, sign in, sign out, delete user profile, via supabase auth
  - managed by Supabase Auth
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

- **levels**: Overview of user progress across levels and lessons
- **logging**: Console logging functions on in development, off in production
- **modal**: Button with Confirmation Modal
- **overlay**: Global Overlay Screen

  Layout Overlay
  - Covers the screen to reduce the visibility of components below the overlay (z-level)
  - Prevents click events from propagating to underlying components
  - Optionally disables key listeners below, based on individual component settings
  - Closed by pressing Escape or onClick (closing could be linked to feature using Overlay)

- **practice**: Manages practice deck, and its logic
- **privacy-policy**: Privacy Policy Content
- **pwa**: Installable application
- **sync**: IndexedDB synchronization
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
  - info

- **user-stats**: User progress statistics
- **vocabulary**: Vocabulary overview
