import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    close: 'Close',
    continuePractice: 'Continue',
  },
}));

import BlockTrainingOverviewCard from '@/features/practice/BlockTrainingOverviewCard';

describe('BlockTrainingOverviewCard', () => {
  it('renders the block and grammar content in one overview', () => {
    render(
      <MemoryRouter>
        <BlockTrainingOverviewCard
          block={{ name: 'Block A', note: '<p>Block note</p>' }}
          grammar={{ id: 1, name: 'Articles', note: '<p>Grammar note</p>' }}
          onContinue={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Block A' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Articles' })).toBeTruthy();
    expect(screen.getByText('Block note')).toBeTruthy();
    expect(screen.getByText('Grammar note')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy();
  });

  it('omits empty notes and calls the continue action without rendering a close action', () => {
    const onContinue = vi.fn();
    render(
      <MemoryRouter>
        <BlockTrainingOverviewCard
          block={{ name: 'Block A', note: null }}
          grammar={{ id: 1, name: 'Articles', note: null }}
          onContinue={onContinue}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Block note')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onContinue).toHaveBeenCalledOnce();
    expect(screen.queryByTitle(/Close/)).toBeNull();
  });

  it('shows only the block explanation when no grammar is attached', () => {
    render(
      <MemoryRouter>
        <BlockTrainingOverviewCard
          block={{ name: 'Pronouns', note: '<p>Block explanation</p>' }}
          grammar={null}
          onContinue={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Pronouns' })).toBeTruthy();
    expect(screen.getByText('Block explanation')).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
  });
});
