import ThemeDropdown from "../components/theme-dropdown";
import SettingProperty from "../components/setting-property";
import { useUserStore } from "../hooks/use-user";

export default function Profile() {
  const { userInfo } = useUserStore();

  return (
    <div className="card-width list">
      <SettingProperty label="Uživatel:" value={userInfo?.username} />
      <ThemeDropdown />
    </div>
  );
}
