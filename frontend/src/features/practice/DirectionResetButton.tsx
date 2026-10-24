import ButtonWithModal from '@/features/modal/ButtonWithModal';
import type { ReviewDirection } from '@/types/practice.types';
import type { JSX, ReactNode } from 'react';

type DirectionResetButtonProps = Readonly<{
  direction: ReviewDirection;
  label: ReactNode;
  onReset: (direction: ReviewDirection) => Promise<void>;
  modalTitle: string;
  modalText: string;
  title?: string;
}>;

/** Shared confirmation control for resetting one practice direction. */
export default function DirectionResetButton({
  direction,
  label,
  onReset,
  modalTitle,
  modalText,
  title,
}: DirectionResetButtonProps): JSX.Element {
  return (
    <ButtonWithModal
      className="h-input w-full justify-center font-bold"
      modalTitle={modalTitle}
      modalText={modalText}
      title={title}
      onConfirm={() => onReset(direction)}
    >
      {label}
    </ButtonWithModal>
  );
}
