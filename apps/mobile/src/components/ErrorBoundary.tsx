import React, { Component, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Colors } from '../constants';
import { logger } from '../utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log error
    logger.error('ErrorBoundary caught an error', error, 'ErrorBoundary');
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // TODO: Send to error reporting service (Sentry, Bugsnag, etc.)
    // Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.emoji}>😔</Text>
            <Text style={styles.title}>Qualcosa è andato storto</Text>
            <Text style={styles.message}>
              Si è verificato un errore imprevisto. Prova a ricaricare l'app.
            </Text>
            
            <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
              <Text style={styles.buttonText}>Riprova</Text>
            </TouchableOpacity>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>
                  {this.state.error.name}: {this.state.error.message}
                </Text>
                {this.state.errorInfo?.componentStack && (
                  <Text style={styles.debugText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  debugContainer: {
    marginTop: 24,
    maxHeight: 200,
    width: '100%',
    backgroundColor: Colors.backgroundCard,
    borderRadius: 8,
    padding: 12,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
});
