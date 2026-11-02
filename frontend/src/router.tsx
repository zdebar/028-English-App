import App from '@/App';
import DelayedNotification from '@/components/UI/DelayedNotification';
import RouteDataError from '@/components/utils/route-data-error';
import ProtectedLayout from '@/components/utils/protected-layout';
import { ROUTES } from '@/config/routes.config';
import { waitForAuthReady } from '@/features/auth/auth-lifecycle';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { loadInitialTrainingData } from '@/features/practice/initial-training-data';
import { loadHomePracticeAvailability } from '@/routing/home-loader';
import { reportError } from '@/features/logging/logging-handler';
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
  loadGrammarOverviewData,
  loadOverviewAvailabilityData,
  loadPronunciationGroupDetailData,
  loadReviewPracticeData,
  loadSoundGroupDetailData,
  loadSoundsOverviewData,
  loadTopicDetailData,
  loadTopicsOverviewData,
  loadVocabularyOverviewData,
} from '@/routing/route-data';
import { createHashRouter, redirect, type LoaderFunctionArgs } from 'react-router-dom';

export async function protectedLoader() {
  await requireUserId();
  return null;
}

function InitialLoadingFallback() {
  return <DelayedNotification className="mt-20" />;
}

async function requireUserId(): Promise<string> {
  await waitForAuthReady();
  const userId = useAuthStore.getState().userId;
  if (!userId) throw redirect(ROUTES.home);
  return userId;
}

async function loadProtectedData<T>(
  routeName: string,
  loadData: (userId: string) => Promise<T>,
): Promise<T> {
  const userId = await requireUserId();
  try {
    return await loadData(userId);
  } catch (error) {
    reportError(`Failed to load ${routeName} route data`, error);
    throw error;
  }
}

function parsePositiveId(value: string | undefined): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function loadTopicDetail({ params }: LoaderFunctionArgs) {
  const topicId = parsePositiveId(params.topicId);
  if (!topicId) throw redirect(ROUTES.topics);
  const userId = await requireUserId();
  try {
    const data = await loadTopicDetailData(userId, topicId);
    if (!data.topic) throw redirect(ROUTES.topics);
    return data;
  } catch (error) {
    if (error instanceof Response) throw error;
    reportError('Failed to load topic detail route data', error);
    throw error;
  }
}

async function loadPronunciationGroupDetail({ params }: LoaderFunctionArgs) {
  const groupId = parsePositiveId(params.groupId);
  if (!groupId) throw redirect(ROUTES.pronunciationGroups);
  const userId = await requireUserId();
  try {
    const data = await loadPronunciationGroupDetailData(userId, groupId);
    if (!data) throw redirect(ROUTES.pronunciationGroups);
    return data;
  } catch (error) {
    if (error instanceof Response) throw error;
    reportError('Failed to load pronunciation group detail route data', error);
    throw error;
  }
}

async function loadSoundGroupDetail({ params }: LoaderFunctionArgs) {
  const groupId = parsePositiveId(params.groupId);
  if (!groupId) throw redirect(ROUTES.sounds);
  const userId = await requireUserId();
  try {
    const data = await loadSoundGroupDetailData(userId, groupId);
    if (!data) throw redirect(ROUTES.sounds);
    return data;
  } catch (error) {
    if (error instanceof Response) throw error;
    reportError('Failed to load sound group detail route data', error);
    throw error;
  }
}

async function loadInitialTraining() {
  const userId = await requireUserId();
  try {
    const data = await loadInitialTrainingData(userId);
    if (data.items.length === 0) throw redirect(ROUTES.home);
    return data;
  } catch (error) {
    if (error instanceof Response) throw error;
    reportError('Failed to load initial training route data', error);
    throw error;
  }
}

export const router = createHashRouter([
  {
    path: ROUTES.home,
    Component: App,
    HydrateFallback: InitialLoadingFallback,
    errorElement: <RouteDataError />,
    children: [
      { index: true, loader: loadHomePracticeAvailability, Component: Home },
      { path: ROUTES.privacyPolicy, Component: PrivacyPolicy },
      { path: ROUTES.guide, Component: Guide },
      {
        Component: ProtectedLayout,
        loader: protectedLoader,
        HydrateFallback: InitialLoadingFallback,
        children: [
          {
            path: ROUTES.practice,
            loader: () =>
              loadProtectedData('grammar review', (userId) =>
                loadReviewPracticeData(userId, 'grammar'),
              ),
            Component: Practice,
          },
          {
            path: ROUTES.grammarPractice,
            loader: () =>
              loadProtectedData('grammar review', (userId) =>
                loadReviewPracticeData(userId, 'grammar'),
              ),
            Component: Practice,
          },
          {
            path: ROUTES.vocabularyPractice,
            loader: () =>
              loadProtectedData('vocabulary review', (userId) =>
                loadReviewPracticeData(userId, 'vocabulary'),
              ),
            Component: Practice,
          },
          {
            path: ROUTES.initialTraining,
            loader: loadInitialTraining,
            Component: InitialTrainingPractice,
          },
          {
            path: ROUTES.overviews,
            loader: () => loadProtectedData('overviews', loadOverviewAvailabilityData),
            Component: Overviews,
          },
          { path: ROUTES.profile, Component: Profile },
          {
            path: ROUTES.topics,
            loader: () => loadProtectedData('topics', loadTopicsOverviewData),
            Component: Topics,
          },
          {
            path: ROUTES.topicDetail,
            loader: loadTopicDetail,
            Component: TopicItems,
          },
          {
            path: ROUTES.grammar,
            loader: () => loadProtectedData('grammar', loadGrammarOverviewData),
            Component: Grammar,
          },
          {
            path: ROUTES.vocabulary,
            loader: () => loadProtectedData('vocabulary', loadVocabularyOverviewData),
            Component: Vocabulary,
          },
          {
            path: ROUTES.sounds,
            loader: () => loadProtectedData('sound groups', loadSoundsOverviewData),
            Component: Sounds,
          },
          {
            path: ROUTES.soundDetail,
            loader: loadSoundGroupDetail,
            Component: SoundGroupPage,
          },
          {
            path: ROUTES.pronunciationGroups,
            Component: PronunciationOverviewPage,
          },
          {
            path: ROUTES.pronunciationGroup,
            loader: loadPronunciationGroupDetail,
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
