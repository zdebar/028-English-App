import HeaderButton from '@/components/UI/buttons/HeaderButton';
import BookIcon from '@/components/UI/icons/BookIcon';
import HomeIcon from '@/components/UI/icons/HomeIcon';
import UserIcon from '@/components/UI/icons/UserIcon';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '@/features/auth/use-auth-store';
import ThemeSwitch from '@/features/theme/ThemeSwitch';
import { TEXTS } from '@/locales/cs';
import { useState, type JSX } from 'react';
import styles from './header.module.css';

/**
 * Header component displaying main navigation and user controls.
 *
 * @returns - The rendered header element.
 */
export default function Header(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);
  const isAnonymousUser = useAuthStore((state) => state.isAnonymousUser);
  const userFullName = useAuthStore((state) => state.userFullName);
  const userEmail = useAuthStore((state) => state.userEmail);
  const userPicture = useAuthStore((state) => state.userPicture);
  const hasGoogleAccount = Boolean(userId) && !isAnonymousUser;

  return (
    <header
      className={`${styles['header-fixed']} z-header relative flex h-min w-full justify-between`}
    >
      <nav className={`${styles['header-side']} flex gap-2 p-4`} data-header-side role="navigation">
        <HeaderButton to={ROUTES.home} title={TEXTS.tooltipHome}>
          <HomeIcon />
        </HeaderButton>
        <HeaderButton
          to={ROUTES.overviews}
          disabled={!userId}
          title={TEXTS.tooltipOverviews}
        >
          <BookIcon />
        </HeaderButton>
      </nav>
      <nav
        className={`${styles['header-right']} ${styles['header-side']} flex gap-2 p-4`}
        data-header-side
        role="navigation"
      >
        <ThemeSwitch />
        <HeaderButton to={ROUTES.profile} disabled={!userId} title={TEXTS.tooltipProfile}>
          {hasGoogleAccount ? (
            <ProfileAvatar picture={userPicture} fullName={userFullName} email={userEmail} />
          ) : (
            <UserIcon />
          )}
        </HeaderButton>
      </nav>
    </header>
  );
}

function ProfileAvatar({
  picture,
  fullName,
  email,
}: Readonly<{
  picture: string | null;
  fullName: string | null;
  email: string | null;
}>): JSX.Element {
  const [failedPicture, setFailedPicture] = useState<string | null>(null);
  if (picture && picture !== failedPicture) {
    return (
      <img
        src={picture}
        alt=""
        referrerPolicy="no-referrer"
        className="size-10 rounded-full object-cover"
        onError={() => setFailedPicture(picture)}
      />
    );
  }

  const initials = getUserInitials(fullName, email);
  if (!initials) return <UserIcon />;

  return (
    <span className="flex size-10 items-center justify-center rounded-full bg-info-light font-headings text-sm font-bold text-white dark:bg-info-hover-dark">
      {initials}
    </span>
  );
}

function getUserInitials(fullName: string | null, email: string | null): string {
  const parts = getInitialsSource(fullName, email)
    .split(/[\s._+-]+/u)
    .filter(Boolean);
  return formatInitials(parts);
}

function getInitialsSource(fullName: string | null, email: string | null): string {
  const name = fullName?.trim();
  if (name) return name;
  return email?.split('@')[0]?.trim() ?? '';
}

function formatInitials(parts: string[]): string {
  if (parts.length === 0) return '';
  if (parts.length === 1) return getShortInitials(parts[0] ?? '');

  const first = getFirstCharacter(parts[0] ?? '');
  const last = getFirstCharacter(parts.at(-1) ?? '');
  return `${first}${last}`.toLocaleUpperCase('cs-CZ');
}

function getShortInitials(name: string): string {
  return Array.from(name).slice(0, 2).join('').toLocaleUpperCase('cs-CZ');
}

function getFirstCharacter(value: string): string {
  return Array.from(value)[0] ?? '';
}
