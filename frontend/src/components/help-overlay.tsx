import useLocalStorage from "../hooks/use-local-storage";
import Checkbox from "./checkbox";
import Overlay from "./overlay";
import { HelpIcon } from "./icons";
import { useEffect } from "react";

export default function HelpOverlay({
  name,
  setIsHelpVisible,
}: {
  name: string;
  setIsHelpVisible: (value: boolean) => void;
}) {
  const { isTrue, isSavedTrue, setIsTrue, setIsSavedTrue, hideOverlay } =
    useLocalStorage(name);

  const handleCheckboxChange = (checked: boolean) => {
    setIsSavedTrue(!checked);
  };

  useEffect(() => {
    setIsHelpVisible(isTrue);
  }, [isTrue, setIsHelpVisible]);

  return (
    <>
      {isTrue && (
        <Overlay
          onClose={() => {
            hideOverlay(isSavedTrue);
          }}
        />
      )}
      <div
        className="help-icon absolute z-10"
        style={{
          bottom: "5px",
          right: "5px",
        }}
        onClick={() => setIsTrue(true)}
      >
        <HelpIcon />
      </div>
      {isTrue && (
        <Checkbox
          onChange={handleCheckboxChange}
          className="pl-1"
          checked={!isSavedTrue}
        />
      )}
    </>
  );
}
