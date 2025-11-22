import { HomeIcon, AcademicCapIcon } from "@/components/UI/icons";
import ButtonHeader from "@/components/UI/button-header";
import UserAvatar from "@/components/UI/user-avatar";
import ThemeSwitch from "@/components/UI/theme-switch";
import { useAuthStore } from "@/hooks/use-auth-store";

export default function Header() {
  const { userId } = useAuthStore();

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
          className="tour-step-10"
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
          className="tour-step-30"
        >
          <UserAvatar />
        </ButtonHeader>
      </nav>
    </header>
  );
}
