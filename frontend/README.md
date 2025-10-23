# Zdeněk Barth's English Learning App v0.9.0

## Description

A personal English learning app designed with simplicity similar to ANKI, but with a prebuilt English learning data. This project is clean continuation of project 020-flash-card-app-typescript.

I believe many features in existing English learning apps can hinder progress. When learners are presented with options, they often choose what feels easiest, like games or reading. However, the most critical aspects of learning any language are **listening** and **speaking**. This app focuses exclusively on fast listening and speaking drill via flashcards.

### Goals of the App:

1. **Maximize Practice Density**  
   Drill as many practice attempts as possible within a given time. This is best achieved with flashcards and a continuous sequence of items without interruptions.

2. **Alternating Practice in Both Directions**  
   Listening and speaking are the most important parts of language learning. Flashcards alternate between two directions:

   - Listening to English and translating to Czech.
   - Reading Czech and translating to English.

3. **Spaced Repetition System (SRS)**  
   With dense practice repetition, each item is repeated at least five times on the first day.

4. **User Feedback**

   - **Daily Practice Count:** Encourages users to start practicing. The recommended minimum is 400 items or approximately 20 minutes.
   - **Progression Levels:** Items are organized into levels of 100 items to provide granular progress feedback.

5. **Flexible Practice Duration**  
   While there is a recommended minimum, the practice sequence is continuous. Users can practice for as long as they want, even for 10 hours straight.

6. **Contextual Learning**  
   Vocabulary is first learned independently and then reinforced in sentence contexts.

---

## App Structure

### Frontend

Vite + React + Tailwind CSS
WASM SQLite database
Audio files in IndexedDB

### Synchronization

Supabase / Authentication, Storage for Audio Files, PostgresSQL for user data

## Database

### Database Structure

The app uses an SQLite database to store user progress, vocabulary, and grammar data. Below is a high-level overview of the database structure:

- **users**: Stores user information.
- **items**: Stores practice items (vocabulary and grammar sentences).
- **blocks**: Groups items into vocabulary or grammar group. Recommended size is 10 items.
- **grammar**: Stores grammar explanations.
- **user_items**: Tracks user progress for individual items.
- **user_score**: Tracks daily practice scores for users.

For detailed table definitions and column explanations, see the `database-sqlite.sql` file.

### Data Structure

Each item represents a single vocabulary word or a sentence for practicing grammar. Items are sequenced starting from 1, with 1 being the learning start point.

---

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

package.json
react-native-get-random-values // necessary for uuid on android
