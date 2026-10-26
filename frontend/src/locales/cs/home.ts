export const HOME_TEXTS = {
  // Home Page
  appTitle: 'Angličtina',
  appDescription: 'Bez stresu. Bez přemýšlení. Jen dril.',
  guide: 'Návod',
  noDashboardData: 'Žádná dostupná data.',
  signupHint:
    'Aplikace po přihlášení ukládá cvičební data do úložiště Vašeho prohlížeče (7.8MB). Účet je možno kdykoliv smazat, včetně všech dat.',
  installButton: 'Nainstalovat aplikaci',
  installButtonTooltip: 'Nainstalovat PWA aplikaci.',
  grammarReviewButton: 'Opakování gramatiky',
  vocabularyReviewButton: 'Opakování slovíček',
  newButton: 'Další lekce',
  dailyNewLessonLimitReached: 'Denní limit nových lekcí byl dosažen. Změňte jej v Profilu.',

  // User
  authInitErrorToast: 'Nastala chyba při přihlašování.',

  // Synchronization status
  syncSuccessToast: 'Data byla úspěšně synchronizována.',
  syncErrorToast: 'Chyba při synchronizaci dat.',
  syncWarning: 'Chyba synchronizace.',

  // Demo sign-in
  anonymousSigninButton: 'Pokračovat jako host',
  anonymousSigninLoading: 'Probíhá přihlášení...',
  anonymousSigninTooltip: 'Anonymní přihlášení můžete později změnit na skutečné.',

  // Convert anonymous account
  convertAnonymousButton: 'Převést účet hosta na Google účet',
  convertAnonymousButtonTooltip: 'Propojí aktuální účet hosta s Google přihlášením.',
  convertAnonymousLoading: 'Připravuji propojení účtu ...',
  convertAnonymousErrorToast: 'Převod účtu hosta se nepodařil.',
  identityLinkConflictTitle: 'Google účet už existuje',
  identityLinkConflictText:
    'Tento Google účet je už propojený s jiným účtem. Zůstáváte přihlášeni jako host a váš současný postup se nezměnil. Pokud se přihlásíte k existujícímu účtu, postup z tohoto hostovského účtu se nepřenese.',
  continueAsGuest: 'Pokračovat jako host',
  signInExistingAccount: 'Přihlásit se k existujícímu účtu',
  existingAccountSigninErrorToast:
    'Přihlášení přes Google se nepodařilo. Zůstáváte přihlášeni jako host.',

  // Simulate data
  simulateDataButton: 'Simulovat data',
  simulateDataLoading: 'Simuluji data ...',
  simulateDataTooltip: 'Destruktivně přepíše část pokroku. Použijte pouze pro testování.',
  simulateDataModalTitle: 'Opravdu simulovat data?',
  simulateDataModalText: (lessonCount: number) =>
    `Nastaví simulovaný pokrok slovíček v prvních ${lessonCount} lekcích a označí tyto lekce jako započaté. Existující pokrok u těchto slovíček bude přepsán.`,
  simulateDataConfirm: 'Přepsat data',
  simulateDataSuccessToast: 'Data byla úspěšně simulována.',
  simulateDataErrorToast: 'Chyba při simulaci dat.',
  simulateDataExplanation: (lessonCount: number) =>
    `Pro testování nastaví pokrok slovíček v prvních ${lessonCount} lekcích a označí lekce jako započaté. Změna je nevratná.`,
} as const;
