import type { ReviewDirection } from '@/types/practice.types';
import type { UserItemLocal } from '@/types/user-item.types';

type DirectionSettings = Pick<UserItemLocal, 'is_cz_to_en_enabled' | 'is_en_to_cz_enabled'>;

/** Lists the directions available on at least one item. */
export function getEnabledReviewDirections(
  items: readonly DirectionSettings[],
): readonly ReviewDirection[] {
  const directions: readonly ReviewDirection[] = ['cz_to_en', 'en_to_cz'];
  return directions.filter((direction) =>
    items.some((item) => isDirectionEnabled(item, direction)),
  );
}

export function isDirectionEnabled(
  item: DirectionSettings,
  direction: ReviewDirection,
): boolean {
  if (direction === 'cz_to_en') return item.is_cz_to_en_enabled !== false;
  return item.is_en_to_cz_enabled !== false;
}
