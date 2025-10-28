import { useState, useEffect } from "react";

export default function useLocalStorage(key: string) {
  const savedVisibility = localStorage.getItem(key) ?? "true";

  const [isTrue, setIsTrue] = useState(() => {
    return savedVisibility == "true"; // Default: true
  });

  const [isSavedTrue, setIsSavedTrue] = useState(() => {
    return savedVisibility == "true"; // Default: true
  });

  const hideOverlay = (saveLocal: boolean) => {
    setIsTrue(false);
    localStorage.setItem(key, String(saveLocal));
  };

  useEffect(() => {
    if (isTrue) {
      const storedValue = localStorage.getItem(key) ?? "true";
      setIsSavedTrue(storedValue == "true");
    }
  }, [isTrue, key]);

  return {
    isTrue,
    setIsTrue,
    isSavedTrue,
    setIsSavedTrue,
    hideOverlay,
  };
}
