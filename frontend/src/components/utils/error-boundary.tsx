import { Component, type ErrorInfo, type ReactNode } from 'react';
import { TEXTS } from '@/locales/cs';
import { reportError } from '@/features/logging/logging-handler';
import Notification from '@/components/UI/Notification';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * React error boundary component for catching and displaying errors in child components.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportError('ErrorBoundary', error, { componentStack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return <Notification className="pt-6">{TEXTS.errorBoundaryMessage}</Notification>;
    }

    return this.props.children;
  }
}
