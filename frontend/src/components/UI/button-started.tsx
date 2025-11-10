import ButtonRectangular from "./button-rectangular";
import UserItem from "@/database/models/user-items";
import { useAuthStore } from "@/hooks/use-auth-store";

export default function ButtonStarted() {
  const { userId } = useAuthStore();

  const handleClick = async () => {
    try {
      if (!userId) return;
      const count = await UserItem.getStartedCount(userId);
      console.log(`Started count for user ${userId}:`, count);
    } catch (error) {
      console.error("Error fetching started count:", error);
    }
  };

  return (
    <ButtonRectangular onClick={handleClick}>
      Log Started Count
    </ButtonRectangular>
  );
}
