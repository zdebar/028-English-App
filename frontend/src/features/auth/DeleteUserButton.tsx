import { useState } from "react";
import { useToastStore } from "@/features/toast/use-toast-store";
import ButtonAsyncModal from "../../components/UI/buttons/ButtonAsyncModal";
import { useAuthStore } from "@/features/auth/use-auth-store";
import { supabaseInstance } from "@/config/supabase.config";
import UserItem from "@/database/models/user-items";

export default function DeleteUserButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { userId } = useAuthStore();
  const { showToast } = useToastStore();

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      if (!userId) return;

      const session = await supabaseInstance.auth.getSession();
      const accessToken = session.data.session?.access_token;

      // Delete user from Supabase Auth (admin API)
      const { error: deleteError } = await supabaseInstance.functions.invoke(
        "delete-user",
        {
          body: { userId },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (deleteError) {
        throw deleteError;
      }

      // Set deleted_at in table users
      const response = await supabaseInstance
        .from("users")
        .update({
          deleted_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (response.error) {
        throw response.error;
      }

      showToast("Váš uživatelský účet byl úspěšně smazán.", "success");
      await UserItem.deleteAllUserItems(userId);
      await supabaseInstance.auth.signOut();
    } catch (error) {
      console.error("Error deleting user:", error);
      showToast(
        "Nastala chyba při mazání uživatelského účtu. Zkuste to prosím později.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ButtonAsyncModal
      message="Smazat uživatelský účet"
      loadingMessage="Probíhá mazání..."
      isLoading={isLoading}
      modalTitle="Potvrzení mazání uživatelského účtu"
      modalDescription="Opravdu chcete smazat uživatelský účet? Veškerá data budou nenávratně ztracena."
      onConfirm={handleDelete}
      className="grow-0 shape-button-rectangular color-button"
    />
  );
}
