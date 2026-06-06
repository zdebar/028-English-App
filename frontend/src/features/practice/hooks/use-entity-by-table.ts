import { useState, useCallback } from 'react';
import { TableName } from '@/types/table.types';
import Grammar from '@/database/models/grammar';
import Blocks from '@/database/models/blocks';
import Notes from '@/database/models/notes';
import { reportError } from '@/features/logging/monitoring-handler';
import { TEXTS } from '@/locales/cs';
import { useToastStore } from '@/features/toast/use-toast-store';

type EntityWithNote = {
  id: number;
  name: string;
  note?: string;
};

type SupportedTableName =
  | typeof TableName.Grammar
  | typeof TableName.Blocks
  | typeof TableName.Notes;

const byIdLoaders: Record<SupportedTableName, (id: number) => Promise<EntityWithNote | null>> = {
  [TableName.Grammar]: async (id) => await Grammar.getById(id),
  [TableName.Blocks]: async (id) => await Blocks.getById(id),
  [TableName.Notes]: async (id) => await Notes.getById(id),
};

/**
 * Generic hook for opening an entity detail card by table + id.
 */
export function useEntityByTable(tableName: SupportedTableName) {
  const [isVisible, setIsVisible] = useState(false);
  const [entityData, setEntityData] = useState<EntityWithNote | null>(null);
  const showToast = useToastStore((state) => state.showToast);

  const openEntityById = useCallback(
    async (entityId: number | null) => {
      if (typeof entityId !== 'number') return;

      try {
        const loadById = byIdLoaders[tableName];
        const entity = await loadById(entityId);
        if (!entity) return;

        setEntityData(entity);
        setIsVisible(true);
      } catch (error) {
        reportError(`Error fetching ${tableName}:`, error);
        showToast(TEXTS.loadingError, 'error');
      }
    },
    [showToast, tableName],
  );

  const closeEntity = useCallback(() => {
    setIsVisible(false);
  }, []);

  return {
    isVisible,
    entityData,
    openEntityById,
    closeEntity,
  };
}