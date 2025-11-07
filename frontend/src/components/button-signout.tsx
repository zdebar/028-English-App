import ButtonRectangular from "./button-rectangular";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Modal } from "@/components/modal";

export default function ButtonSignout() {
  const { handleLogout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSignout = async () => {
    try {
      await handleLogout();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error on user logout:", error);
    }
  };

  return (
    <>
      <ButtonRectangular onClick={() => setIsModalOpen(true)}>
        Sign out
      </ButtonRectangular>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleSignout}
      >
        <p>Opravdu se chcete odhlásit?</p>
      </Modal>
    </>
  );
}
