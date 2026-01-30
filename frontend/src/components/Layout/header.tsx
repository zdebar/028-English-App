import HeaderButton from '@/components/UI/buttons/HeaderButton';

import { ROUTES } from '@/config/routes.config';

import { useAuthStore } from '@/features/auth/use-auth-store';
import ThemeSwitch from '@/features/theme/ThemeSwitch';

import AcademicCapIcon from '../UI/icons/AcademicCapIcon';
import HomeIcon from '../UI/icons/HomeIcon';
import UserIcon from '../UI/icons/UserIcon';

import type { JSX } from 'react';
import styles from './header.module.css';

/**
 * Header component displaying main navigation and user controls.
 * @returns {JSX.Element} The rendered button element.
 */
export default function Header(): JSX.Element {
  const userId = useAuthStore((state) => state.userId);

  return (
    <header
      className={`${styles['header-fixed']} z-header relative flex w-full flex-none justify-between`}
    >
      <nav className={`${styles['header-side']} m-4 flex gap-2`} role="navigation">
        <HeaderButton to={ROUTES.home}>
          <HomeIcon />
        </HeaderButton>
        <HeaderButton to={ROUTES.practice} disabled={!userId}>
          <AcademicCapIcon />
        </HeaderButton>
      </nav>
      <nav
        className={`${styles['header-right']} ${styles['header-side']} m-4 flex gap-2`}
        role="navigation"
      >
        <ThemeSwitch />
        <HeaderButton to={ROUTES.profile} disabled={!userId}>
          <UserIcon />
        </HeaderButton>
      </nav>
    </header>
  );
}
