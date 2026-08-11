import { TEXTS } from '@/locales/cs';
import type { UserItemLocal } from '@/types/user-item.types';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ListButton } from './ListButton';

type BilingualItemButtonProps = Readonly<{
  item: Pick<UserItemLocal, 'czech' | 'english' | 'pronunciation'>;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  leadingLanguage?: 'czech' | 'english';
}>;

function pronunciationTitle(pronunciation: string): string {
  if (!pronunciation) return '';
  return typeof TEXTS.pronunciationTitle === 'function'
    ? TEXTS.pronunciationTitle(pronunciation)
    : pronunciation;
}

function intrinsicTextWidth(element: HTMLElement): number {
  const measurement = element.cloneNode(true) as HTMLElement;
  const computedStyle = getComputedStyle(element);
  measurement.setAttribute('aria-hidden', 'true');
  measurement.style.position = 'fixed';
  measurement.style.visibility = 'hidden';
  measurement.style.pointerEvents = 'none';
  measurement.style.width = 'max-content';
  measurement.style.minWidth = '0';
  measurement.style.maxWidth = 'none';
  measurement.style.flex = 'none';
  measurement.style.overflow = 'visible';
  measurement.style.whiteSpace = 'nowrap';
  measurement.style.font = computedStyle.font;
  measurement.style.letterSpacing = computedStyle.letterSpacing;
  document.body.appendChild(measurement);
  const measuredWidth = measurement.getBoundingClientRect().width;
  measurement.remove();
  if (measuredWidth > 0) return measuredWidth;
  return element.scrollWidth;
}

/** A shared, content-aware Czech/English item row used by all item lists. */
export default function BilingualItemButton({
  item,
  onClick,
  disabled = false,
  className = '',
  leadingLanguage = 'czech',
}: BilingualItemButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const czechRef = useRef<HTMLSpanElement>(null);
  const englishRef = useRef<HTMLSpanElement>(null);
  const [stacked, setStacked] = useState(false);
  const [truncated, setTruncated] = useState(false);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const czech = czechRef.current;
    const english = englishRef.current;
    if (!container || !czech || !english) return;

    const gap = 12;
    const czechWidth = intrinsicTextWidth(czech);
    const englishWidth = intrinsicTextWidth(english);
    const horizontalWidth = Math.max(0, (container.clientWidth - gap) / 2);
    const shouldStack = czechWidth > horizontalWidth || englishWidth > horizontalWidth;
    const finalWidth = shouldStack ? container.clientWidth : horizontalWidth;
    setStacked(shouldStack);
    setTruncated(czechWidth > finalWidth || englishWidth > finalWidth);
  }, []);

  useLayoutEffect(() => {
    measure();
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [item.czech, item.english, measure]);

  const audioTitle = pronunciationTitle(item.pronunciation);
  const title = truncated
    ? [
        `${TEXTS.czech ?? 'Čeština'}: ${item.czech}`,
        `${TEXTS.english ?? 'Angličtina'}: ${item.english}`,
        audioTitle,
      ]
        .filter(Boolean)
        .join('\n')
    : audioTitle || undefined;

  const czechText = (
    <span
      key="czech"
      ref={czechRef}
      className="min-w-0 flex-1 overflow-hidden text-left text-ellipsis whitespace-nowrap"
    >
      {item.czech}
    </span>
  );
  const englishText = (
    <span
      key="english"
      ref={englishRef}
      className="min-w-0 flex-1 overflow-hidden text-left font-bold text-ellipsis whitespace-nowrap"
    >
      {item.english}
    </span>
  );
  const languageTexts =
    leadingLanguage === 'english' ? [englishText, czechText] : [czechText, englishText];

  return (
    <ListButton
      flexibleHeight
      className={`${stacked ? 'min-h-[calc(var(--height-input)*2)]' : ''} px-4 py-2 ${className}`}
      title={title}
      disabled={disabled}
      onClick={() => void onClick()}
    >
      <div
        ref={containerRef}
        className={`flex w-full gap-3 overflow-hidden ${stacked ? 'flex-col gap-1' : 'flex-row'}`}
      >
        {languageTexts}
      </div>
    </ListButton>
  );
}
