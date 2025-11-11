const config = {
  database: {
    dbName: "AppDatabase",
    nullReplacementDate: "9999-12-31T23:59:59+00:00", // IndexedDB does not support null values in indexes
    nullReplacementNumber: -1,
  },

  progress: {
    plusProgress: 1,
    minusProgress: -2,
    skipProgress: 100,
    learnedProgress: 5, // Progress value for a word to be considered learned
    finishedProgress: 0, // Progress value for a word to be considered finished
    learnedAtThreshold: 5,
    masteredAtThreshold: 10,
  },

  srs: {
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
    bucketName: "audio-archive",
    archives: ["audio_part_1.zip", "audio_part_2.zip"],
  },

  lesson: {
    dailyPracticeItems: 400,
    deckSize: 10,
    lessonSize: 100, // Number of items per lesson
  },
};

export default config;
