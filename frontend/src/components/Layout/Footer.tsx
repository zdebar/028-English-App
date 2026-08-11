import PrivacyPolicyLink from '@/features/privacy-policy/PrivacyPolicyLink';
import { useLayoutEffect, useRef, useState, type JSX } from 'react';

const currentYear = new Date().getFullYear();

type FooterProps = Readonly<{
  constrainToPracticeSession?: boolean;
  headerLayout?: 'side' | 'top';
  secondaryLayout?: 'bottom' | 'side';
}>;

type FooterVisibilityMeasurements = Readonly<{
  constrainToPracticeSession: boolean;
  viewportHeight: number;
  maxCardHeight: number;
  headerHeight: number;
  secondaryControlsHeight: number;
  footerHeight: number;
  headerLayout: 'side' | 'top';
  secondaryLayout: 'bottom' | 'side';
}>;

export function resolveFooterVisibility({
  constrainToPracticeSession,
  viewportHeight,
  maxCardHeight,
  headerHeight,
  secondaryControlsHeight,
  footerHeight,
  headerLayout,
  secondaryLayout,
}: FooterVisibilityMeasurements): boolean {
  if (!constrainToPracticeSession) return true;

  let availableHeight = viewportHeight;
  if (headerLayout === 'top') availableHeight -= headerHeight;

  let requiredHeight = maxCardHeight + footerHeight;
  if (secondaryLayout === 'bottom') requiredHeight += secondaryControlsHeight;

  return availableHeight >= requiredHeight;
}

function readCssLength(probe: HTMLDivElement, variableName: string): number {
  probe.style.height = `var(${variableName})`;
  return probe.getBoundingClientRect().height;
}

function measureLayoutLengths() {
  const probe = document.createElement('div');
  probe.style.position = 'fixed';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  document.documentElement.appendChild(probe);

  const lengths = {
    maxCardHeight: readCssLength(probe, '--max-height-card'),
    headerHeight: readCssLength(probe, '--height-header'),
    secondaryControlsHeight: readCssLength(probe, '--height-button'),
  };
  probe.remove();
  return lengths;
}

/**
 * Footer component that displays the current year copyright and a link to the privacy policy.
 *
 * @returns - The rendered footer element.
 */
export default function Footer({
  constrainToPracticeSession = false,
  headerLayout = 'top',
  secondaryLayout = 'bottom',
}: FooterProps): JSX.Element {
  const footerRef = useRef<HTMLElement>(null);
  const measuredFooterHeight = useRef(0);
  const [isVisible, setIsVisible] = useState(true);

  useLayoutEffect(() => {
    const updateVisibility = () => {
      const footer = footerRef.current;
      if (!footer) return;

      const footerStyles = getComputedStyle(footer);
      const contentHeight = footer.getBoundingClientRect().height;
      const marginTop = Number.parseFloat(footerStyles.marginTop) || 0;
      const marginBottom = Number.parseFloat(footerStyles.marginBottom) || 0;
      const outerHeight =
        contentHeight + marginTop + marginBottom;
      if (contentHeight > 0) measuredFooterHeight.current = outerHeight;

      const layoutLengths = measureLayoutLengths();
      const nextVisible = resolveFooterVisibility({
        constrainToPracticeSession,
        viewportHeight: window.innerHeight,
        footerHeight: measuredFooterHeight.current,
        headerLayout,
        secondaryLayout,
        ...layoutLengths,
      });
      setIsVisible(nextVisible);
    };

    updateVisibility();
    window.addEventListener('resize', updateVisibility);

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateVisibility);
      if (footerRef.current) resizeObserver.observe(footerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateVisibility);
      resizeObserver?.disconnect();
    };
  }, [constrainToPracticeSession, headerLayout, secondaryLayout]);

  const visibilityClass = isVisible ? '' : 'hidden';

  return (
    <footer ref={footerRef} className={`m-4 mx-auto text-sm ${visibilityClass}`}>
      <span>© {currentYear} </span>
      <PrivacyPolicyLink />
    </footer>
  );
}
