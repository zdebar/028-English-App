import { HomeIcon, AcademicCapIcon } from "@/components/icons";
import ButtonHeader from "@/components/button-header";
import UserAvatar from "@/components/user-avatar";
import ThemeSwitch from "@/components/theme-switch";

export default function Header() {
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
        <ButtonHeader to="/practice" aria-label="Uživatelský dashboard">
          <AcademicCapIcon />
        </ButtonHeader>
      </nav>
      <nav
        className="sideheader rightheader "
        role="navigation"
        aria-label="Uživatelská navigace"
      >
        <ThemeSwitch />
        <ButtonHeader to="/profile" aria-label="Nastavení uživatele">
          <UserAvatar />
        </ButtonHeader>
      </nav>
    </header>
  );
}
