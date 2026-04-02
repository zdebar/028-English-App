import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getGrammarByIdMock = vi.fn();
const showToastMock = vi.fn();
const errorHandlerMock = vi.fn();

vi.mock('@/database/models/grammar', () => ({
  default: {
    getById: (...args: unknown[]) => getGrammarByIdMock(...args),
  },
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof showToastMock }) => unknown) =>
    selector({ showToast: showToastMock }),
}));

vi.mock('@/features/logging/error-handler', () => ({
  errorHandler: (...args: unknown[]) => errorHandlerMock(...args),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    loadingError: 'Loading error',
  },
}));

import { useGrammar } from '@/features/practice/hooks/use-grammar';

describe('useGrammar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with hidden grammar and null data', () => {
    const { result } = renderHook(() => useGrammar());

    expect(result.current.grammarVisible).toBe(false);
    expect(result.current.grammarData).toBeNull();
  });

  it('ignores non-number grammarId', async () => {
    const { result } = renderHook(() => useGrammar());

    await act(async () => {
      await result.current.handleGrammar(null);
    });

    expect(getGrammarByIdMock).not.toHaveBeenCalled();
    expect(result.current.grammarVisible).toBe(false);
  });

  it('loads grammar and opens card on success', async () => {
    getGrammarByIdMock.mockResolvedValue({ id: 10, name: 'Articles', note: 'Use a/an/the' });

    const { result } = renderHook(() => useGrammar());

    await act(async () => {
      await result.current.handleGrammar(10);
    });

    await waitFor(() => {
      expect(getGrammarByIdMock).toHaveBeenCalledWith(10);
      expect(result.current.grammarVisible).toBe(true);
      expect(result.current.grammarData).toEqual({
        id: 10,
        name: 'Articles',
        note: 'Use a/an/the',
      });
    });
  });

  it('shows error toast and logs when load fails', async () => {
    getGrammarByIdMock.mockRejectedValue(new Error('db fail'));

    const { result } = renderHook(() => useGrammar());

    await act(async () => {
      await result.current.handleGrammar(3);
    });

    expect(errorHandlerMock).toHaveBeenCalledWith('Error fetching grammar:', expect.any(Error));
    expect(showToastMock).toHaveBeenCalledWith('Loading error', 'error');
    expect(result.current.grammarVisible).toBe(false);
  });

  it('closeGrammar hides visible grammar card', async () => {
    getGrammarByIdMock.mockResolvedValue({ id: 5, name: 'Tenses', note: '' });

    const { result } = renderHook(() => useGrammar());

    await act(async () => {
      await result.current.handleGrammar(5);
    });

    act(() => {
      result.current.closeGrammar();
    });

    expect(result.current.grammarVisible).toBe(false);
  });
});
