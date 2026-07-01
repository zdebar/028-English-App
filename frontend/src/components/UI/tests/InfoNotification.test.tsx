import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import InfoNotification from '@/components/UI/InfoNotification';

describe('InfoNotification', () => {
  it('adds info color and keeps custom classes', () => {
    const { container } = render(<InfoNotification className="pt-4">Info</InfoNotification>);

    const element = container.firstElementChild;
    expect(element?.textContent).toBe('Info');
    expect(element?.className).toContain('font-headings');
    expect(element?.className).toContain('color-info');
    expect(element?.className).toContain('pt-4');
  });
});
