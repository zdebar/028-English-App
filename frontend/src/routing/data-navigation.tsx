import StyledButton from '@/components/UI/buttons/StyledButton';
import { reportError } from '@/features/logging/monitoring-handler';
import { useToastStore } from '@/features/toast/use-toast-store';
import { TEXTS } from '@/locales/cs';
import {
  prepareRouteData,
  type RouteDataDescriptor,
} from '@/routing/route-data-handoff';
import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { useRef, useState } from 'react';
import { Link, useNavigate, type LinkProps, type NavigateOptions } from 'react-router-dom';

type AnyRouteDataDescriptor = RouteDataDescriptor<unknown>;

function isModifiedClick(event: MouseEvent<HTMLElement>): boolean {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export function useDataNavigation(
  descriptor: AnyRouteDataDescriptor | undefined,
  destination: string,
) {
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

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

  return { pending, loadAndNavigate };
}

type DataNavigationButtonProps = Readonly<{
  to: string;
  descriptor?: AnyRouteDataDescriptor;
  navigateOptions?: NavigateOptions;
  children: ReactNode;
}> &
  ButtonHTMLAttributes<HTMLButtonElement>;

export function DataNavigationButton({
  to,
  descriptor,
  navigateOptions,
  children,
  onClick,
  disabled,
  ...rest
}: DataNavigationButtonProps) {
  const { pending, loadAndNavigate } = useDataNavigation(descriptor, to);

  return (
    <StyledButton
      {...rest}
      disabled={disabled || pending}
      aria-busy={pending}
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
}> &
  LinkProps;

export function DataNavigationLink({
  descriptor,
  to,
  onClick,
  ...rest
}: DataNavigationLinkProps) {
  const destination = typeof to === 'string' ? to : `${to.pathname ?? ''}${to.search ?? ''}`;
  const { pending, loadAndNavigate } = useDataNavigation(descriptor, destination);

  return (
    <Link
      {...rest}
      to={to}
      aria-busy={pending}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || isModifiedClick(event)) return;
        event.preventDefault();
        void loadAndNavigate({ replace: rest.replace, state: rest.state });
      }}
    />
  );
}
