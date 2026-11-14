import { ROUTES } from '@/config/routes.config';
import AudioRecord from '@/database/models/audio-records';
import { ensureDataPackage } from '@/database/state/data-store';
import { waitForAuthReady } from '@/features/auth/auth-lifecycle';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { reportError } from '@/features/logging/logging-handler';
import { getItemAudioSources } from '@/features/audio/audio.utils';
import type { AudioCacheSnapshot } from '@/features/audio/use-audio-loader';
import { normalizeAudioInput } from '@/utils/audio.utils';
import {
  loadInitialTrainingData,
  loadOverviewAvailabilityData,
  loadPronunciationOverviewData,
  loadPronunciationGroupDetailData,
  loadReviewPracticeData,
  loadSoundGroupDetailData,
  loadSoundsOverviewData,
  loadTopicDetailData,
  loadTopicsOverviewData,
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
      return {
        data,
        audioCacheSnapshot: await readCachedAudioSnapshot(data.items, 'Initial Training'),
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

export const loadGrammarOverviewRoute = () => loadProtectedData('grammar', async (userId) => {
  const grammar = await ensureDataPackage(userId, { kind: 'grammar-overview' });
  const items = grammar.flatMap((topic) =>
    topic.groups.flatMap((group) => group.chunks.flatMap((chunk) => chunk.items)),
  );
  return readCachedAudioSnapshot(items, 'Grammar');
});

export const loadVocabularyRoute = () => loadProtectedData('vocabulary', async (userId) => {
  const vocabulary = await ensureDataPackage(userId, { kind: 'vocabulary' });
  return readCachedAudioSnapshot(vocabulary.items, 'Vocabulary');
});

export const loadSoundsRoute = () =>
  loadProtectedData('sound groups', loadSoundsOverviewData);

export const loadPronunciationOverviewRoute = () =>
  loadProtectedData('pronunciation overview', loadPronunciationOverviewData);

export async function loadTopicDetailRoute(
  { params }: LoaderFunctionArgs,
): Promise<AudioCacheSnapshot> {
  const topicId = requirePositiveId(params.topicId, ROUTES.topics);
  const result = await loadProtectedDetailData(
    'topic detail',
    async (userId) => {
      const data = await loadTopicDetailData(userId, topicId);
      return {
        data,
        audioCacheSnapshot: await readCachedAudioSnapshot(data.items, 'Topic'),
      };
    },
    (result) => !result.data.topic,
    ROUTES.topics,
  );
  return result.audioCacheSnapshot;
}

export async function loadSoundGroupDetailRoute(
  { params }: LoaderFunctionArgs,
): Promise<AudioCacheSnapshot> {
  const groupId = requirePositiveId(params.groupId, ROUTES.sounds);
  const result = await loadProtectedDetailData(
    'sound group detail',
    async (userId) => {
      const data = await loadSoundGroupDetailData(userId, groupId);
      return {
        data,
        audioCacheSnapshot: await readCachedAudioSnapshot(data?.items ?? [], 'Sound Group'),
      };
    },
    (loaded) => !loaded.data,
    ROUTES.sounds,
  );
  return result.audioCacheSnapshot;
}

export async function loadPronunciationGroupDetailRoute(
  { params }: LoaderFunctionArgs,
): Promise<AudioCacheSnapshot> {
  const groupId = requirePositiveId(params.groupId, ROUTES.pronunciationGroups);
  const result = await loadProtectedDetailData(
    'pronunciation group detail',
    async (userId) => {
      const data = await loadPronunciationGroupDetailData(userId, groupId);
      return {
        data,
        audioCacheSnapshot: await readCachedAudioSnapshot(data?.items ?? [], 'Pronunciation Group'),
      };
    },
    (loaded) => !loaded.data,
    ROUTES.pronunciationGroups,
  );
  return result.audioCacheSnapshot;
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

async function readCachedAudioSnapshot(
  items: Parameters<typeof getItemAudioSources>[0],
  context: string,
): Promise<AudioCacheSnapshot> {
  const filenames = normalizeAudioInput(getItemAudioSources(items));
  let records: AudioCacheSnapshot['records'];
  try {
    records = await AudioRecord.getCachedByFilenames(filenames);
  } catch (error) {
    reportError(`${context} Audio Cache Error`, error);
    records = filenames.map(() => undefined);
  }

  return { filenames, records };
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
