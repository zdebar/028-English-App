const config = {
  sync: {
    fullSyncInterval: 7 * 24 * 60 * 60 * 1000, // Interval for performing a full sync in milliseconds (30 days)
    periodicSyncInterval: 24 * 60 * 60 * 1000, // Interval for periodic sync in milliseconds (1 day)
    scoreResetCheckInterval: 60 * 1000, // Interval for resetting daily scores in milliseconds (1 minute)
  },

  database: {
    dbName: 'EnglishAppDatabase', // Name of the IndexedDB database
    epochStartDate: '1970-01-01T00:00:00+00:00', // Start date for epoch time calculations
    nullReplacementDate: '9999-12-31T23:59:59+00:00', // IndexedDB does not support null values in indexes
    nullReplacementNumber: 0, // IndexedDB does not support null values in indexes
    nullReplacementUserId: 'for_all_users', // Replacement user ID for null values in indexes
  },

  progress: {
    afterInitialTrainingProgress: 2, // Progress after completing a block's initial training
    simulationItemCount: 800,
    simulationItemProgress: 1,
    simulationStartedBlockCount: 8,
    simulationPronunciationItemCount: 5,
  },

  srs: {
    // Spaced Repetition System configuration
    intervals: {
      czToEn: [0, 120, 900, 3600, 14400, 86400, 172800, 345600],
      enToCz: [60, 450, 1800, 7200, 43200, 128000, 260000, 520000],
    },
    randomness: 0.2, // Randomness of SRS algorithm
  },

  audio: {
    audioBucketName: 'audio-files',
    archiveBucketName: 'audio-archive',
  },

  lesson: {
    deckSize: 5, // Number of items per deck
  },

  practice: {
    starChunk: 40, // Number of repetitions needed to fill one star
    starsPerRow: 10, // Number of stars shown in one tier row
    audioDelay: 100, // Delay in milliseconds for automatically playing audio
    holdDuration: 300, // Duration in milliseconds for which the practice card is held before moving to the next item
    readyPracticeBadgeCap: 40, // Maximum exact ready-practice badge value before showing a capped label, preferable same as starChunk
    readyPracticeScheduleGroupWindowMs: 1000, // Time window for grouping future ready-practice schedule entries
    maxReadyScheduleTimerDelayMs: 2_147_483_647, // Maximum setTimeout delay supported by browsers
    CZ_TO_EN: 'czToEn',
    EN_TO_CZ: 'enToCz',
  },

  vocabulary: {
    itemsPerBatch: 8, // Number of vocabulary items revealed per batch
  },

  toast: {
    duration: 5000, // Duration in milliseconds for which the toast is visible
  },

  loading: {
    dataStateDelayMs: 1000, // Delay before showing loading indicator for data views
  },

  buttons: {
    minLoadingTime: 400, // Minimum loading time for loading buttons in milliseconds
    loadingMessageDelay: 300, // Delay before showing loading message in milliseconds
  },
};

export default config;
