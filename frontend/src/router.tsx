import App from '@/App';
import DelayedNotification from '@/components/UI/DelayedNotification';
import RouteDataError from '@/components/utils/route-data-error';
import ProtectedLayout from '@/components/utils/protected-layout';
import { ROUTES } from '@/config/routes.config';
import { loadHomeDataPackage } from '@/routing/home-loader';
import { TEXTS } from '@/locales/cs';
import InitialTrainingPractice from '@/pages/InitialTrainingPractice';
import Grammar from '@/pages/Grammar';
import Guide from '@/pages/Guide';
import Home from '@/pages/Home';
import Overviews from '@/pages/Overviews';
import Practice from '@/pages/Practice';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Profile from '@/pages/Profile';
import PronunciationGroupPage from '@/pages/PronunciationGroupPage';
import PronunciationOverviewPage from '@/pages/PronunciationOverviewPage';
import TopicItems from '@/pages/TopicItems';
import Topics from '@/pages/Topics';
import Vocabulary from '@/pages/Vocabulary';
import Sounds from '@/pages/Sounds';
import SoundGroupPage from '@/pages/SoundGroupPage';
import Notification from '@/components/UI/Notification';
import {
  loadGrammarOverviewRoute,
  loadGrammarReviewRoute,
  loadInitialTrainingRoute,
  loadOverviewsRoute,
  loadPronunciationGroupDetailRoute,
  loadPronunciationOverviewRoute,
  loadSoundGroupDetailRoute,
  loadSoundsRoute,
  loadTopicDetailRoute,
  loadTopicsRoute,
  loadVocabularyReviewRoute,
  loadVocabularyRoute,
  protectedLoader,
} from '@/routing/route-loaders';
import { createHashRouter } from 'react-router-dom';

export const router = createHashRouter([
  {
    path: ROUTES.home,
    Component: App,
    HydrateFallback: InitialLoadingFallback,
    errorElement: <RouteDataError />,
    children: [
      { index: true, loader: loadHomeDataPackage, Component: Home },
      { path: ROUTES.privacyPolicy, Component: PrivacyPolicy },
      { path: ROUTES.guide, Component: Guide },
      {
        Component: ProtectedLayout,
        loader: protectedLoader,
        HydrateFallback: InitialLoadingFallback,
        children: [
          {
            path: ROUTES.practice,
            loader: loadGrammarReviewRoute,
            Component: Practice,
          },
          {
            path: ROUTES.grammarPractice,
            loader: loadGrammarReviewRoute,
            Component: Practice,
          },
          {
            path: ROUTES.vocabularyPractice,
            loader: loadVocabularyReviewRoute,
            Component: Practice,
          },
          {
            path: ROUTES.initialTraining,
            loader: loadInitialTrainingRoute,
            Component: InitialTrainingPractice,
          },
          {
            path: ROUTES.overviews,
            loader: loadOverviewsRoute,
            Component: Overviews,
          },
          { path: ROUTES.profile, Component: Profile },
          {
            path: ROUTES.topics,
            loader: loadTopicsRoute,
            Component: Topics,
          },
          {
            path: ROUTES.topicDetail,
            loader: loadTopicDetailRoute,
            Component: TopicItems,
          },
          {
            path: ROUTES.grammar,
            loader: loadGrammarOverviewRoute,
            Component: Grammar,
          },
          {
            path: ROUTES.vocabulary,
            loader: loadVocabularyRoute,
            Component: Vocabulary,
          },
          {
            path: ROUTES.sounds,
            loader: loadSoundsRoute,
            Component: Sounds,
          },
          {
            path: ROUTES.soundDetail,
            loader: loadSoundGroupDetailRoute,
            Component: SoundGroupPage,
          },
          {
            path: ROUTES.pronunciationGroups,
            loader: loadPronunciationOverviewRoute,
            Component: PronunciationOverviewPage,
          },
          {
            path: ROUTES.pronunciationGroup,
            loader: loadPronunciationGroupDetailRoute,
            Component: PronunciationGroupPage,
          },
        ],
      },
      {
        path: '*',
        element: <Notification className="pt-8">{TEXTS.pageNotFound}</Notification>,
      },
    ],
  },
]);

function InitialLoadingFallback() {
  return <DelayedNotification className="mt-20" />;
}
