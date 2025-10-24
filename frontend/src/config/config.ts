const config = {
  backendURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  plusProgress: 1,
  minusProgress: -2,
  skipProgress: 100,
  dailyPracticeItems: 400,
};

export default config;
