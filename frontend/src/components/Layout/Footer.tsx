import { ROUTES } from '@/config/routes.config';
import PrivacyPolicyLink from '@/features/privacy-policy/PrivacyPolicyLink';
import type { JSX } from 'react';
import { useMatch } from 'react-router-dom';

const currentYear = new Date().getFullYear();

/**
 * Footer component that displays the current year copyright and a link to the privacy policy.
 *
 * @returns - The rendered footer element on the home and profile routes.
 */
export default function Footer(): JSX.Element | null {
  const homeMatch = useMatch({ path: ROUTES.home, end: true });
  const profileMatch = useMatch({ path: ROUTES.profile, end: true });

  if (!homeMatch && !profileMatch) return null;

  return (
    <footer className="m-4 mx-auto text-sm">
      <span>© {currentYear} </span>
      <PrivacyPolicyLink />
    </footer>
  );
}
