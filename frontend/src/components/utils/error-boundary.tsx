import { Component, type ReactNode } from 'react';
import { TEXTS } from '@/locales/cs';
import { errorHandler } from '@/features/logging/error-handler';
import NotificationText from '@/components/UI/NotificationText';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React error boundary component for catching and displaying errors in child components.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // Log the error to an error reporting service
    errorHandler('ErrorBoundary', error);
  }

  render() {
    if (this.state.hasError) {
      return <NotificationText text={TEXTS.errorBoundaryMessage} className="pt-6" />;
    }

    return this.props.children;
  }
}
