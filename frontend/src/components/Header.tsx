import { HomeIcon, AcademicCapIcon } from "@/components/icons";
import ButtonHeader from "@/components/UI/button-header";
import UserAvatar from "@/components/user-avatar";
import ThemeSwitch from "@/components/theme-switch";
import { useAuth } from "@/hooks/use-auth";

export default function Header() {
  const { userId } = useAuth();

  return (
    <header className="header-fixed relative z-20 flex w-full flex-none justify-between">
      <nav
        className="sideheader "
        role="navigation"
        aria-label="Hlavní navigace"
      >
        <ButtonHeader to="/" aria-label="Domů">
          <HomeIcon />
        </ButtonHeader>
        <ButtonHeader
          to="/practice"
          aria-label="Uživatelský dashboard"
          disabled={!userId}
        >
          <AcademicCapIcon />
        </ButtonHeader>
      </nav>
      <nav
        className="sideheader rightheader "
        role="navigation"
        aria-label="Uživatelská navigace"
      >
        <ThemeSwitch />
        <ButtonHeader
          to="/profile"
          aria-label="Nastavení uživatele"
          disabled={!userId}
        >
          <UserAvatar />
        </ButtonHeader>
      </nav>
    </header>
  );
}
