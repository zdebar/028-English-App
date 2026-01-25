import { TEXTS } from '@/config/texts';

/**
 * PrivacyPolicyLink component renders a link to the privacy policy page.
 *
 * @param className Additional CSS classes for custom styling.
 * @returns An anchor element linking to the privacy policy.
 */
export default function PrivacyPolicyLink({ className = '' }: { className?: string }) {
  return (
    <a href="/privacy-policy" className={className}>
      {TEXTS.privacyPolicy}
    </a>
  );
}
