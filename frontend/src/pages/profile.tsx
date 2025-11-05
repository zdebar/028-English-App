import SettingProperty from "@/components/setting-property";
import ButtonSignout from "@/components/button-signout";
import { useAuth } from "@/hooks/use-auth";
import ButtonRectangular from "@/components/button-rectangular";
import UserItem from "@/database/models/user-items";
import { useState } from "react";

export default function Profile() {
  const { session } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleReset = async () => {
    await UserItem.clearUserItems();
    setIsModalOpen(false); // Close the modal after resetting
  };

  return (
    <div className="card-width">
      <SettingProperty
        label="Uživatel:"
        value={session?.user.user_metadata.email}
      />
      <ButtonRectangular onClick={() => setIsModalOpen(true)}>
        Restarovat
      </ButtonRectangular>
      <ButtonRectangular>Přehled gramatiky</ButtonRectangular>
      <ButtonRectangular>Přehled slovíček</ButtonRectangular>
      <ButtonSignout />
      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Opravdu chcete restartovat?</h3>
            <div className="modal-actions">
              <ButtonRectangular onClick={handleReset}>
                Ano, restartovat
              </ButtonRectangular>
              <ButtonRectangular onClick={() => setIsModalOpen(false)}>
                Zrušit
              </ButtonRectangular>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
