import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    translationDirection: 'Translation direction',
    vocabularyCzechOption: 'Czech',
    vocabularyEnglishOption: 'English',
  },
}));

import DirectionToggle from '@/features/vocabulary/DirectionToggle';

describe('DirectionToggle', () => {
  it('announces the current display field and toggles to the other field', () => {
    const onChange = vi.fn();
    render(<DirectionToggle value="czech" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Translation direction: Czech' }));

    expect(onChange).toHaveBeenCalledWith('english');
  });
});
