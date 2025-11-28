import RectangularButton from "@/components/UI/buttons/RectangularButton";
import CloseIcon from "@/components/UI/icons/CloseIcon";
import AsyncButtonWithModal from "./buttons/AsyncButtonWithModal";
import Loading from "./Loading";
import Hint from "@/components/UI/Hint";
import { useOverlayStore } from "@/hooks/use-overlay-store";

interface OverviewCardProps {
  titleText?: string;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  handleReset?: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}

export default function OverviewCard({
  titleText = "bez názvu",
  isLoading = false,
  error = null,
  className = "",
  handleReset,
  onClose,
  children,
}: OverviewCardProps) {
  const { isOpen } = useOverlayStore();

  return (
    <div
      className={`card-height card-width flex flex-col gap-1 justify-start ${className}`}
    >
      <div className="h-button flex items-center justify-between gap-1">
        <AsyncButtonWithModal
          message={titleText}
          isLoading={isLoading}
          modalTitle="Obnovení pokroku"
          modalDescription="Opravdu chcete vymazat veškerý pokrok? Změna již nepůjde vrátit."
          onConfirm={() => {
            if (handleReset) {
              handleReset();
            }
            onClose();
          }}
          disabled={!handleReset}
          className="flex justify-start items-start grow"
        />
        <Hint visibility={isOpen} style={{ top: "0px", left: "14px" }}>
          obnovit pokrok
        </Hint>
        <RectangularButton className="w-button grow-0" onClick={onClose}>
          <CloseIcon />
        </RectangularButton>
      </div>
      <div className=" border border-dashed w-full grow p-4">
        {isLoading ? <Loading /> : error ? <p>{error}</p> : children}
      </div>
    </div>
  );
}
