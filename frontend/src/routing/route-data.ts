import GrammarGroup from '@/database/models/grammar-groups';
import Levels from '@/database/models/levels';
import PronunciationGroup from '@/database/models/pronunciation-groups';
import Block from '@/database/models/blocks';
import PracticeSession from '@/database/models/practice-sessions';
import UserItem from '@/database/models/user-items';
import UserItemProgressHistory from '@/database/models/user-item-progress-history';
import Topic from '@/database/models/topics';
import { routeDataKey, type RouteDataDescriptor } from './route-data-handoff';
import {
  loadPronunciationPracticeDeck,
  loadReviewSessionDeck,
  resolvePracticeEntries,
  resolvePracticeGrammarContext,
} from '@/database/utils/practice-content.utils';
import type { GrammarChunkWithExamples } from '@/database/models/grammar-chunks';
import type { BlockType, GrammarGroupType } from '@/types/generic.types';
import type { PracticeSessionType } from '@/types/practice-session.types';
import type { ResolvedPracticeEntry, UserItemLocal } from '@/types/user-item.types';

export type InitialTrainingData = Readonly<{
  block: BlockType | null;
  items: UserItemLocal[];
  entries: Array<ResolvedPracticeEntry<UserItemLocal>>;
  grammar: GrammarChunkWithExamples | null;
  grammarGroup: GrammarGroupType | null;
}>;

function getLocalDate(): string {
  return new Date(Date.now()).toLocaleDateString('en-CA');
}

function emptyInitialTrainingData(): InitialTrainingData {
  return { block: null, items: [], entries: [], grammar: null, grammarGroup: null };
}

function getSavedSessionItemIds(activeSession: PracticeSessionType | null): number[] {
  if (!activeSession) return [];
  return [
    ...activeSession.current_queue_item_ids,
    ...activeSession.retry_queue_item_ids,
    ...activeSession.completed_item_ids,
  ];
}

async function getInitialTrainingSelection(
  userId: string,
  activeSession: PracticeSessionType | null,
) {
  if (activeSession) {
    const savedItemIds = getSavedSessionItemIds(activeSession);
    return {
      blockId: activeSession.block_id,
      items: await UserItem.getByItemIds(userId, savedItemIds),
    };
  }
  return UserItem.getNextInitialTrainingSelection(userId);
}

async function loadInitialTrainingData(userId: string): Promise<InitialTrainingData> {
  const activeSession = await PracticeSession.reconcileActive(userId);
  if (activeSession?.mode === 'review') return emptyInitialTrainingData();

  const selection = await getInitialTrainingSelection(userId, activeSession);
  if (!selection) return emptyInitialTrainingData();

  const block = selection.blockId == null ? null : await Block.getById(selection.blockId);
  const items = selection.items;
  const hasInvalidSelection = items.length === 0 || (selection.blockId != null && !block);
  if (hasInvalidSelection) return emptyInitialTrainingData();

  const [entries, grammarContext] = await Promise.all([
    resolvePracticeEntries(userId, items),
    resolvePracticeGrammarContext(userId, block?.grammar_chunk_id ?? null),
  ]);
  return { block, items, entries, ...grammarContext };
}

export function overviewAvailabilityDescriptor(userId: string) {
  return {
    key: routeDataKey('overviews', userId),
    load: async () => {
      const [grammar, topics, vocabulary] = await Promise.all([
        UserItem.hasStartedGrammar(userId),
        Topic.getStartedByUserId(userId),
        UserItem.getStartedVocabulary(userId),
      ]);
      return {
        grammar,
        topics: topics.length > 0,
        vocabulary: vocabulary.length > 0,
      };
    },
  } satisfies RouteDataDescriptor<unknown>;
}

export function practiceOverviewDescriptor(userId: string) {
  return {
    key: routeDataKey('practice-overview', userId),
    load: () => UserItemProgressHistory.getByUserId(userId),
  };
}

export function levelsDescriptor(userId: string) {
  return {
    key: routeDataKey('levels', userId),
    load: () => Levels.getOverview(userId, getLocalDate()),
  };
}

export function grammarDescriptor(userId: string) {
  return {
    key: routeDataKey('grammar', userId),
    load: () => GrammarGroup.getStarted(userId),
  };
}

export function topicsDescriptor(userId: string) {
  return {
    key: routeDataKey('topics', userId),
    load: () => Topic.getStartedByUserId(userId),
  };
}

export function topicDetailDescriptor(userId: string, topicId: number) {
  return {
    key: routeDataKey('topic-detail', userId, topicId),
    load: async () => {
      const [topic, items] = await Promise.all([
        Topic.getById(topicId),
        UserItem.getStartedByTopicId(userId, topicId),
      ]);
      return { topic, items };
    },
  };
}

export function vocabularyDescriptor(userId: string) {
  return {
    key: routeDataKey('vocabulary', userId),
    load: () => UserItem.getStartedVocabulary(userId),
  };
}

export function pronunciationGroupDetailDescriptor(userId: string, groupId: number) {
  return {
    key: routeDataKey('pronunciation-group-detail', userId, groupId),
    load: () => PronunciationGroup.getDetail(userId, groupId),
  };
}

export function practiceDeckDescriptor(userId: string) {
  return {
    key: routeDataKey('practice', userId),
    load: async () => (await loadReviewSessionDeck(userId)).entries,
  };
}

export function pronunciationPracticeDescriptor(userId: string) {
  return {
    key: routeDataKey('pronunciation-practice', userId),
    load: () => loadPronunciationPracticeDeck(userId),
  };
}

export function initialTrainingDescriptor(userId: string) {
  return {
    key: routeDataKey('initial-training', userId),
    load: () => loadInitialTrainingData(userId),
  };
}

export type OverviewAvailabilityData = Awaited<
  ReturnType<ReturnType<typeof overviewAvailabilityDescriptor>['load']>
>;
export type TopicDetailData = Awaited<ReturnType<ReturnType<typeof topicDetailDescriptor>['load']>>;
