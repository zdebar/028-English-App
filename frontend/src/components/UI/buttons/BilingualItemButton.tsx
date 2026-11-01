import { TEXTS } from '@/locales/cs';
import type { UserItemLocal } from '@/types/user-item.types';
import type { JSX } from 'react';
import { ListButton } from './ListButton';

type BilingualItemButtonProps = Readonly<{
  item: Pick<UserItemLocal, 'czech' | 'english' | 'pronunciation'>;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  leadingLanguage?: 'czech' | 'english';
  showPronunciation?: boolean;
  forceSingleLine?: boolean;
  hideCzechOnNarrow?: boolean;
  title?: string;
}>;

/** A shared responsive Czech/English item row used by all item lists. */
export default function BilingualItemButton({
  item,
  onClick,
  disabled = false,
  className = '',
  leadingLanguage = 'czech',
  showPronunciation = false,
  forceSingleLine = false,
  hideCzechOnNarrow = false,
  title: customTitle,
}: BilingualItemButtonProps): JSX.Element {
  const title = customTitle ?? getItemTitle(item);
  const canStackLanguages = shouldStackLanguages(showPronunciation, forceSingleLine);
  const czechText = <span className={getCzechTextClassName(hideCzechOnNarrow)}>{item.czech}</span>;
  const englishText = (
    <span className="min-w-0 flex-1 overflow-hidden text-left font-bold text-ellipsis whitespace-nowrap">
      {item.english}
    </span>
  );
  const languageTexts = getLanguageTexts(leadingLanguage, czechText, englishText);

  return (
    <ListButton
      flexibleHeight
      className={`bilingual-item-button px-4 py-2 ${className}`}
      title={title}
      disabled={disabled}
      onClick={() => void onClick()}
    >
      <div
        className={`bilingual-item-content ${canStackLanguages ? 'bilingual-item-content--responsive' : ''}`}
      >
        {languageTexts}
        {getPronunciationText(showPronunciation, item.pronunciation)}
      </div>
    </ListButton>
  );
}

function getCzechTextClassName(hideCzechOnNarrow: boolean): string {
  const narrowRowClass = hideCzechOnNarrow ? 'pronunciation-item-czech' : '';
  return `min-w-0 flex-1 overflow-hidden text-left text-ellipsis whitespace-nowrap ${narrowRowClass}`.trim();
}

function getPronunciationTitle(pronunciation: string): string {
  if (!pronunciation) return '';
  return TEXTS.pronunciationTitle(pronunciation);
}

function getItemTitle(item: BilingualItemButtonProps['item']): string {
  return [
    `${TEXTS.czech}: ${item.czech}`,
    `${TEXTS.english}: ${item.english}`,
    getPronunciationTitle(item.pronunciation),
  ]
    .filter(Boolean)
    .join('\n');
}

function getLanguageTexts(
  leadingLanguage: 'czech' | 'english',
  czechText: JSX.Element,
  englishText: JSX.Element,
): JSX.Element[] {
  if (leadingLanguage === 'english') return [englishText, czechText];
  return [czechText, englishText];
}

function shouldStackLanguages(showPronunciation: boolean, forceSingleLine: boolean): boolean {
  return !showPronunciation && !forceSingleLine;
}

function getPronunciationText(
  showPronunciation: boolean,
  pronunciation: string,
): JSX.Element | null {
  if (!showPronunciation || !pronunciation) return null;
  return (
    <span className="min-w-0 flex-1 overflow-hidden text-left text-ellipsis whitespace-nowrap">
      {pronunciation}
    </span>
  );
}

