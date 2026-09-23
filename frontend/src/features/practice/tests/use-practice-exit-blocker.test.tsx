import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { usePracticeExitBlocker } from '../hooks/use-practice-exit-blocker';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function PracticeRoute({ finishPractice }: Readonly<{ finishPractice: () => Promise<void> }>) {
  const navigate = useNavigate();
  usePracticeExitBlocker(finishPractice);

  return (
    <button type="button" onClick={() => navigate('/home')}>
      Leave practice
    </button>
  );
}

describe('usePracticeExitBlocker', () => {
  it('waits for practice persistence before changing routes', async () => {
    const persistence = deferred<void>();
    const finishPractice = vi.fn(() => persistence.promise);
    const router = createMemoryRouter(
      [
        {
          path: '/practice',
          element: <PracticeRoute finishPractice={finishPractice} />,
        },
        { path: '/home', element: <div>Home</div> },
      ],
      { initialEntries: ['/practice'] },
    );

    render(<RouterProvider router={router} />);
    fireEvent.click(screen.getByRole('button', { name: 'Leave practice' }));

    await waitFor(() => expect(finishPractice).toHaveBeenCalledOnce());
    expect(router.state.location.pathname).toBe('/practice');

    await act(async () => {
      persistence.resolve();
    });
    await waitFor(() => expect(router.state.location.pathname).toBe('/home'));
  });
});
