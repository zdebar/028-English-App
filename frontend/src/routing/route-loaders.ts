import { ROUTES } from '@/config/routes.config';
import AudioRecord from '@/database/models/audio-records';
import { waitForAuthReady } from '@/features/auth/auth-lifecycle';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { reportError } from '@/features/logging/logging-handler';
import { getItemAudioSources } from '@/features/audio/audio.utils';
import type { AudioCacheSnapshot } from '@/features/audio/use-audio-loader';
import { normalizeAudioInput } from '@/utils/audio.utils';
import {
  loadGrammarOverviewData,
  loadInitialTrainingData,
  loadOverviewAvailabilityData,
  loadPronunciationOverviewData,
  loadPronunciationGroupDetailData,
  loadReviewPracticeData,
  loadSoundGroupDetailData,
  loadSoundsOverviewData,
  loadTopicDetailData,
  loadTopicsOverviewData,
  loadVocabularyOverviewData,
} from '@/routing/route-data';
import { redirect, type LoaderFunctionArgs } from 'react-router-dom';

export async function protectedLoader(): Promise<null> {
  await requireUserId();
  return null;
}

export const loadGrammarReviewRoute = () =>
  loadProtectedData('grammar review', (userId) => loadReviewPracticeData(userId, 'grammar'));

export const loadVocabularyReviewRoute = () =>
  loadProtectedData('vocabulary review', (userId) => loadReviewPracticeData(userId, 'vocabulary'));

export async function loadInitialTrainingRoute(): Promise<AudioCacheSnapshot> {
  const loaded = await loadProtectedDetailData(
    'initial training',
    async (userId) => {
      const data = await loadInitialTrainingData(userId);
      const filenames = normalizeAudioInput(getItemAudioSources(data.items));
      const records = await readCachedInitialTrainingAudio(filenames);
      return {
        data,
        audioCacheSnapshot: { filenames, records },
      };
    },
    (result) => !result.data.lesson,
    ROUTES.home,
  );
  return loaded.audioCacheSnapshot;
}

export const loadOverviewsRoute = () =>
  loadProtectedData('overviews', loadOverviewAvailabilityData);

export const loadTopicsRoute = () =>
  loadProtectedData('topics', loadTopicsOverviewData);

export const loadGrammarOverviewRoute = () =>
  loadProtectedData('grammar', loadGrammarOverviewData);

export const loadVocabularyRoute = () =>
  loadProtectedData('vocabulary', loadVocabularyOverviewData);

export const loadSoundsRoute = () =>
  loadProtectedData('sound groups', loadSoundsOverviewData);

export const loadPronunciationOverviewRoute = () =>
  loadProtectedData('pronunciation overview', loadPronunciationOverviewData);

export function loadTopicDetailRoute({ params }: LoaderFunctionArgs): Promise<null> {
  const topicId = requirePositiveId(params.topicId, ROUTES.topics);
  return loadProtectedDetail(
    'topic detail',
    (userId) => loadTopicDetailData(userId, topicId),
    (data) => !data.topic,
    ROUTES.topics,
  );
}

export function loadSoundGroupDetailRoute({ params }: LoaderFunctionArgs): Promise<null> {
  const groupId = requirePositiveId(params.groupId, ROUTES.sounds);
  return loadProtectedDetail(
    'sound group detail',
    (userId) => loadSoundGroupDetailData(userId, groupId),
    (data) => !data,
    ROUTES.sounds,
  );
}

export function loadPronunciationGroupDetailRoute({ params }: LoaderFunctionArgs): Promise<null> {
  const groupId = requirePositiveId(params.groupId, ROUTES.pronunciationGroups);
  return loadProtectedDetail(
    'pronunciation group detail',
    (userId) => loadPronunciationGroupDetailData(userId, groupId),
    (data) => !data,
    ROUTES.pronunciationGroups,
  );
}

async function loadProtectedDetail<T>(
  routeName: string,
  loadData: (userId: string) => Promise<T>,
  isMissing: (data: T) => boolean,
  fallbackRoute: string,
): Promise<null> {
  await loadProtectedDetailData(routeName, loadData, isMissing, fallbackRoute);
  return null;
}

async function loadProtectedDetailData<T>(
  routeName: string,
  loadData: (userId: string) => Promise<T>,
  isMissing: (data: T) => boolean,
  fallbackRoute: string,
): Promise<T> {
  const userId = await requireUserId();
  try {
    const data = await loadData(userId);
    if (isMissing(data)) throw redirect(fallbackRoute);
    return data;
  } catch (error) {
    if (error instanceof Response) throw error;
    reportRouteLoaderError(routeName, error);
    throw error;
  }
}

async function readCachedInitialTrainingAudio(
  filenames: readonly string[],
): Promise<AudioCacheSnapshot['records']> {
  try {
    return await AudioRecord.getCachedByFilenames(filenames);
  } catch (error) {
    reportError('Initial Training Audio Cache Error', error);
    return filenames.map(() => undefined);
  }
}

async function loadProtectedData<T>(
  routeName: string,
  loadData: (userId: string) => Promise<T>,
): Promise<T> {
  const userId = await requireUserId();
  try {
    return await loadData(userId);
  } catch (error) {
    reportRouteLoaderError(routeName, error);
    throw error;
  }
}

async function requireUserId(): Promise<string> {
  await waitForAuthReady();
  const userId = useAuthStore.getState().userId;
  if (!userId) throw redirect(ROUTES.home);
  return userId;
}

function requirePositiveId(value: string | undefined, fallbackRoute: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw redirect(fallbackRoute);
  return id;
}

function reportRouteLoaderError(routeName: string, error: unknown): void {
  reportError(`Failed to load ${routeName} route data`, error);
}
