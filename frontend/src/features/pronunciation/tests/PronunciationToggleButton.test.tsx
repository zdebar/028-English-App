import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  selected: false,
  toggle: vi.fn(),
  showToast: vi.fn(),
  reportError: vi.fn(),
}));

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: () => mocks.selected,
}));

vi.mock('@/database/models/user-items', () => ({
  default: {
    getPronunciationSelection: vi.fn(),
    togglePronunciationPractice: (...args: unknown[]) => mocks.toggle(...args),
  },
}));

vi.mock('@/features/toast/use-toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mocks.showToast }) => unknown) =>
    selector({ showToast: mocks.showToast }),
}));

vi.mock('@/features/logging/monitoring-handler', () => ({
  reportError: (...args: unknown[]) => mocks.reportError(...args),
}));

vi.mock('@/features/help/HelpText', () => ({
  default: ({ children, className }: any) => (
    <span data-testid="pronunciation-help" className={className}>
      {children}
    </span>
  ),
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    pronunciationVocabularyOnly: 'Vocabulary only',
    pronunciationAudioRequired: 'Audio required',
    removeFromPronunciation: 'Remove',
    addToPronunciation: 'Add',
    pronunciationToggleAria: 'Pronunciation toggle',
    pronunciationToggleError: 'Toggle failed',
    addToPronunciationHelp: 'přidat do výslovnosti',
    removeFromPronunciationHelp: 'odebrat z výslovnosti',
  },
}));

import PronunciationToggleButton from '../PronunciationToggleButton';

describe('PronunciationToggleButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selected = false;
    mocks.toggle.mockResolvedValue(true);
  });

  it('toggles an eligible vocabulary item and exposes pressed state', async () => {
    mocks.selected = true;
    mocks.toggle.mockResolvedValue(false);
    const onSelectionChange = vi.fn();
    render(
      <PronunciationToggleButton
        userId="u1"
        item={{ item_id: 2, is_vocabulary: 1, audio: 'two.opus' } as any}
        onSelectionChange={onSelectionChange}
      />,
    );

    const button = screen.getByRole('button', { name: 'Pronunciation toggle' });
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.className).toContain('pronunciation-control-emphasis');

    fireEvent.click(button);
    await waitFor(() => {
      expect(mocks.toggle).toHaveBeenCalledWith('u1', 2);
      expect(onSelectionChange).toHaveBeenCalledWith(false);
    });
  });

  it.each([
    [{ item_id: 3, is_vocabulary: 0, audio: 'grammar.opus' }, 'Vocabulary only'],
    [{ item_id: 4, is_vocabulary: 1, audio: null }, 'Audio required'],
  ])('keeps ineligible items visible but disabled', (item, title) => {
    render(<PronunciationToggleButton userId="u1" item={item as any} />);

    const button = screen.getByRole('button', { name: 'Pronunciation toggle' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.getAttribute('title')).toBe(title);
  });

  it('reports a failed toggle', async () => {
    mocks.toggle.mockRejectedValue(new Error('boom'));
    const onSelectionChange = vi.fn();
    render(
      <PronunciationToggleButton
        userId="u1"
        item={{ item_id: 5, is_vocabulary: 1, audio: 'five.opus' } as any}
        onSelectionChange={onSelectionChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Pronunciation toggle' }));

    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith('Toggle failed', 'error');
      expect(mocks.reportError).toHaveBeenCalled();
      expect(onSelectionChange).not.toHaveBeenCalled();
    });
  });

  it('shows contextual help below the button when requested', () => {
    render(
      <PronunciationToggleButton
        userId="u1"
        item={{ item_id: 6, is_vocabulary: 1, audio: 'six.opus' } as any}
        showHelpText
      />,
    );

    const help = screen.getByTestId('pronunciation-help');
    expect(help.textContent).toBe('přidat do výslovnosti');
    expect(help.className).toContain('left-2');
    expect(help.className).toContain('-bottom-4');
  });
});
