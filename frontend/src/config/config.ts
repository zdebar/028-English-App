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
    afterNewBlockProgress: 1, // Direction progress after completing a new block
    simulationItemCount: 800,
    simulationItemProgress: 1,
    simulationStartedBlockCount: 8,
    simulationPronunciationItemCount: 5,
  },

  srs: {
    // Spaced Repetition System configuration
    intervals: {
      czToEn: [10, 20, 60, 240, 7200, 28800, 43200, 86400, 172800, 345600],
      enToCz: [15, 40, 120, 480, 14400, 43200, 86400, 172800, 345600, 691200],
    },
    randomness: 0.2, // Randomness of SRS algorithm
  },

  audio: {
    audioBucketName: 'audio-files',
    archiveBucketName: 'audio-archive',
  },

  practice: {
    initialTrainingBatchSize: 8, // Maximum size of an automatically assembled initial-training batch
    reviewMinimumSize: 20, // Minimum number of due items required to start one review direction
    dailyProgressGoal: 400, // Daily progress-change goal shown on the home page
    audioDelay: 100, // Delay in milliseconds for automatically playing audio
    holdDuration: 300, // Duration in milliseconds for which the practice card is held before moving to the next item
    maxReviewReadyTimerDelayMs: 2_147_483_647, // Maximum setTimeout delay supported by browsers
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
