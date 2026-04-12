import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useHint } from '../hooks/use-hint';

describe('useHint', () => {
  it('starts with index 0 and no visible hints', () => {
    const { result } = renderHook(() => useHint('ahoj', 'hello'));

    expect(result.current.index).toBe(0);
    expect(result.current.englishHinted).toBe('\u00A0');
    expect(result.current.czechHinted).toBe('\u00A0');
  });

  it('reveals english first, then czech', () => {
    const { result } = renderHook(() => useHint('ahoj', 'hello'));

    act(() => {
      result.current.plusHint();
    });
    expect(result.current.index).toBe(1);
    expect(result.current.englishHinted).toBe('h');
    expect(result.current.czechHinted).toBe('\u00A0');

    act(() => {
      result.current.plusHint();
      result.current.plusHint();
      result.current.plusHint();
      result.current.plusHint();
    });
    expect(result.current.index).toBe(5);
    expect(result.current.englishHinted).toBe('hello');
    expect(result.current.czechHinted).toBe('\u00A0');

    act(() => {
      result.current.plusHint();
      result.current.plusHint();
    });
    expect(result.current.index).toBe(7);
    expect(result.current.czechHinted).toBe('ah');
  });

  it('handles missing english by revealing czech after first increment', () => {
    const { result } = renderHook(() => useHint('ahoj', ''));

    expect(result.current.englishHinted).toBe('\u00A0');
    expect(result.current.czechHinted).toBe('\u00A0');

    act(() => {
      result.current.plusHint();
    });

    expect(result.current.index).toBe(1);
    expect(result.current.czechHinted).toBe('a');
  });

  it('resetHint resets index and hidden output', () => {
    const { result } = renderHook(() => useHint('ahoj', 'hello'));

    act(() => {
      result.current.plusHint();
      result.current.plusHint();
    });

    expect(result.current.index).toBe(2);
    expect(result.current.englishHinted).toBe('he');

    act(() => {
      result.current.resetHint();
    });

    expect(result.current.index).toBe(0);
    expect(result.current.englishHinted).toBe('\u00A0');
    expect(result.current.czechHinted).toBe('\u00A0');
  });
});
