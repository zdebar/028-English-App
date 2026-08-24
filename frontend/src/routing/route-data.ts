import config from '@/config/config';
import GrammarGroup from '@/database/models/grammar-groups';
import Levels from '@/database/models/levels';
import PronunciationGroup from '@/database/models/pronunciation-groups';
import UserBlock from '@/database/models/user-blocks';
import UserItem from '@/database/models/user-items';
import UserScore from '@/database/models/user-scores';
import Topic from '@/database/models/topics';
import { routeDataKey, type RouteDataDescriptor } from './route-data-handoff';
import {
  loadReviewDeck,
  loadPronunciationPracticeDeck,
  resolvePracticeEntries,
  resolvePracticeGrammarContext,
} from '@/database/utils/practice-content.utils';

function getLocalDate(): string {
  return new Date(Date.now()).toLocaleDateString('en-CA');
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
    load: () => UserScore.getByUserId(userId),
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
    load: () => loadReviewDeck(userId, config.lesson.deckSize),
  };
}

export function pronunciationPracticeDescriptor(userId: string) {
  return {
    key: routeDataKey('pronunciation-practice', userId),
    load: () => loadPronunciationPracticeDeck(userId),
  };
}

export function blockTrainingDescriptor(userId: string, blockId: number) {
  return {
    key: routeDataKey('block-training', userId, blockId),
    load: async () => {
      const block = await UserBlock.getByBlockId(userId, blockId);
      if (
        !block ||
        !block.is_practice_block ||
        block.started_at !== config.database.nullReplacementDate
      ) {
        return { block: null, items: [], entries: [], grammar: null, grammarGroup: null };
      }

      const items = await UserItem.getByBlockId(userId, block.block_id);
      if (items.length === 0) {
        return { block: null, items: [], entries: [], grammar: null, grammarGroup: null };
      }
      const [entries, grammarContext] = await Promise.all([
        resolvePracticeEntries(userId, items),
        resolvePracticeGrammarContext(userId, block.grammar_chunk_id),
      ]);
      return { block, items, entries, ...grammarContext };
    },
  };
}

export type OverviewAvailabilityData = Awaited<
  ReturnType<ReturnType<typeof overviewAvailabilityDescriptor>['load']>
>;
export type TopicDetailData = Awaited<ReturnType<ReturnType<typeof topicDetailDescriptor>['load']>>;
export type BlockTrainingData = Awaited<
  ReturnType<ReturnType<typeof blockTrainingDescriptor>['load']>
>;
