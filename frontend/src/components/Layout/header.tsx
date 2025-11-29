import HomeIcon from "../UI/icons/HomeIcon";
import AcademicCapIcon from "../UI/icons/AcademicCapIcon";
import HeaderButton from "@/components/UI/buttons/HeaderButton";
import UserAvatar from "@/components/UI/UserAvatar";
import ThemeSwitch from "@/features/theme/ThemeSwitch";
import { useAuthStore } from "@/features/auth/use-auth-store";

export default function Header() {
  const { userId } = useAuthStore();

  return (
    <header className="header-fixed relative z-20 flex w-full flex-none justify-between">
      <nav
        className="sideheader "
        role="navigation"
        aria-label="Hlavní navigace"
      >
        <HeaderButton to="/" aria-label="Domů">
          <HomeIcon />
        </HeaderButton>
        <HeaderButton
          to="/practice"
          aria-label="Uživatelský dashboard"
          className="tour-step-10"
          disabled={!userId}
        >
          <AcademicCapIcon />
        </HeaderButton>
      </nav>
      <nav
        className="sideheader rightheader "
        role="navigation"
        aria-label="Uživatelská navigace"
      >
        <ThemeSwitch />
        <HeaderButton
          to="/profile"
          aria-label="Nastavení uživatele"
          disabled={!userId}
          className="tour-step-30"
        >
          <UserAvatar />
        </HeaderButton>
      </nav>
    </header>
  );
}
