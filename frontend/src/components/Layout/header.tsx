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
      <span id="auth-required-description" className="sr-only">
        Pro přístup k této funkci je vyžadováno přihlášení.
      </span>
      <nav className="sideheader" role="navigation" aria-label="Hlavní navigace">
        <HeaderButton to="/" aria-label="Domů">
          <HomeIcon />
        </HeaderButton>
        <HeaderButton
          to="/practice"
          aria-label="Uživatelský dashboard"
          disabled={!userId}
          aria-disabled={!userId}
          aria-describedby={!userId ? 'auth-required-description' : undefined}
        >
          <AcademicCapIcon />
        </HeaderButton>
      </nav>
      <nav className="sideheader rightheader" role="navigation" aria-label="Uživatelská navigace">
        <ThemeSwitch />
        <HeaderButton
          to="/profile"
          aria-label="Nastavení uživatele"
          disabled={!userId}
          aria-disabled={!userId}
          aria-describedby={!userId ? 'auth-required-description' : undefined}
        >
          <AcademicCapIcon />
        </HeaderButton>
      </nav>
      <nav className="sideheader rightheader" role="navigation" aria-label="Uživatelská navigace">
        <ThemeSwitch />
        <HeaderButton
          to="/profile"
          aria-label="Nastavení uživatele"
          disabled={!userId}
          aria-disabled={!userId}
          aria-describedby={!userId ? 'auth-required-description' : undefined}
        >
          <UserAvatar />
        </HeaderButton>
      </nav>
      <p id="auth-required-description" className="sr-only">
        Pro přístup k této sekci je vyžadováno přihlášení.
      </p>
    </header>
  );
}
