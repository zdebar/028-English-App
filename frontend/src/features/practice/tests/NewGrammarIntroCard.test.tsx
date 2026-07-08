import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    continuePractice: 'Continue',
  },
}));

vi.mock('@/features/grammar/GrammarDetailCard', () => ({
  default: ({ grammar, onClose }: any) => (
    <div>
      <div data-testid="grammar-detail">{grammar?.name}</div>
      <button type="button" onClick={onClose}>
        close grammar
      </button>
    </div>
  ),
}));

import NewGrammarIntroCard from '@/features/practice/NewGrammarIntroCard';

describe('NewGrammarIntroCard', () => {
  it('renders grammar detail and continue action', () => {
    render(
      <NewGrammarIntroCard
        grammar={{ id: 1, name: 'Articles' }}
        onClose={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    expect(screen.getByTestId('grammar-detail').textContent).toBe('Articles');
    expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy();
  });

  it('reserves space above the continue action for grammar detail bottom controls', () => {
    render(
      <NewGrammarIntroCard
        grammar={{ id: 1, name: 'Articles' }}
        onClose={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Continue' }).className).toContain(
      'mt-[calc(var(--height-button)+0.5rem)]',
    );
  });

  it('calls onContinue from the continue action', () => {
    const onContinue = vi.fn();

    render(
      <NewGrammarIntroCard
        grammar={{ id: 1, name: 'Articles' }}
        onClose={vi.fn()}
        onContinue={onContinue}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('passes close behavior through to grammar detail', () => {
    const onClose = vi.fn();

    render(
      <NewGrammarIntroCard
        grammar={{ id: 1, name: 'Articles' }}
        onClose={onClose}
        onContinue={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'close grammar' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
