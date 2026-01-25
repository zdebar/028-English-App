import PrivacyPolicyLink from '@/features/privacy-policy/PrivacyPolicyLink';

/**
 * Footer component that displays the current year copyright and a link to the privacy policy.
 *
 * @param currentYear - The current year to display in the footer. Defaults to the current year.
 */
export default function Footer({
  currentYear = new Date().getFullYear(),
}: {
  currentYear?: number;
}) {
  return (
    <footer className="flex w-full items-center justify-center gap-2 py-4 text-center text-sm">
      <p>@{currentYear}</p>
      <PrivacyPolicyLink />
    </footer>
  );
}
