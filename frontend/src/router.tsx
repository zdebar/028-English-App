import App from '@/App';
import DelayedLoadingCircle from '@/components/UI/DelayedLoadingCircle';
import RouteDataError from '@/components/utils/route-data-error';
import ProtectedLayout from '@/components/utils/protected-laout';
import { ROUTES } from '@/config/routes.config';
import { waitForAuthReady } from '@/features/auth/auth-lifecycle';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { reportError } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import BlockTrainingPractice from '@/pages/BlockTrainingPractice';
import Grammar from '@/pages/Grammar';
import Guide from '@/pages/Guide';
import Home from '@/pages/Home';
import Levels from '@/pages/Levels';
import Overviews from '@/pages/Overviews';
import Practice from '@/pages/Practice';
import PracticeOverview from '@/pages/PracticeOverview';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Profile from '@/pages/Profile';
import PronunciationGroupPage from '@/pages/PronunciationGroupPage';
import PronunciationOverviewPage from '@/pages/PronunciationOverviewPage';
import PronunciationPractice from '@/pages/PronunciationPractice';
import TopicItems from '@/pages/TopicItems';
import Topics from '@/pages/Topics';
import Vocabulary from '@/pages/Vocabulary';
import Notification from '@/components/UI/Notification';
import {
  consumePreparedRouteData,
  type RouteDataDescriptor,
} from '@/routing/route-data-handoff';
import {
  blockTrainingDescriptor,
  grammarDescriptor,
  levelsDescriptor,
  overviewAvailabilityDescriptor,
  practiceOverviewDescriptor,
  practiceDeckDescriptor,
  pronunciationPracticeDescriptor,
  pronunciationGroupDetailDescriptor,
  topicDetailDescriptor,
  topicsDescriptor,
  vocabularyDescriptor,
} from '@/routing/route-data';
import { createHashRouter, redirect, type LoaderFunctionArgs } from 'react-router-dom';

export async function protectedLoader() {
  await requireUserId();
  return null;
}

async function requireUserId(): Promise<string> {
  await waitForAuthReady();
  const userId = useAuthStore.getState().userId;
  if (!userId) throw redirect(ROUTES.home);
  return userId;
}

async function loadProtectedData<T>(
  routeName: string,
  createDescriptor: (userId: string) => RouteDataDescriptor<T>,
): Promise<T> {
  const userId = await requireUserId();
  try {
    return await consumePreparedRouteData(createDescriptor(userId));
  } catch (error) {
    reportError(`Failed to load ${routeName} route data`, error);
    useToastStore.getState().showToast(TEXTS.loadingError, 'error');
    throw error;
  }
}

function parsePositiveId(value: string | undefined): number | null {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function loadTopicDetail({ params }: LoaderFunctionArgs) {
  const blockId = parsePositiveId(params.blockId);
  if (!blockId) throw redirect(ROUTES.topics);
  const userId = await requireUserId();
  try {
    const data = await consumePreparedRouteData(topicDetailDescriptor(userId, blockId));
    if (!data.topic) throw redirect(ROUTES.topics);
    return data;
  } catch (error) {
    if (error instanceof Response) throw error;
    reportError('Failed to load topic detail route data', error);
    useToastStore.getState().showToast(TEXTS.loadingError, 'error');
    throw error;
  }
}

async function loadPronunciationGroupDetail({ params }: LoaderFunctionArgs) {
  const groupId = parsePositiveId(params.groupId);
  if (!groupId) throw redirect(ROUTES.pronunciationGroups);
  const userId = await requireUserId();
  try {
    const data = await consumePreparedRouteData(pronunciationGroupDetailDescriptor(userId, groupId));
    if (!data) throw redirect(ROUTES.pronunciationGroups);
    return data;
  } catch (error) {
    if (error instanceof Response) throw error;
    reportError('Failed to load pronunciation group detail route data', error);
    useToastStore.getState().showToast(TEXTS.loadingError, 'error');
    throw error;
  }
}

async function loadPractice() {
  const userId = await requireUserId();
  try {
    return await consumePreparedRouteData(practiceDeckDescriptor(userId));
  } catch (error) {
    if (error instanceof Response) throw error;
    reportError('Failed to load practice route data', error);
    useToastStore.getState().showToast(TEXTS.loadingError, 'error');
    throw error;
  }
}

async function loadBlockTraining({ request }: LoaderFunctionArgs) {
  const blockId = parsePositiveId(new URL(request.url).searchParams.get('blockId') ?? undefined);
  if (!blockId) throw redirect(ROUTES.practice);
  const userId = await requireUserId();
  try {
    const data = await consumePreparedRouteData(blockTrainingDescriptor(userId, blockId));
    if (!data.block) throw redirect(ROUTES.practice);
    return data;
  } catch (error) {
    if (error instanceof Response) throw error;
    reportError('Failed to load block training route data', error);
    useToastStore.getState().showToast(TEXTS.loadingError, 'error');
    throw error;
  }
}

export const router = createHashRouter([
  {
    path: ROUTES.home,
    Component: App,
    errorElement: <RouteDataError />,
    children: [
      { index: true, Component: Home },
      { path: ROUTES.privacyPolicy, Component: PrivacyPolicy },
      { path: ROUTES.guide, Component: Guide },
      {
        Component: ProtectedLayout,
        loader: protectedLoader,
        HydrateFallback: DelayedLoadingCircle,
        children: [
          { path: ROUTES.practice, loader: loadPractice, Component: Practice },
          {
            path: ROUTES.practiceBlockTraining,
            loader: loadBlockTraining,
            Component: BlockTrainingPractice,
          },
          {
            path: ROUTES.pronunciationPractice,
            loader: () =>
              loadProtectedData('pronunciation practice', pronunciationPracticeDescriptor),
            Component: PronunciationPractice,
          },
          {
            path: ROUTES.practiceOverview,
            loader: () => loadProtectedData('practice overview', practiceOverviewDescriptor),
            Component: PracticeOverview,
          },
          {
            path: ROUTES.overviews,
            loader: () => loadProtectedData('overviews', overviewAvailabilityDescriptor),
            Component: Overviews,
          },
          { path: ROUTES.profile, Component: Profile },
          {
            path: ROUTES.levels,
            loader: () => loadProtectedData('levels', levelsDescriptor),
            Component: Levels,
          },
          {
            path: ROUTES.topics,
            loader: () => loadProtectedData('topics', topicsDescriptor),
            Component: Topics,
          },
          { path: ROUTES.topicDetail, loader: loadTopicDetail, Component: TopicItems },
          {
            path: ROUTES.grammar,
            loader: () => loadProtectedData('grammar', grammarDescriptor),
            Component: Grammar,
          },
          {
            path: ROUTES.vocabulary,
            loader: () => loadProtectedData('vocabulary', vocabularyDescriptor),
            Component: Vocabulary,
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
