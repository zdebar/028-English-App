export const OVERVIEW_TEXTS = {
  // Levels Overview Page
  levelsStartedHelp: 'Započato / celkem položek',
  levelsMasteredHelp: 'Naučeno / celkem položek',

  // Grammar Overview Page
  noGrammar: 'Žádná započatá gramatika.',
  startedCount: 'Započato',
  masteredCount: 'Naučeno',
  restartGrammarTitle: 'Restartovat gramatiku',
  restartGrammarDescription:
    'Opravdu chcete restartovat pokrok všech položek této gramatiky? Tuto akci nelze vrátit zpět.',

  // Topics Overview Page
  noTopics: 'Žádná započatá témata.',
  noTopicItems: 'V tomto tématu nejsou žádné položky.',
  resetTopicTitle: 'Restartovat téma',
  resetTopicDescription:
    'Opravdu chcete restartovat pokrok všech položek tohoto tématu? Tuto akci nelze vrátit zpět.',

  // Privacy Policy Page
  privacyPolicy: 'Zásady ochrany osobních údajů',

  // Vocabulary Page
  translationDirection: 'Přepnout výchozí jazyk',
  more: 'Další',
  enterPrompt: 'Zadejte slovičko ...',
  noStartedVocabulary: 'Žádná započatá slovíčka',
  vocabularyCzechOption: 'Čeština',
  vocabularyEnglishOption: 'Angličtina',
  czech: 'Česky',
  english: 'Anglicky',
  pronunciation: 'Výslovnost',
  pronunciationTitle: (pronunciation: string) => `Výslovnost: ${pronunciation}`,
  levelName: 'CEFR úroveň',
  lessonOrder: 'Číslo lekce',
  lessonName: 'Název lekce',
  startedAt: 'Započato',
  updatedAt: 'Změněno',
  nextAt: 'Další',
  masteredAt: 'Naučeno',
  restartItemProgress: 'Restartovat pokrok této položky',

  // Profile Page
  levelsOverview: 'Přehled CEFR úrovní',
  levelsOverviewTooltip: 'Přehled CEFR úrovní s pokrokem',
  topicsOverview: 'Přehled témat',
  topicsOverviewTooltip: 'Přehled tematických skupin',
  grammarOverview: 'Přehled gramatiky',
  grammarOverviewTooltip: 'Přehled započaté gramatiky',
  vocabularyOverview: 'Přehled slovíček',
  vocabularyOverviewTooltip: 'Přehled započatých slovíček',
} as const;
