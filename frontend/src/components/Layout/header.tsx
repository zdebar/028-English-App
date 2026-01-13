import HeaderButton from '@/components/UI/buttons/HeaderButton';
import UserAvatar from '@/components/UI/UserAvatar';

import { TEXTS } from '@/config/texts';
import { useAuthStore } from '@/features/auth/use-auth-store';

import ThemeSwitch from '@/features/theme/ThemeSwitch';
import AcademicCapIcon from '../UI/icons/AcademicCapIcon';
import HomeIcon from '../UI/icons/HomeIcon';

/**
 * Header component displaying main navigation and user controls.
 */
export default function Header() {
  const { userId } = useAuthStore();

  return (
    <header
      className="header-fixed relative z-20 flex w-full flex-none justify-between"
      aria-label={TEXTS.headerLabel}
    >
      <nav className="sideheader" role="navigation" aria-label={TEXTS.navMainLabel}>
        <HeaderButton to="/">
          <HomeIcon />
        </HeaderButton>
        <HeaderButton to="/practice" disabled={!userId}>
          <AcademicCapIcon />
        </HeaderButton>
      </nav>
      <nav className="sideheader rightheader" role="navigation" aria-label={TEXTS.navUserLabel}>
        <ThemeSwitch />
        <HeaderButton to="/profile" disabled={!userId}>
          <UserAvatar />
        </HeaderButton>
      </nav>
    </header>
  );
}
