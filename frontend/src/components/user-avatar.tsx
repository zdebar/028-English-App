import { useState, useEffect } from "react";
import { useUserStore } from "@/hooks/use-user";
import { UserIcon } from "@/components/icons";

export default function UserAvatar() {
  const { userInfo } = useUserStore();

  const finalImageUrl = userInfo?.picture;
  const initials = userInfo?.username
    ? userInfo.username
        .split(" ")
        .map((name) => name[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : null;
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    if (finalImageUrl) {
      const img = new Image();
      img.src = finalImageUrl;
      img.onload = () => setIsImageLoaded(true);
      img.onerror = () => setIsImageLoaded(false);
    }
  }, [finalImageUrl]);

  return isImageLoaded ? (
    <img
      src={finalImageUrl ?? undefined}
      alt="User Avatar"
      className="button-header"
    />
  ) : initials ? (
    <div
      className="button-header flex items-center justify-center"
      style={{ paddingBottom: "1.5px" }}
    >
      <span className="text-2xl">{initials}</span>
    </div>
  ) : (
    <UserIcon />
  );
}
