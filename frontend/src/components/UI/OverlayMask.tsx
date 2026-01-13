import { useCallback } from 'react';

type OverlayMaskProps = {
  onClose?: () => void;
};

/**
 * Overlay mask component covering the entire screen.
 *
 * @param onClose Function to call when the overlay is clicked.
 */
export default function OverlayMask({ onClose }: OverlayMaskProps) {
  const handleOverlayClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape' && onClose) {
        e.preventDefault();
        onClose();
      }
    },
    [onClose],
  );

  return (
    <div
      className="color-overlay shape-overlay z-1000"
      onClick={handleOverlayClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    />
  );
}
