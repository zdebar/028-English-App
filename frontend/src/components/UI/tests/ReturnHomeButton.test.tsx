import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    tooltipHome: 'Domů',
  },
}));

import ReturnHomeButton from '@/components/UI/buttons/ReturnHomeButton';

describe('ReturnHomeButton', () => {
  it('renders default home text and navigates home', () => {
    render(<ReturnHomeButton />);

    const button = screen.getByRole('button', { name: 'Domů' });
    expect(button.className).toContain('h-button');
    expect(button.className).toContain('mt-2');

    fireEvent.click(button);

    expect(mocks.navigate).toHaveBeenCalledWith('/');
  });
});
