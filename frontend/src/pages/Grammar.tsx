import GrammarOverview from '@/features/grammar/GrammarOverview';
import type { JSX } from 'react';
import { useLoaderData } from 'react-router-dom';
import type { GrammarOverviewEntry } from '@/database/models/grammar-groups';

/**
 * Grammar page component.
 * @returns The rendered Grammar page component.
 */
export default function Grammar(): JSX.Element {
  const grammar = useLoaderData() as GrammarOverviewEntry[];
  return <GrammarOverview initialGrammar={grammar} />;
}
