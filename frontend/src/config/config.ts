const config = {
  database: {
    dbName: 'EnglishAppDatabase', // Name of the IndexedDB database
    nullReplacementDate: '9999-12-31T23:59:59+00:00', // IndexedDB does not support null values in indexes
    nullReplacementNumber: 0, // IndexedDB does not support null values in indexes
  },

  progress: {
    plusProgress: 1, // Progress value for a "plus" button
    minusProgress: -2, // Progress value for a "minus" button
    skipProgress: 100, // Progress value for a "skip" button
    finishedProgress: 0, // Progress value for a word to be considered finished
    maxBlockCount: 10, // Maximum number of lessons/blocks, visible in the the lesson bar
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
    bucketName: 'audio-archive',
    archives: ['audio_part_1.zip', 'audio_part_2.zip'],
  },

  lesson: {
    deckSize: 10, // Number of items per deck
    lessonSize: 100, // Number of items per lesson
  },

  practice: {
    dailyGoal: 400, // Number of new items recommended for daily practice
  },
};

export default config;
