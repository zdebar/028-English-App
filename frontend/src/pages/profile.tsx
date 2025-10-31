import SettingProperty from "@/components/setting-property";
import ButtonSignout from "@/components/button-signout";
import { useAuth } from "@/hooks/use-auth";

export default function Profile() {
  const { session } = useAuth();

  return (
    <div className="card-width">
      <SettingProperty
        label="Uživatel:"
        value={session?.user.user_metadata.email}
      />
      <ButtonSignout />
    </div>
  );
}
