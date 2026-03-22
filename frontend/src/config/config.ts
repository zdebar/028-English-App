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
    plusProgress: 1, // Progress value for a "plus" button
    minusProgress: -2, // Progress value for a "minus" button
    skipProgress: 100, // Progress value for a "skip" button
    finishedProgress: 0, // Progress value for a word to be considered finished
  },

  srs: {
    // Spaced Repetition System configuration
    intervals: [
      0, // Precomputed repetition algorithm in seconds
      0, // 0s
      120, // 2m
      900, // 15m
      3600, // 1h
      14400, // 4h
      86400, // 1d
      172800, // 2d
      345600, // 4d
      691200, // 8d
      1036800, // 12d
      1382400, // 16d
    ],
    randomness: 0.1, // Randomness of SRS algorithm 0.1 (10%)
  },

  audio: {
    audioBucketName: 'audio-files',
    archiveBucketName: 'audio-archive',
    initialArchive: ['audio_part_1.zip'],
    allArchives: ['audio_part_1.zip', 'audio_part_2.zip'],
  },

  lesson: {
    deckSize: 5, // Number of items per deck
    lessonSize: 500, // Number of items per lesson
  },

  practice: {
    dailyGoal: 400, // Number of new items recommended for daily practice
    audioDelay: 0, // Delay in milliseconds for automatically playing audio
    CZ_TO_EN: 'czToEn',
    EN_TO_CZ: 'enToCz',
  },

  vocabulary: {
    itemsPerPage: 8, // Number of vocabulary items per page
  },

  toast: {
    duration: 5000, // Duration in milliseconds for which the toast is visible
  },

  buttons: {
    minLoadingTime: 400, // Minimum loading time for loading buttons in milliseconds
    loadingMessageDelay: 100, // Delay before showing loading message in milliseconds
  },
};

export default config;
