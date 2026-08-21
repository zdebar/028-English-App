import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    close: 'Close',
    continuePractice: 'Continue',
  },
}));

import BlockTrainingOverviewCard from '@/features/practice/BlockTrainingOverviewCard';

function LocationProbe() {
  return <span data-testid="location">{useLocation().pathname}</span>;
}

describe('BlockTrainingOverviewCard', () => {
  it('renders the block title and both notes when grammar is attached', () => {
    render(
      <MemoryRouter>
        <BlockTrainingOverviewCard
          block={{ name: 'Block A', note: '<p>Block note</p>' }}
          grammar={{ kind: 'chunk', id: 1, name: 'Articles', note: '<p>Grammar note</p>' }}
          grammarGroup={{ note: '<p>Group note</p>' }}
          onContinue={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect((screen.getByRole('button', { name: 'Block A' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(screen.queryByRole('button', { name: 'Articles' })).toBeNull();
    const groupNote = screen.getByText('Group note');
    const grammarNote = screen.getByText('Grammar note');
    const blockNote = screen.getByText('Block note');
    const content = groupNote.parentElement?.parentElement?.textContent ?? '';
    expect(content.indexOf('Group note')).toBeLessThan(content.indexOf('Grammar note'));
    expect(content.indexOf('Grammar note')).toBeLessThan(content.indexOf('Block note'));
    expect(grammarNote).toBeTruthy();
    expect(blockNote).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy();
  });

  it('omits empty notes, continues training, and uses the practice fallback', () => {
    const onContinue = vi.fn();
    render(
      <MemoryRouter initialEntries={['/practice/block-training']}>
        <BlockTrainingOverviewCard
          block={{ name: 'Block A', note: null }}
          grammar={{ kind: 'chunk', id: 1, name: 'Articles', note: null }}
          grammarGroup={{ note: null }}
          onContinue={onContinue}
        />
        <LocationProbe />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Block note')).toBeNull();
    expect(screen.queryByText('Group note')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onContinue).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByTitle(/Close/));
    expect(screen.getByTestId('location').textContent).toBe('/practice');
  });

  it('shows only the block explanation when no grammar is attached', () => {
    render(
      <MemoryRouter>
        <BlockTrainingOverviewCard
          block={{ name: 'Pronouns', note: '<p>Block explanation</p>' }}
          grammar={null}
          grammarGroup={null}
          onContinue={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect((screen.getByRole('button', { name: 'Pronouns' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(screen.getByText('Block explanation')).toBeTruthy();
    expect(screen.queryByRole('heading')).toBeNull();
  });
});
