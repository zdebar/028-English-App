import { HomeIcon, AcademicCapIcon } from "./Icons.js";
import ButtonLink from "./ButtonLink.js";
import { useLocation } from "react-router-dom";
import UserAvatar from "./UserAvatar.js";

export default function Header() {
  const location = useLocation();

  function getSelectedClass(pathname: string, targetPath: string): string {
    return pathname === targetPath ? "color-selected" : "color-header";
  }

  return (
    <header className="relative z-20 flex w-full flex-none justify-between">
      <nav
        className="sideheader m-4 flex gap-4"
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
      </nav>
      <nav
        className="sideheader m-4 flex gap-4"
        role="navigation"
        aria-label="Uživatelská navigace"
      >
        <ButtonLink
          buttonType="button-header"
          buttonColor={`${getSelectedClass(
            location.pathname,
            "/userDashboard"
          )}`}
          to="/userDashboard"
          aria-label="Uživatelský dashboard"
        >
          <AcademicCapIcon />
        </ButtonLink>
        <ButtonLink
          to="/userSettings"
          buttonType="button-header"
          buttonColor={` ${getSelectedClass(
            location.pathname,
            "/userSettings"
          )}`}
          aria-label="Nastavení uživatele"
        >
          <UserAvatar />
        </ButtonLink>
      </nav>
    </header>
  );
}
