import StyledButton from '@/components/UI/buttons/StyledButton';
import { reportError } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import {
  prepareRouteData,
  type RouteDataDescriptor,
} from '@/routing/route-data-handoff';
import type { ButtonHTMLAttributes, FocusEvent, MouseEvent, PointerEvent, ReactNode } from 'react';
import { useRef, useState } from 'react';
import { Link, useNavigate, type LinkProps, type NavigateOptions } from 'react-router-dom';

type AnyRouteDataDescriptor = RouteDataDescriptor<unknown>;

/**
 * Controls when route data starts loading. `intent` can retain a snapshot before
 * navigation, so mutations of its source data must invalidate the matching route key.
 */
export type DataLoadingStrategy = 'click' | 'intent';

function isModifiedClick(event: MouseEvent<HTMLElement>): boolean {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export function useDataNavigation(
  descriptor: AnyRouteDataDescriptor | undefined,
  destination: string,
  strategy: DataLoadingStrategy = 'click',
) {
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  const loadOnIntent = () => {
    if (strategy !== 'intent' || !descriptor) return;
    prepareRouteData(descriptor).catch((error) => {
      reportError(`Route intent loading failed for ${destination}`, error);
    });
  };

  const loadAndNavigate = async (options?: NavigateOptions) => {
    if (pendingRef.current) return;
    if (!descriptor) {
      if (options) navigate(destination, options);
      else navigate(destination);
      return;
    }

    pendingRef.current = true;
    setPending(true);
    try {
      await prepareRouteData(descriptor);
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

  return { pending, loadOnIntent, loadAndNavigate };
}

type DataNavigationButtonProps = Readonly<{
  to: string;
  descriptor?: AnyRouteDataDescriptor;
  navigateOptions?: NavigateOptions;
  children: ReactNode;
  /** `intent` requires matching route-data invalidation when source data mutates. */
  strategy?: DataLoadingStrategy;
}> &
  ButtonHTMLAttributes<HTMLButtonElement>;

export function DataNavigationButton({
  to,
  descriptor,
  navigateOptions,
  strategy = 'click',
  children,
  onPointerEnter,
  onPointerDown,
  onFocus,
  onClick,
  disabled,
  ...rest
}: DataNavigationButtonProps) {
  const { pending, loadOnIntent, loadAndNavigate } = useDataNavigation(
    descriptor,
    to,
    strategy,
  );

  return (
    <StyledButton
      {...rest}
      disabled={disabled || pending}
      aria-busy={pending}
      onPointerEnter={(event: PointerEvent<HTMLButtonElement>) => {
        onPointerEnter?.(event);
        if (!event.defaultPrevented) loadOnIntent();
      }}
      onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented) loadOnIntent();
      }}
      onFocus={(event: FocusEvent<HTMLButtonElement>) => {
        onFocus?.(event);
        if (!event.defaultPrevented) loadOnIntent();
      }}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) void loadAndNavigate(navigateOptions);
      }}
    >
      {children}
    </StyledButton>
  );
}

type DataNavigationLinkProps = Readonly<{
  descriptor?: AnyRouteDataDescriptor;
  /** `intent` requires matching route-data invalidation when source data mutates. */
  strategy?: DataLoadingStrategy;
}> &
  LinkProps;

export function DataNavigationLink({
  descriptor,
  strategy = 'click',
  to,
  onPointerEnter,
  onPointerDown,
  onFocus,
  onClick,
  ...rest
}: DataNavigationLinkProps) {
  const destination = typeof to === 'string' ? to : `${to.pathname ?? ''}${to.search ?? ''}`;
  const { pending, loadOnIntent, loadAndNavigate } = useDataNavigation(
    descriptor,
    destination,
    strategy,
  );

  return (
    <Link
      {...rest}
      to={to}
      aria-busy={pending}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (!event.defaultPrevented) loadOnIntent();
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented) loadOnIntent();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (!event.defaultPrevented) loadOnIntent();
      }}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || isModifiedClick(event)) return;
        event.preventDefault();
        void loadAndNavigate({ replace: rest.replace, state: rest.state });
      }}
    />
  );
}
