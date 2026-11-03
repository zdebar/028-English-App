# Feature catalog

This catalog maps visible behavior to its current feature owner and the data path it uses.

## App shell and account

| Area | Entry points | Behavior |
| --- | --- | --- |
| App shell and routes | **App.tsx**, **router.tsx**, **routing/** | Starts account-scoped lifecycles, displays shared UI, and loads route packages before rendering protected data pages. |
| Authentication | **features/auth/** | Restores Supabase sessions, supports anonymous and Google sign-in, account conversion, sign-out, and identity-link recovery. |
| Profile and deletion | **pages/Profile.tsx**, **features/auth/DeleteUserButton.tsx** | Shows account details and offers confirmed sign-out or account deletion. Account deletion hard-deletes the account and linked user data. |

## Home and practice

| Area | Entry points | Data and behavior |
| --- | --- | --- |
| Signed-out Home | **pages/Home.tsx**, auth buttons | Shows app information and sign-in options. |
| Signed-in Home | **features/dashboard/Dashboard.tsx**, **features/practice/PracticeButton.tsx** | Reads level progress and practice availability from the Home package. |
| Review | **pages/Practice.tsx**, **features/practice/hooks/use-practice-deck.ts** | Selects due grammar or vocabulary items, saves answers locally before advancing, and keeps the active session queue stable. |
| Initial training | **pages/InitialTrainingPractice.tsx**, **features/practice/hooks/use-initial-training-deck.ts** | Trains unstarted items from the next eligible lesson and records lesson starts. New training is blocked at configured review thresholds, except when continuing a lesson started today. |
| Practice detail | **features/practice/PracticeSessionCard.tsx** and detail components | Displays item audio, note, and grammar context from prepared packages. |

See [practice-flows.md](practice-flows.md) and [home-readiness.md](home-readiness.md).

## Overview features

Topics, grammar, vocabulary, sounds, and pronunciation read typed packages prepared by the data manager. Their pages subscribe with **useDataPackage**; model methods are used for commands such as progress resets.

| Feature | Routes | Main data |
| --- | --- | --- |
| Overview menu | **/overviews** | Availability for grammar, topics, vocabulary, and sounds. |
| Topics | **/topics**, **/topics/:topicId** | Topic groups and initiated member items. |
| Grammar | **/grammar** | Grammar groups, their hierarchy, and initiated examples. |
| Vocabulary | **/vocabulary** | Initiated vocabulary, notes, and sound groups. |
| Sounds | **/sounds**, **/sounds/:groupId** | Sound groups and available example items. |
| Pronunciation | **/pronunciation**, **/pronunciation/:groupId** | Pronunciation groups, contrast relationships, sounds, examples, and audio availability. |

The shared group model lives in **groups**, **group_items**, and **group_relations**. Page-specific result shapes are built in **frontend/src/database/state/data-package-builders.ts** and **data-selectors.ts**.

## Persistence and system features

| Area | Entry points | Behavior |
| --- | --- | --- |
| Data manager | **frontend/src/database/state/** | Mirrors IndexedDB rows in memory, builds page packages, and updates cached packages after committed writes and sync deltas. |
| Synchronization | **features/synchronization/sync-manager.ts** | Coordinates incremental data sync, automatic retries for transient failures, online recovery, and audio archive tasks. |
| Audio | **features/audio/**, **database/audio/**, **database/models/audio-records.ts** | Loads audio for playback and stores blobs in the separate IndexedDB audio cache. |
| Theme, toast, help, overlay | Corresponding folders under **features/** | Own small shared UI state and behavior. |
| PWA | **features/pwa/**, **frontend/scripts/generate-sw.mjs** | Handles install events and service-worker lifecycle. |
| Logging | **features/logging/** | Normalizes application errors and controls informational console output. |

See [data-and-sync.md](data-and-sync.md) for commit and cross-tab update behavior.
