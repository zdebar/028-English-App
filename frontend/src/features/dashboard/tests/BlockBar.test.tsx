import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import BlockBar from '@/features/dashboard/BlockBar';

describe('BlockBar', () => {
  it('renders labels and progressbar with accessible values', () => {
    render(
      <BlockBar
        levelName="A1"
        lessonName="Lesson 1"
        previousCount={2}
        todayCount={3}
        lessonCount={10}
        maxCount={20}
        divisions={10}
      />,
    );

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar.getAttribute('aria-valuenow')).toBe('5');
    expect(progressbar.getAttribute('aria-valuemin')).toBe('0');
    expect(progressbar.getAttribute('aria-valuemax')).toBe('10');
    expect(screen.getByText('A1 Lesson 1')).toBeTruthy();
    expect(screen.getByText('+ 3')).toBeTruthy();
  });

  it('applies expected width ratio and renders division lines', () => {
    const { container } = render(
      <BlockBar
        previousCount={1}
        todayCount={1}
        lessonName="L"
        levelName="B"
        lessonCount={10}
        maxCount={20}
        divisions={10}
      />,
    );

    const progressbar = screen.getByRole('progressbar');
    const barContainer = progressbar.parentElement as HTMLElement;

    expect(barContainer.style.width).toBe('50%');
    expect(container.querySelectorAll('.border-divisions').length).toBe(5);
  });

  it('handles zero lessonCount safely without crashing', () => {
    const { container } = render(
      <BlockBar previousCount={0} todayCount={0} lessonName="L" levelName="B" lessonCount={0} />,
    );

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeTruthy();
    expect(container.querySelectorAll('.border-divisions').length).toBeGreaterThan(0);
  });
});
