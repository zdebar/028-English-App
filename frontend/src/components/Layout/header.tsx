import HeaderButton from '@/components/UI/buttons/HeaderButton';
import UserAvatar from '@/components/UI/UserAvatar';

import { useAuthStore } from '@/features/auth/use-auth-store';

import ThemeSwitch from '@/features/theme/ThemeSwitch';
import AcademicCapIcon from '../UI/icons/AcademicCapIcon';
import HomeIcon from '../UI/icons/HomeIcon';
import styles from './header.module.css';

/**
 * Header component displaying main navigation and user controls.
 */
export default function Header() {
  const { userId } = useAuthStore();

  return (
    <header
      className={`${styles['header-fixed']} relative z-20 flex w-full flex-none justify-between`}
    >
      <nav className={`${styles['header-side']} m-4 flex gap-2`} role="navigation">
        <HeaderButton to="/">
          <HomeIcon />
        </HeaderButton>
        <HeaderButton to="/practice" disabled={!userId}>
          <AcademicCapIcon />
        </HeaderButton>
      </nav>
      <nav
        className={`${styles['header-right']} ${styles['header-side']} m-4 flex gap-2`}
        role="navigation"
      >
        <ThemeSwitch />
        <HeaderButton to="/profile" disabled={!userId}>
          <UserAvatar />
        </HeaderButton>
      </nav>
    </header>
  );
}
