import type { ReactNode } from 'react';

type AnyFn = (...args: unknown[]) => unknown;

export function createAuthStoreMock(getUserId: () => string | null) {
  return (selector: (state: { userId: string | null }) => unknown) =>
    selector({ userId: getUserId() });
}

export function createToastStoreMock(getShowToast: () => AnyFn, getHideToast: () => AnyFn) {
  return (selector: (state: { showToast: AnyFn; hideToast: AnyFn }) => unknown) =>
    selector({
      showToast: getShowToast(),
      hideToast: getHideToast(),
    });
}

export function createDelegatedMock(fn: AnyFn) {
  return (...args: unknown[]) => fn(...args);
}

type AsyncButtonProps = {
  disabled?: boolean;
  children?: ReactNode;
  onClick?: () => Promise<void>;
  onConfirm?: () => Promise<void>;
};

export function createAsyncButtonMock(testId: string, action: 'onClick' | 'onConfirm') {
  return ({ disabled, children, onClick, onConfirm }: AsyncButtonProps) => (
    <button
      data-testid={testId}
      disabled={disabled}
      onClick={() => void (action === 'onClick' ? onClick?.() : onConfirm?.())}
    >
      {children}
    </button>
  );
}
