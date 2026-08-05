import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserItemLocal } from '@/types/user-item.types';

const sanitizeMock = vi.fn();
const audioMocks = vi.hoisted(() => ({
  playAudio: vi.fn(),
  isAudioReady: vi.fn(() => true),
  loading: false,
  audios: [] as string[],
}));

vi.mock('dompurify', () => ({
  default: {
    sanitize: (...args: unknown[]) => sanitizeMock(...args),
  },
}));

vi.mock('@/locales/cs', () => ({
  TEXTS: {
    noNotesToDisplay: 'No notes',
    noAudio: 'No audio',
    restartGrammarTitle: 'Restart grammar',
    restartGrammarDescription: 'Restart grammar description',
  },
}));

vi.mock('@/features/help/HelpButton', () => ({
  default: () => <div data-testid="help" />,
}));

vi.mock('@/features/audio/VolumeSlider', () => ({
  default: () => <div data-testid="volume" />,
}));

vi.mock('@/features/audio/use-audio-manager', () => ({
  useAudioManager: (audios: string[]) => {
    audioMocks.audios = audios;
    return {
      playAudio: audioMocks.playAudio,
      isAudioReady: audioMocks.isAudioReady,
      loading: audioMocks.loading,
    };
  },
}));

vi.mock('@/components/UI/OverviewCard', () => ({
  default: ({ buttonTitle, children }: any) => (
    <div>
      <h1>{buttonTitle}</h1>
      <div>{children}</div>
    </div>
  ),
}));

import GrammarDetailCard from '@/features/grammar/GrammarDetailCard';

const exampleItem: UserItemLocal = {
  user_id: 'user-1',
  item_id: 41,
  czech: 'já jsem',
  english: 'I am',
  pronunciation: 'aɪ æm',
  audio: 'i-am.opus',
  sort_order: 1,
  progress_cz_to_en: 0,
  progress_en_to_cz: 0,
  progress_history: [],
  note_id: null,
  lesson_id: 1,
  updated_at: '2026-08-02T00:00:00.000Z',
  is_vocabulary: 0,
  is_practice_item: 1,
  has_pronunciation_practice: 0,
  block_id: 1,
  grammar_chunk_id: 1,
  started_at: '2026-08-02T00:00:00.000Z',
  deleted_at: '',
  next_at_cz_to_en: '',
  next_at_en_to_cz: '',
  mastered_at_cz_to_en: '',
  mastered_at_en_to_cz: '',
  curriculum_sort_path: [1, 1, 1],
};

describe('GrammarDetailCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sanitizeMock.mockImplementation((value: string) => value);
    audioMocks.playAudio.mockResolvedValue(true);
    audioMocks.isAudioReady.mockReturnValue(true);
    audioMocks.loading = false;
    audioMocks.audios = [];
  });

  it('renders sanitized grammar note when present', () => {
    sanitizeMock.mockReturnValue('<b>sanitized</b>');

    const { container } = render(
      <GrammarDetailCard
        grammar={{ kind: 'chunk', id: 1, name: 'Articles', note: '<script>x</script>' }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Articles')).toBeTruthy();
    expect(sanitizeMock).toHaveBeenCalledWith('<script>x</script>');
    expect(container.innerHTML).toContain('<b>sanitized</b>');
  });

  it('renders fallback message when note is null', () => {
    render(
      <GrammarDetailCard
        grammar={{ kind: 'chunk', id: 1, name: 'Articles', note: null }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('No notes')).toBeTruthy();
  });

  it('renders grouped grammar chunks as ordered sections', () => {
    const { container } = render(
      <GrammarDetailCard
        grammar={{
          id: 1,
          kind: 'group',
          name: 'Present simple',
          chunks: [
            {
              id: 11,
              name: 'Affirmative',
              note: '<p>affirmative note</p>',
              items: [exampleItem],
            },
            { id: 12, name: 'Negative', note: '<p>negative note</p>' },
          ],
        }}
        onClose={vi.fn()}
      />,
    );

    const headings = container.querySelectorAll('h2');
    expect([...headings].map((heading) => heading.textContent)).toEqual([
      'Affirmative',
      'Negative',
    ]);
    expect(screen.queryByText('No notes')).toBeNull();
    const groupedItemButton = screen.getByText('I am').closest('button');
    expect(groupedItemButton).not.toBeNull();
    expect(groupedItemButton?.parentElement?.className).toContain('gap-1');
  });

  it('hides help by default and renders it when explicitly enabled', () => {
    const { rerender } = render(
      <GrammarDetailCard
        grammar={{ kind: 'chunk', id: 1, name: 'Articles' }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('help')).toBeNull();

    rerender(
      <GrammarDetailCard
        grammar={{ kind: 'chunk', id: 1, name: 'Articles' }}
        onClose={vi.fn()}
        showHelpButton
      />,
    );

    expect(screen.getByTestId('help')).toBeTruthy();
  });

  it('loads and plays examples of a standalone overview chunk with empty chunks', async () => {
    render(
      <GrammarDetailCard
        grammar={{
          id: 1,
          kind: 'chunk',
          name: 'To be',
          items: [exampleItem],
        }}
        onClose={vi.fn()}
        showHelpButton
      />,
    );

    const itemButton = screen.getByText('I am').closest('button');
    expect(audioMocks.audios).toEqual(['i-am.opus']);
    expect(itemButton).not.toBeNull();
    expect(itemButton?.disabled).toBe(false);
    expect(itemButton?.parentElement?.className).toContain('gap-1');
    fireEvent.click(itemButton!);

    await waitFor(() => expect(audioMocks.playAudio).toHaveBeenCalledWith('i-am.opus'));
    expect(screen.getByTestId('volume')).toBeTruthy();
    expect(screen.getByTestId('help')).toBeTruthy();
  });
});
