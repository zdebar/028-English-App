import { TEXTS } from '@/config/texts';

/**
 * Footer component that displays the current year copyright and a link to the privacy policy.
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="flex w-full items-center justify-center gap-2 py-4 text-center text-sm"
    >
      <p>{TEXTS.copyright(currentYear)}</p>
      <a href="/privacy-policy" className="hover:underline" aria-label={TEXTS.privacyPolicyAria}>
        {TEXTS.privacyPolicy}
      </a>
    </footer>
  );
}
