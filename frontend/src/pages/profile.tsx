import SettingProperty from "@/components/setting-property";
import ButtonSignout from "@/components/button-signout";

import ButtonRectangular from "@/components/button-rectangular";
import ButtonResetAll from "@/components/button-reset-all";
import { useState, useEffect } from "react";
import { getUserEmail } from "@/utils/database.utils";

export default function Profile() {
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const fetchEmail = async () => {
      const email = await getUserEmail();
      setUserEmail(email || "");
    };
    fetchEmail();
  }, []);

  return (
    <div className="card-width">
      <SettingProperty label="Uživatel:" value={userEmail} />
      <ButtonResetAll />
      <ButtonRectangular>Přehled gramatiky</ButtonRectangular>
      <ButtonRectangular>Přehled slovíček</ButtonRectangular>
      <ButtonSignout />
    </div>
  );
}
