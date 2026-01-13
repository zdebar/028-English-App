import { useEffect, useCallback } from 'react';

import CloseIcon from '@/components/UI/icons/CloseIcon';

interface CloseButtonProps {
  onClick: () => void;
  className?: string;
}

/**
 * Button component for closing dialogs or modals.
 *
 * @param onClick Function to call when button is clicked.
 * @param className Additional CSS classes for custom styling.
 */
export default function CloseButton({ onClick, className = '' }: CloseButtonProps) {
  // Handle Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClick();
      }
    },
    [onClick],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <button
      className={`color-button flex items-center justify-center ${className}`}
      onClick={onClick}
    >
      <CloseIcon />
    </button>
  );
}
