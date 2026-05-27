export const HOME_TEXTS = {
  // Home Page
  appTitle: 'Angličtina',
  appDescription: 'Bez stresu. Bez přemýšlení. Jen dril.',
  appTestDescription: 'Aplikace v testovacím režimu',
  guide: 'Návod',
  startedTodayHint: 'Dnes započato',
  masteredTodayHint: 'Dnes naučeno',
  signupHint:
    'Aplikace po přihlášení ukládá cvičební data do úložiště Vašeho prohlížeče (7.8MB). Účet je možno kdykoliv smazat, včetně všech dat.',
  installButton: 'Nainstalovat aplikaci',
  installButtonTooltip: 'Nainstalovat PWA aplikaci.',
  starsToday: 'Denní cíl',

  // User
  userLabel: 'Uživatel',
  userStatsLabel: 'Dnes',
  practiceOverviewTitle: 'Přehled procvičování',
  practiceOverviewOpen: 'Otevřít přehled procvičování',
  practiceOverviewMoreDays: '... Dalších 7 dní',
  authInitErrorToast: 'Nastala chyba při přihlašování.',

  // Synchronization status
  syncSuccessToast: 'Data byla úspěšně synchronizována.',
  syncErrorToast: 'Chyba při synchronizaci dat.',
  syncLoadingText: 'Synchronizuji data ...',
  syncWarning: 'Chyba synchronizace. Data mohou být zastaralá.',

  // Demo sign-in
  demoSigninButton: 'Vyzkoušet demo účet',
  demoSigninButtonTooltip: 'Použijte pouze pro rychlé vyzkoušení aplikace.',
  demoSigninLoading: 'Přihlašuji do demo účtu ...',
  demoSigninSuccess: 'Přihlášení do demo účtu proběhlo úspěšně.',
  demoSigninError: 'Demo přihlášení se nepodařilo. Zkuste to prosím znovu.',
  demoSigninInvalidCredentialsError:
    'Demo účet nelze přihlásit: zkontrolujte DEMO_EMAIL a DEMO_PASSWORD v Supabase Secrets.',
  demoSigninEmailProviderDisabledError:
    'Email+heslo přihlášení je v Supabase vypnuté. Zapněte Authentication > Providers > Email.',
  demoSigninCaptchaError: 'Ověření CAPTCHA se nepodařilo. Zkuste to znovu.',
  demoSigninRateLimitError: 'Příliš mnoho pokusů. Opakujte to prosím později.',
  demoSigninMissingCaptchaKey: 'Chybí nastavení CAPTCHA klíče pro demo přihlášení.',
} as const;
