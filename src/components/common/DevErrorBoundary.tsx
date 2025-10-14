import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class DevErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Only log in development
    if (import.meta.env.DEV) {
      console.error('DevErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Only show detailed error in development
      if (import.meta.env.DEV) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-red-600 text-sm font-bold">!</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Development Error</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Error Message:</h3>
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded border">
                    {this.state.error?.message}
                  </p>
                </div>
                
                {this.state.error?.stack && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Stack Trace:</h3>
                    <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded border overflow-auto max-h-40">
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}
                
                {this.state.errorInfo?.componentStack && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Component Stack:</h3>
                    <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded border overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        );
      }
      
      // In production, show minimal error message with same layout structure
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-lg font-bold">!</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">Please refresh the page or try again later.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DevErrorBoundary;