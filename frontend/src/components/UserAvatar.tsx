import { useState, useEffect } from "react";
import { useUserStore } from "../hooks/use-user";
import { UserIcon } from "./Icons";

export default function UserAvatar() {
  const { userInfo } = useUserStore();

  const finalImageUrl = userInfo?.picture;
  const initials = userInfo?.username?.[0] ?? null;
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
      className="avatar"
    />
  ) : initials ? (
    <div
      className="avatar flex items-center justify-center bg-green-700"
      style={{ paddingBottom: "1.5px" }}
    >
      <span className="text-2xl text-white">{initials}</span>
    </div>
  ) : (
    <UserIcon />
  );
}
