import ButtonRectangular from "./button-rectangular";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Modal } from "@/components/modal";
import { toast } from "react-toastify";

/**
 * Button for signing out the user.
 */
export default function ButtonSignout() {
  const { handleLogout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSignout = async () => {
    try {
      await handleLogout();
      toast.success("Úspěšně jste se odhlásili.");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error on user logout:", error);
      toast.error("Nastala chyba při odhlašování. Zkuste to prosím později.");
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
        aria-labelledby="signout-modal-title"
        aria-describedby="signout-modal-description"
      >
        <p>Opravdu se chcete odhlásit?</p>
      </Modal>
    </>
  );
}
