import PrivacyPolicyLink from '@/features/privacy-policy/PrivacyPolicyLink';
import type { JSX } from 'react';

const currentYear = new Date().getFullYear();

/**
 * Footer component that displays the current year copyright and a link to the privacy policy.
 *
 * @param currentYear - The current year to display in the footer. Defaults to the current year.
 * @returns - The rendered footer element.
 */
export default function Footer(): JSX.Element {
  return (
    <footer className="flex w-full items-center justify-center gap-2 py-4 text-center text-sm">
      <p>© {currentYear}</p>
      <PrivacyPolicyLink />
    </footer>
  );
}
