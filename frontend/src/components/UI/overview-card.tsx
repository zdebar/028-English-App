import ButtonRectangular from "@/components/UI/button-rectangular";
import { CloseIcon } from "@/components/UI/icons";

import ButtonAsync from "./button-async";

interface OverviewCardProps {
  titleText?: string;
  disabledText?: string;
  children?: React.ReactNode;
  className?: string;
  handleReset?: () => void;
  onClose: () => void;
  isLoading?: boolean;
  error?: string | null;
}

/**
 * Displays an overview card with a title, content area, and optional reset functionality.
 * @param titleText - The title text to display on the card.
 * @param disabledText - The text to display when content is disabled.
 * @param children - The content to display inside the card.
 * @param className - Additional CSS classes for styling the card.
 * @param handleReset - Optional function to handle reset action. When no function provided, reset button is disabled.
 * @param onClose - Function to handle closing the card.
 * @param isLoading - Indicates if the content is loading.
 * @returns
 */
export default function OverviewCard({
  titleText = "bez názvu",
  disabledText = "bez obsahu",
  children,
  className = "",
  handleReset,
  onClose,
  isLoading = false,
  error = null,
}: OverviewCardProps) {
  return (
    <div
      className={`card-height card-width flex flex-col gap-1 justify-start ${className}`}
    >
      <div className="h-button flex items-center justify-between gap-1">
        <ButtonAsync
          isLoading={isLoading}
          message={titleText}
          disabledMessage={disabledText}
          modalTitle="Potvrzení resetu"
          modalDescription="Opravdu chcete vymazat veškerý progress? Změna již nepůjde vrátit."
          onConfirm={() => {
            if (handleReset) {
              handleReset();
            }
            onClose();
          }}
          buttonTextStyle="p-4"
          disabled={!handleReset}
        />
        <ButtonRectangular className="w-button grow-0" onClick={onClose}>
          <CloseIcon />
        </ButtonRectangular>
      </div>
      <div className=" border border-dashed w-full grow p-4">
        {isLoading ? <p>Načítání...</p> : error ? <p>{error}</p> : children}
      </div>
    </div>
  );
}
