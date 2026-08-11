import HeaderButton from '@/components/UI/buttons/HeaderButton';
import BookIcon from '@/components/UI/icons/BookIcon';
import HomeIcon from '@/components/UI/icons/HomeIcon';
import UserIcon from '@/components/UI/icons/UserIcon';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '@/features/auth/use-auth-store';
import ThemeSwitch from '@/features/theme/ThemeSwitch';
import { TEXTS } from '@/locales/cs';
import type { JSX } from 'react';
import styles from './header.module.css';
import { overviewAvailabilityDescriptor } from '@/routing/route-data';

/**
 * Header component displaying main navigation and user controls.
 *
 * @returns - The rendered header element.
 */
export default function Header(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);

  return (
    <header
      className={`${styles['header-fixed']} z-header relative flex h-min w-full justify-between`}
    >
      <nav
        className={`${styles['header-side']} flex gap-2 p-4`}
        data-header-side
        role="navigation"
      >
        <HeaderButton to={ROUTES.home} title={TEXTS.tooltipHome}>
          <HomeIcon />
        </HeaderButton>
        <HeaderButton
          to={ROUTES.overviews}
          descriptor={userId ? overviewAvailabilityDescriptor(userId) : undefined}
          disabled={!userId}
          title={TEXTS.tooltipOverviews}
        >
          <BookIcon />
        </HeaderButton>
      </nav>
      <nav
        className={`${styles['header-right']} ${styles['header-side']} m-4 flex gap-2`}
        data-header-side
        role="navigation"
      >
        <ThemeSwitch />
        <HeaderButton to={ROUTES.profile} disabled={!userId} title={TEXTS.tooltipProfile}>
          <UserIcon />
        </HeaderButton>
      </nav>
    </header>
  );
}
