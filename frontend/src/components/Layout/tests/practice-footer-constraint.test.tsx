import {
  PracticeFooterConstraintContext,
  usePracticeFooterConstraint,
} from '@/components/Layout/practice-footer-constraint';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

function ActivePracticeSession() {
  usePracticeFooterConstraint();
  return null;
}

describe('usePracticeFooterConstraint', () => {
  it('activates the constraint only while the practice session is mounted', () => {
    const setPracticeSessionActive = vi.fn();
    const { unmount } = render(
      <PracticeFooterConstraintContext.Provider value={setPracticeSessionActive}>
        <ActivePracticeSession />
      </PracticeFooterConstraintContext.Provider>,
    );

    expect(setPracticeSessionActive).toHaveBeenCalledWith(true);

    unmount();

    expect(setPracticeSessionActive).toHaveBeenLastCalledWith(false);
  });
});
