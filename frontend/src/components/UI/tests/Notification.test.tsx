import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Notification from '@/components/UI/Notification';

describe('Notification', () => {
  it('renders passed children', () => {
    render(<Notification>Hello</Notification>);

    const notification = screen.getByText('Hello');

    expect(notification.className).toContain('font-headings');
    expect(notification.className).toContain('text-lg');
    expect(notification.className).not.toContain('color-info');
  });

  it('merges base and custom classes', () => {
    const { container } = render(<Notification className="color-info">Info</Notification>);

    const element = container.firstElementChild;
    expect(element?.className).toContain('font-headings');
    expect(element?.className).toContain('color-info');
  });
});
