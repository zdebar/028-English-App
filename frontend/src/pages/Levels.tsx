import LevelsOverview from '@/features/levels/LevelsOverview';
import type { JSX } from 'react';
import { useLoaderData } from 'react-router-dom';
import type { LevelOverviewType } from '@/types/generic.types';

/**
 * Renders the Levels page component.
 * @returns A JSX element representing the levels overview.
 */
export default function Levels(): JSX.Element {
  const levels = useLoaderData() as LevelOverviewType[];
  return <LevelsOverview initialLevels={levels} />;
}
