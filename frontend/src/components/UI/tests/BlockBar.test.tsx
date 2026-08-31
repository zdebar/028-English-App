import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    levelName: 'Level',
    lessonName: 'Lesson',
    startedTodayHint: 'Started today',
  },
  ARIA_TEXTS: {
    lessonProgressBar: 'Lesson progress bar',
  },
}));

import BlockBar from '@/components/UI/BlockBar';

describe('BlockBar', () => {
  it('renders lesson label, daily delta, and progressbar aria values', () => {
    render(
      <BlockBar
        currentProgress={25}
        dailyProgressChange={5}
        lessonName="To Be"
        lessonNumber={1}
        maximumProgress={100}
        widthBase={100}
      />,
    );

    expect(screen.getByText('To Be')).toBeTruthy();
    expect(screen.getByText('+5')).toBeTruthy();

    const progressBar = screen.getByRole('progressbar', {
      name: 'Lesson progress bar',
    });
    expect(progressBar.getAttribute('aria-valuenow')).toBe('25');
    expect(progressBar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('renders zero daily delta', () => {
    render(
      <BlockBar
        currentProgress={20}
        dailyProgressChange={0}
        lessonName="To Be"
        lessonNumber={1}
        maximumProgress={100}
        widthBase={100}
      />,
    );

    expect(screen.getByText('0')).toBeTruthy();
  });

  it('calculates bar widths and division markers from lesson and base values', () => {
    const { container } = render(
      <BlockBar
        currentProgress={40}
        dailyProgressChange={15}
        lessonName="To Be"
        lessonNumber={1}
        maximumProgress={80}
        widthBase={100}
      />,
    );

    const wrapper = container.querySelector('div.relative.h-full.w-full') as HTMLElement;
    expect(wrapper.style.width).toBe('80%');

    const totalProgress = container.querySelector('.bg-new-progress-light') as HTMLElement;
    const previousProgress = container.querySelector('.bg-old-progress-light') as HTMLElement;

    expect(totalProgress.style.width).toBe('50%');
    expect(previousProgress.style.width).toBe('31.25%');
  });
});
