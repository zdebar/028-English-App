# Zdeněk Barth's English Learning App 0.1.0

## Description

A personal English learning app designed with simplicity similar to ANKI, but with a prebuilt English learning data. This project is clean continuation of project 020-flash-card-app-typescript.

Principles of any language is not hard to understand, but it is hard to come naturally. There is nothing complicated about it, it's just about practicing endlessly into automation.

### What I am trying to achieve:

1. **Maximal Practice Density**
   Everyone has limited time and energy to practice. By making the time worthwile
   
2. **Focus on listening and speaking** 
   Practicing both direction in alternation. 

3. **Drill into automation**
   A lot of practice of every single individual vocabulary and plenty of practice sentences. 

4. **Stressless**
   Limit stressing elements as much as possible. 

### How I am trying to achieve it:

1. **Flashcards** 
   Practice method with maximal time density.

3. **Spaced Repetition System (SRS)**  
   Self-correcting frequency of repetition.

4. **Motivating user feedback**
   Splitting progress into small lesson of 100. Just to provide immediate feedback or progress. 

5. **Flexible Practice Duration**  
   While there is a recommended minimum, the practice sequence is continuous. Users can practice for as long as they want, even for 10 hours straight.

6. **Contextual Learning**  
   Vocabulary is first learned independently and then reinforced in sentence contexts. Ex. learning pronouns, 10 podstaných jmen, 10 verbs individually. And then explain present simple and drill it with 100 - 200 sentences combining already learned vocabulary. 

---

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

The app uses an SQLite database to store user progress, vocabulary, and grammar data. Below is a high-level overview of the database structure:

- **items**: Stores practice items (vocabulary words and grammar sentences).
- **grammar**: Stores grammar explanations.
- **user_items**: Tracks user's items progress score, next practice date, etc.  
- **user_score**: Tracks daily practice scores for users.

For detailed table definitions and column explanations, see the `database-sqlite.sql` file.

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

## Version 0.1.0 - DEPLOYED

## Version 0.2.0 - PLANNED

   ### Optimization
   - Batching of data based on user progress (only data expected to be needed)

   ### Security
   - Encryption of IndexedDB and validations
   - More sign-in options
   - Multifactor security

   ### User Deletion
   - Soft deletion
   - Added users table

## Version 0.3.0 - PLANNED

   ## English sounds pronunciation
   - For me it still an issues even hear the sounds that don't exists in czech language. I will experiment with it.

## Version 0.4.0 - PLANNED

   ### Practice data
