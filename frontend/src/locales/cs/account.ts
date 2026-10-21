export const ACCOUNT_TEXTS = {
  // Profile
  profileNameLabel: 'Uživatel',
  profileEmailLabel: 'E-mail',
  profileDailyNewLessonLimit: 'Nové lekce za den',
  profileDailyNewLessonLimitHint: 'Kolik nových lekcí lze zahájit během jednoho dne.',
  profileFullSyncButton: 'Plná synchronizace',
  profileFullSyncInProgress: 'Synchronizuji…',
  profileFullSyncHint: 'Plné obnovení stavu aplikace.\nPoužít při podezření na poškození dat.',

  // Signout Button
  signoutButtonTitle: 'Odhlásit se',
  signoutModalText: 'Opravdu se chcete odhlásit ze svého účtu?',
  signoutError: 'Chyba při odhlašování.',

  // Delete User Button
  deleteUserButtonTitle: 'Smazat účet',
  deleteUserModalText:
    'Opravdu chcete okamžitě a nenávratně smazat svůj uživatelský účet a všechna jeho data?',
  deleteUserSuccessToast: 'Váš uživatelský účet byl úspěšně smazán.',
  deleteUserErrorToast: 'Chyba při mazání uživatelského účtu.',

  // Generic Restart Progress
  restartProgress: 'restartovat pokrok',
  restartProgressHelp: 'restartovat pokrok',
  restartProgressCzToEn: 'reset postupu cz to en',
  restartProgressEnToCz: 'reset postupu en to cz',
  restartDescription: 'Opravdu chcete restartovat pokrok? Tuto akci již nelze vrátit zpět.',
} as const;
