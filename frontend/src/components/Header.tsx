import { HomeIcon, AcademicCapIcon } from "./icons.js";
import ButtonLink from "./button-link.js";
import { useLocation } from "react-router-dom";
import UserAvatar from "./user-avatar.js";
import ThemeSwitch from "./theme-switch.js";

export default function Header() {
  const location = useLocation();

  function getSelectedClass(pathname: string, targetPath: string): string {
    return pathname === targetPath ? "color-selected" : "color-header";
  }

  return (
    <header className="header relative z-20 flex w-full flex-none justify-between">
      <nav
        className="sideheader "
        role="navigation"
        aria-label="Hlavní navigace"
      >
        <ButtonLink
          to="/"
          aria-label="Domů"
          buttonType="button-header"
          buttonColor={`${getSelectedClass(location.pathname, "/")} `}
        >
          <HomeIcon />
        </ButtonLink>
        <ButtonLink
          buttonType="button-header"
          buttonColor={`${getSelectedClass(location.pathname, "/practice")}`}
          to="/practice"
          aria-label="Uživatelský dashboard"
        >
          <AcademicCapIcon />
        </ButtonLink>
      </nav>
      <nav
        className="sideheader rightheader "
        role="navigation"
        aria-label="Uživatelská navigace"
      >
        <ThemeSwitch />
        <ButtonLink
          to="/profile"
          buttonType="button-header"
          buttonColor={` ${getSelectedClass(location.pathname, "/profile")}`}
          aria-label="Nastavení uživatele"
        >
          <UserAvatar />
        </ButtonLink>
      </nav>
    </header>
  );
}
