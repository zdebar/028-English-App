export const HOME_TEXTS = {
  // Home Page
  appTitle: 'Angličtina',
  appDescription: 'Bez stresu. Bez přemýšlení. Jen dril.',
  appTestDescription: 'Aplikace v testovacím režimu',
  guide: 'Návod',
  startedTodayHint: 'Dnes započato',
  masteredTodayHint: 'Dnes naučeno',
  noDashboardData: 'Žádná dostupná data.',
  signupHint:
    'Aplikace po přihlášení ukládá cvičební data do úložiště Vašeho prohlížeče (7.8MB). Účet je možno kdykoliv smazat, včetně všech dat.',
  installButton: 'Nainstalovat aplikaci',
  installButtonTooltip: 'Nainstalovat PWA aplikaci.',
  starsToday: 'Denní cíl',
  vocabularyPracticeButton: 'Slovíčka',
  newGrammarPracticeButton: 'Nová gramatika',
  grammarPracticeButton: 'Gramatika',

  // User
  userLabel: 'Uživatel',
  userStatsLabel: 'Dnes',
  practiceOverviewTitle: 'Přehled procvičování',
  practiceOverviewOpen: 'Otevřít přehled procvičování',
  practiceOverviewMoreDays: '... Dalších 7 dní',
  practiceOverviewNone: 'Žádné započaté dny',
  authInitErrorToast: 'Nastala chyba při přihlašování.',

  // Synchronization status
  syncSuccessToast: 'Data byla úspěšně synchronizována.',
  syncErrorToast: 'Chyba při synchronizaci dat.',
  syncLoadingText: 'Synchronizuji data ...',
  syncWarning: 'Chyba synchronizace.',

  // Demo sign-in
  anonymousSigninButton: 'Pokračovat jako host',
  anonymousSigninLoading: 'Probíhá přihlášení...',
  anonymousSigninTooltip: 'Anonymní přihlášení můžete později změnit na skutečné.',

  // Convert anonymous account
  convertAnonymousButton: 'Převést účet hosta na Google účet',
  convertAnonymousButtonTooltip: 'Propojí aktuální účet hosta s Google přihlášením.',
  convertAnonymousLoading: 'Připravuji propojení účtu ...',
  convertAnonymousSuccessToast: 'Účet hosta byl úspěšně převeden.',
  convertAnonymousErrorToast: 'Převod účtu hosta se nepodařil.',

  // Simulate data
  simulateDataButton: 'Simulovat data',
  simulateDataLoading: 'Simuluji data ...',
  simulateDataTooltip: 'Nevratně změní data uživatele. Použijte pro testování aplikace.',
  simulateDataSuccessToast: 'Data byla úspěšně simulována.',
  simulateDataErrorToast: 'Chyba při simulaci dat.',
  simulateDataExplanation:
    'Přehledy v Profilu zobrazují pouze rozcvičené položky. Funkce "Simulovat data" přidá pokrok k prvním 1000 položkám uživatele a umožní tak Přehledy testovat. Změna je nevratná.',
} as const;
