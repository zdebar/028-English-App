const config = {
  dbName: "AppDatabase",
  plusProgress: 1,
  minusProgress: -2,
  skipProgress: 100,
  dailyPracticeItems: 400,
  deckSize: 10,
  nullReplacementDate: "9999-12-31T23:59:59+00:00", // IndexedDB does not support null values in indexes
  learnedAtThreshold: 5,
  masteredAtThreshold: 10,
  SRS: [
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
  srsRandomness: 0.1, // Randomness of SRS algorithm 0.1 (10%); uniform distribution; to ensure that words are not repeated in blocks, but are mixed out
  learnedProgress: 5, // Progress value for a word to be considered learned
  finishedProgress: 0, // Progress value for a word to be considered finished
  audioBucketName: "audio-archive",
  audioArchives: ["audio_part_1.zip"],
};

export default config;
