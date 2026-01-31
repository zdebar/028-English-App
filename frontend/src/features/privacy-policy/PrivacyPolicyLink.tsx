import { TEXTS } from '@/locales/cs';
import { ROUTES } from '@/config/routes.config';
import type { JSX } from 'react';

/**
 * PrivacyPolicyLink component renders a link to the privacy policy page.
 *
 * @param className Additional CSS classes for custom styling.
 * @returns An anchor element linking to the privacy policy.
 */
export default function PrivacyPolicyLink({ className = '' }: { className?: string }): JSX.Element {
  return (
    <a href={ROUTES.privacyPolicy} className={className}>
      {TEXTS.privacyPolicy}
    </a>
  );
}
