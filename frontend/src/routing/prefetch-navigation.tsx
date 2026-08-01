import StyledButton from '@/components/UI/buttons/StyledButton';
import { reportError } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import {
  prefetchRouteData,
  type RouteDataDescriptor,
} from '@/routing/route-data-cache';
import type { ButtonHTMLAttributes, MouseEvent, PointerEvent, FocusEvent, ReactNode } from 'react';
import { useRef, useState } from 'react';
import { Link, useNavigate, type LinkProps, type NavigateOptions } from 'react-router-dom';

type AnyRouteDataDescriptor = RouteDataDescriptor<unknown>;

function isModifiedClick(event: MouseEvent<HTMLElement>): boolean {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export function usePrefetchPreparation(
  descriptor: AnyRouteDataDescriptor | undefined,
  destination: string,
) {
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  const warm = () => {
    if (!descriptor) return;
    prefetchRouteData(descriptor).catch((error) => {
      reportError(`Route prefetch failed for ${destination}`, error);
    });
  };

  const prepareAndNavigate = async (options?: NavigateOptions) => {
    if (pendingRef.current) return;
    if (!descriptor) {
      if (options) navigate(destination, options);
      else navigate(destination);
      return;
    }

    pendingRef.current = true;
    setPending(true);
    try {
      await prefetchRouteData(descriptor);
      pendingRef.current = false;
      setPending(false);
      if (options) navigate(destination, options);
      else navigate(destination);
    } catch (error) {
      reportError(`Route loading failed for ${destination}`, error);
      showToast(TEXTS.loadingError, 'error');
      pendingRef.current = false;
      setPending(false);
    }
  };

  return { pending, warm, prepareAndNavigate };
}

type PrefetchButtonProps = Readonly<{
  to: string;
  descriptor?: AnyRouteDataDescriptor;
  navigateOptions?: NavigateOptions;
  children: ReactNode;
}> &
  ButtonHTMLAttributes<HTMLButtonElement>;

export function PrefetchButton({
  to,
  descriptor,
  navigateOptions,
  children,
  onPointerEnter,
  onPointerDown,
  onFocus,
  onClick,
  disabled,
  ...rest
}: PrefetchButtonProps) {
  const { pending, warm, prepareAndNavigate } = usePrefetchPreparation(descriptor, to);

  return (
    <StyledButton
      {...rest}
      disabled={disabled || pending}
      aria-busy={pending}
      onPointerEnter={(event: PointerEvent<HTMLButtonElement>) => {
        onPointerEnter?.(event);
        if (!event.defaultPrevented) warm();
      }}
      onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented) warm();
      }}
      onFocus={(event: FocusEvent<HTMLButtonElement>) => {
        onFocus?.(event);
        if (!event.defaultPrevented) warm();
      }}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) void prepareAndNavigate(navigateOptions);
      }}
    >
      {children}
    </StyledButton>
  );
}

type PrefetchLinkProps = Readonly<{
  descriptor?: AnyRouteDataDescriptor;
}> &
  LinkProps;

export function PrefetchLink({
  descriptor,
  to,
  onPointerEnter,
  onPointerDown,
  onFocus,
  onClick,
  ...rest
}: PrefetchLinkProps) {
  const destination = typeof to === 'string' ? to : `${to.pathname ?? ''}${to.search ?? ''}`;
  const { pending, warm, prepareAndNavigate } = usePrefetchPreparation(descriptor, destination);

  return (
    <Link
      {...rest}
      to={to}
      aria-busy={pending}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (!event.defaultPrevented) warm();
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented) warm();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (!event.defaultPrevented) warm();
      }}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || isModifiedClick(event)) return;
        event.preventDefault();
        void prepareAndNavigate({ replace: rest.replace, state: rest.state });
      }}
    />
  );
}
