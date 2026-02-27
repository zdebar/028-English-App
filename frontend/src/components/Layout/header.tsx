import HeaderButton from '@/components/UI/buttons/HeaderButton';
import { ROUTES } from '@/config/routes.config';
import { useAuthStore } from '@/features/auth/use-auth-store';
import ThemeSwitch from '@/features/theme/ThemeSwitch';
import { TEXTS } from '@/locales/cs';

import AcademicCapIcon from '../UI/icons/AcademicCapIcon';
import HomeIcon from '../UI/icons/HomeIcon';
import UserIcon from '../UI/icons/UserIcon';

import type { JSX } from 'react';
import styles from './header.module.css';

/**
 * Header component displaying main navigation and user controls.
 *
 * @returns - The rendered header element.
 */
export default function Header(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);

  return (
    <header className={`${styles['header-fixed']} z-header relative flex w-full justify-between`}>
      <nav className={`${styles['header-side']} flex gap-2 p-4`} role="navigation">
        <HeaderButton to={ROUTES.home} title={TEXTS.tooltipHome}>
          <HomeIcon />
        </HeaderButton>
        <HeaderButton to={ROUTES.practice} disabled={!userId} title={TEXTS.tooltipPractice}>
          <AcademicCapIcon />
        </HeaderButton>
      </nav>
      <nav
        className={`${styles['header-right']} ${styles['header-side']} m-4 flex gap-2`}
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
