import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    close: 'Close',
    continuePractice: 'Continue',
  },
}));

import LessonTrainingOverviewCard from '@/features/practice/LessonTrainingOverviewCard';

function LocationProbe() {
  return <span data-testid="location">{useLocation().pathname}</span>;
}

describe('LessonTrainingOverviewCard', () => {
  it('omits empty notes, continues training, and uses the practice fallback', () => {
    const onContinue = vi.fn();
    render(
      <MemoryRouter initialEntries={['/practice/new-lesson']}>
        <LessonTrainingOverviewCard
          lesson={{ name: 'Lesson A' }}
          groupNote={null}
          onContinue={onContinue}
        />
        <LocationProbe />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onContinue).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByTitle(/Close/));
    expect(screen.getByTestId('location').textContent).toBe('/practice');
  });

});
