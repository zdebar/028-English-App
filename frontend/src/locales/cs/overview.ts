export const OVERVIEW_TEXTS = {
  // Home lesson progress grid
  lessonOverview: 'přehled započatých lekcí',
  lessonsOverview: 'Přehled lekcí',
  noLessons: 'Nejsou dostupné žádné lekce.',
  lessonStarted: 'zahájena',
  lessonNotStarted: 'nezahájena',

  // Grammar Overview Page
  noGrammar: 'Žádná započatá gramatika.',
  restartGrammarTitle: 'Restartovat gramatiku',
  restartGrammarDescription:
    'Opravdu chcete restartovat pokrok všech položek této gramatiky? Tuto akci nelze vrátit zpět.',
  restartGrammarDirectionTitle: 'Restartovat pokrok gramatiky',

  // Topics Overview Page
  noTopics: 'Žádná započatá témata.',
  soundsOverview: 'Přehled hlásek',
  shortVowels: 'short vowels',
  longVowels: 'long vowels',
  doubleVowelSounds: 'double vowel sounds',
  voicelessConsonants: 'voiceless consonants',
  voicedConsonants: 'voiced consonants',
  otherConsonants: 'other consonants',
  noSounds: 'Žádné odemčené hlásky.',
  noSoundItems: 'Pro tuto hlásku nejsou dostupné příklady.',
  resetSoundTitle: 'Restartovat hlásku',
  resetSoundDescription: 'Opravdu chcete restartovat pokrok příkladů této hlásky?',
  noTopicItems: 'V tomto tématu nejsou žádné položky.',
  resetTopicTitle: 'Restartovat téma',
  resetTopicDescription:
    'Opravdu chcete restartovat pokrok všech položek tohoto tématu? Tuto akci nelze vrátit zpět.',

  // Privacy Policy Page
  privacyPolicy: 'Zásady ochrany osobních údajů',

  // Vocabulary Page
  translationDirection: 'Přepnout výchozí jazyk',
  more: 'další',
  enterPrompt: 'Zadejte slovičko ...',
  noStartedVocabulary: 'Žádná započatá slovíčka',
  vocabularyCzechOption: 'Čeština',
  vocabularyEnglishOption: 'Angličtina',
  czech: 'Česky',
  czechDescription: 'Český popis',
  noCzechDescription: 'bez popisu',
  english: 'Anglicky',
  pronunciation: 'Výslovnost',
  pronunciationTitle: (pronunciation: string) => `Výslovnost: ${pronunciation}`,
  lessonOrder: 'Číslo lekce',
  updatedAt: 'Změněno',
  completedAt: 'dokončeno',
  nextAt: 'další',
  masteredAt: 'Naučeno',
  practiceSchedule: 'Procvičování',
  notScheduled: 'Nenaplánováno',
  restartItemProgress: 'Restartovat pokrok této položky',
  restartDirectionProgressDescription:
    'Opravdu chcete restartovat pokrok pouze v tomto směru procvičování?',

  // Overviews Page
  overviews: 'Přehledy',
  progressOverviews: 'Pokrok',
  pronunciationSettings: 'Porovnání hlásek',
  topicsOverview: 'Přehled témat',
  topicsOverviewTooltip: 'Přehled tematických skupin',
  grammarOverview: 'Přehled gramatiky',
  grammarOverviewTooltip: 'Přehled započaté gramatiky',
  vocabularyOverview: 'Přehled slovíček',
  vocabularyOverviewTooltip: 'Přehled započatých slovíček',
  pronunciationGroups: 'Skupiny výslovnosti',
  pronunciationGroupsTooltip: 'Skupiny podobně znějících položek',
  playRandomWord: 'Přehrát náhodné slovo',
  clickToRevealRandomWord: 'Kliknutím zobrazte',
  playNextRandomWordTooltip: 'Kliknutím přehrajete další náhodné slovo',
  pronunciationStartedHelp: 'odemčeno/celkem položek',
  noPronunciationGroups: 'Žádné dostupné skupiny výslovnosti.',
  noPronunciationGroupItems: 'V této skupině nejsou dostupná slovíčka.',
} as const;
