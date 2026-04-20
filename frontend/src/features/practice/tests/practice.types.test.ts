import { describe, expect, it } from 'vitest';

import type { PracticeButtonProps } from '@/features/practice/practice.types';

describe('practice.types', () => {
  it('accepts PracticeButtonProps shape', () => {
    const props: PracticeButtonProps = {
      onClick: () => {},
      disabled: false,
      children: 'child',
    };

    expect(props.disabled).toBe(false);
    expect(typeof props.onClick).toBe('function');
  });
});
