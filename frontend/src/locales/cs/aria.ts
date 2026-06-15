export const ARIA_TEXTS = {
  dashboardRegion: 'Ukazatel pokroku lekcí',
  lessonProgressBar: 'Ukazatel pokroku lekcí',
  setVolume: 'Nastavit hlasitost',
  volumePercent: (percent: number) => `Hlasitost: ${percent}%`,
  switchToDarkTheme: 'Přepnout na tmavý režim',
  switchToLightTheme: 'Přepnout na světlý režim',
  dailyStarProgress: 'Denní pokrok',
  starInTier: (tier: string, index: number, total: number) => `${tier} hvězda ${index} z ${total}`,
  closeOverlay: 'Zavřít překryv',
  note: 'Poznámka',
} as const;
