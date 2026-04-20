import { TEXTS } from '@/locales/cs';
import { ROUTES } from '@/config/routes.config';
import type { JSX } from 'react';
import { Link } from 'react-router-dom';

/**
 * PrivacyPolicyLink component renders a link to the privacy policy page.
 *
 * @param className Additional CSS classes for custom styling.
 * @returns An anchor element linking to the privacy policy.
 */
export default function PrivacyPolicyLink({ className = '' }: { className?: string }): JSX.Element {
  return (
    <Link to={ROUTES.privacyPolicy} className={className}>
      {TEXTS.privacyPolicy}
    </Link>
  );
}
