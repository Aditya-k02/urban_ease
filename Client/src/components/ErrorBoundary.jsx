import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }

    // TODO: Send to error tracking service (e.g., Sentry)
    // sendErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoBack = () => {
    window.history.back();
  };

  handleDismiss = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === 'development';

      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.iconContainer}>
              <AlertTriangle size={64} color="#dc2626" />
            </div>

            <h1 style={styles.title}>Something went wrong</h1>

            <p style={styles.message}>
              We're sorry, but something unexpected happened. 
              {this.state.errorCount > 1 && ` This has happened ${this.state.errorCount} times.`}
            </p>

            {isDev && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details (Dev Only)</summary>
                <div style={styles.errorDetails}>
                  <p style={styles.errorMessage}>
                    <strong>Error:</strong> {this.state.error.toString()}
                  </p>
                  {this.state.error.stack && (
                    <pre style={styles.stackTrace}>
                      {this.state.error.stack}
                    </pre>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <pre style={styles.componentStack}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div style={styles.buttonGroup}>
              <button onClick={this.handleReload} style={styles.primaryButton}>
                Reload Page
              </button>
              <button onClick={this.handleGoBack} style={styles.secondaryButton}>
                Go Back
              </button>
              {this.state.errorCount <= 2 && (
                <button onClick={this.handleDismiss} style={styles.tertiaryButton}>
                  Dismiss
                </button>
              )}
            </div>

            {this.state.errorCount > 2 && (
              <p style={styles.warningText}>
                ⚠️ This error keeps occurring. Please contact support if the problem persists.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  card: {
    maxWidth: '600px',
    width: '100%',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '16px',
  },
  message: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '32px',
    lineHeight: '1.6',
  },
  details: {
    textAlign: 'left',
    marginBottom: '24px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
  },
  summary: {
    cursor: 'pointer',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '12px',
  },
  errorDetails: {
    marginTop: '12px',
  },
  errorMessage: {
    fontSize: '14px',
    color: '#dc2626',
    marginBottom: '12px',
  },
  stackTrace: {
    fontSize: '12px',
    backgroundColor: '#1f2937',
    color: '#f9fafb',
    padding: '12px',
    borderRadius: '4px',
    overflow: 'auto',
    maxHeight: '200px',
    marginBottom: '12px',
  },
  componentStack: {
    fontSize: '12px',
    backgroundColor: '#374151',
    color: '#e5e7eb',
    padding: '12px',
    borderRadius: '4px',
    overflow: 'auto',
    maxHeight: '150px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  secondaryButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    backgroundColor: '#e5e7eb',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  tertiaryButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: 'transparent',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  warningText: {
    marginTop: '24px',
    fontSize: '14px',
    color: '#dc2626',
    fontWeight: '600',
  },
};

export default ErrorBoundary;
