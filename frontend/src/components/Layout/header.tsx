import HomeIcon from '../UI/icons/HomeIcon';
import AcademicCapIcon from '../UI/icons/AcademicCapIcon';
import HeaderButton from '@/components/UI/buttons/HeaderButton';
import UserAvatar from '@/components/UI/UserAvatar';
import ThemeSwitch from '@/features/theme/ThemeSwitch';
import { useAuthStore } from '@/features/auth/use-auth-store';

/**
 * Header component displaying main navigation and user controls.
 */
export default function Header() {
  const { userId } = useAuthStore();

  return (
    <header className="header-fixed relative z-20 flex w-full flex-none justify-between">
      <nav className="sideheader" role="navigation">
        <HeaderButton to="/">
          <HomeIcon />
        </HeaderButton>
        <HeaderButton to="/practice" disabled={!userId}>
          <AcademicCapIcon />
        </HeaderButton>
      </nav>
      <nav className="sideheader rightheader" role="navigation">
        <ThemeSwitch />
        <HeaderButton to="/profile" disabled={!userId}>
          <UserAvatar />
        </HeaderButton>
      </nav>
    </header>
  );
}
