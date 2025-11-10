import ButtonRectangular from "./button-rectangular";
import UserItem from "@/database/models/user-items";
import { useAuth } from "@/hooks/use-auth";

export default function ButtonStarted() {
  const { userId } = useAuth();

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
