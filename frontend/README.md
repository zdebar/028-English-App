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

### Database Structure

- **items**: Stores practice items (vocabulary words and grammar sentences).
- **grammar**: Stores grammar explanations.
- **user_items**: Tracks user's items progress score, next practice date, etc.
- **user_score**: Tracks daily practice scores for users.

## Storage

Stores audio files zips. Separated into multiple batches. First one smaller to enable faster

### IndexedDB Structure

The app uses IndexedDb for locally storing data. It enables offline function as long as refresh toke lasts, and it limits server traffic.

Null for certains columns are replaced with nullReplacementDate or nullReplacementNumber. IndexedDB doesn't enables

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
