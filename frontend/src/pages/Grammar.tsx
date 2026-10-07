import GrammarOverview from '@/features/grammar/GrammarOverview';
import type { JSX } from 'react';
import { useLoaderData } from 'react-router-dom';
import type { GrammarTopicWithGroups } from '@/database/models/grammar-topics';

/**
 * Grammar page component.
 * @returns The rendered Grammar page component.
 */
export default function Grammar(): JSX.Element {
  const grammar = useLoaderData() as GrammarTopicWithGroups[];
  return <GrammarOverview initialGrammar={grammar} />;
}
