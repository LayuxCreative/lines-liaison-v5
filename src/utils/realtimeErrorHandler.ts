export interface RealtimeError {
  type: 'connection' | 'subscription' | 'channel' | 'timeout' | 'unknown';
  message: string;
  timestamp: Date;
  table?: string;
  channel?: string;
  retryCount?: number;
}

export interface ErrorHandlerOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: RealtimeError) => void;
  onRetry?: (error: RealtimeError, attempt: number) => void;
  onMaxRetriesReached?: (error: RealtimeError) => void;
}

class RealtimeErrorHandler {
  private errors: RealtimeError[] = [];
  private retryAttempts: Map<string, number> = new Map();
  private options: Required<ErrorHandlerOptions>;

  constructor(options: ErrorHandlerOptions = {}) {
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      retryDelay: options.retryDelay ?? 2000,
      onError: options.onError ?? this.defaultErrorHandler,
      onRetry: options.onRetry ?? this.defaultRetryHandler,
      onMaxRetriesReached: options.onMaxRetriesReached ?? this.defaultMaxRetriesHandler
    };
  }

  // Handle different types of errors
  handleError(error: Partial<RealtimeError> & { message: string }): void {
    const realtimeError: RealtimeError = {
      type: error.type ?? 'unknown',
      message: error.message,
      timestamp: new Date(),
      table: error.table,
      channel: error.channel,
      retryCount: error.retryCount ?? 0
    };

    // Add to error log
    this.errors.push(realtimeError);
    
    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }

    // Call error handler
    this.options.onError(realtimeError);

    // Determine if we should retry
    if (this.shouldRetry(realtimeError)) {
      this.scheduleRetry(realtimeError);
    }
  }

  // Check if we should retry based on error type and retry count
  private shouldRetry(error: RealtimeError): boolean {
    const key = this.getRetryKey(error);
    const currentRetries = this.retryAttempts.get(key) ?? 0;
    
    // Don't retry certain error types
    if (error.type === 'unknown') {
      return false;
    }

    return currentRetries < this.options.maxRetries;
  }

  // Schedule a retry attempt
  private scheduleRetry(error: RealtimeError): void {
    const key = this.getRetryKey(error);
    const currentRetries = this.retryAttempts.get(key) ?? 0;
    const newRetryCount = currentRetries + 1;
    
    this.retryAttempts.set(key, newRetryCount);
    
    setTimeout(() => {
      this.options.onRetry(error, newRetryCount);
      
      // If this was the last retry, call max retries handler
      if (newRetryCount >= this.options.maxRetries) {
        this.options.onMaxRetriesReached(error);
        this.retryAttempts.delete(key);
      }
    }, this.options.retryDelay * newRetryCount);
  }

  // Generate a unique key for retry tracking
  private getRetryKey(error: RealtimeError): string {
    return `${error.type}-${error.table || 'global'}-${error.channel || 'default'}`;
  }

  // Default error handler
  private defaultErrorHandler = (error: RealtimeError): void => {
    console.error(`[Realtime Error] ${error.type}:`, {
      message: error.message,
      table: error.table,
      channel: error.channel,
      timestamp: error.timestamp
    });
  };

  // Default retry handler
  private defaultRetryHandler = (error: RealtimeError, attempt: number): void => {
    console.warn(`[Realtime Retry] Attempt ${attempt}/${this.options.maxRetries} for ${error.type}:`, {
      message: error.message,
      table: error.table,
      channel: error.channel
    });
  };

  // Default max retries handler
  private defaultMaxRetriesHandler = (error: RealtimeError): void => {
    console.error(`[Realtime Max Retries] Giving up on ${error.type}:`, {
      message: error.message,
      table: error.table,
      channel: error.channel,
      maxRetries: this.options.maxRetries
    });
  };

  // Get error statistics
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    recentErrors: RealtimeError[];
    activeRetries: number;
  } {
    const errorsByType = this.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentErrors = this.errors.slice(-10);

    return {
      totalErrors: this.errors.length,
      errorsByType,
      recentErrors,
      activeRetries: this.retryAttempts.size
    };
  }

  // Clear error history
  clearErrors(): void {
    this.errors = [];
    this.retryAttempts.clear();
  }

  // Reset retry attempts for a specific error type
  resetRetries(type?: string, table?: string): void {
    if (type || table) {
      const keysToDelete: string[] = [];
      this.retryAttempts.forEach((_, key) => {
        if ((!type || key.includes(type)) && (!table || key.includes(table))) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.retryAttempts.delete(key));
    } else {
      this.retryAttempts.clear();
    }
  }
}

// Create a singleton instance
export const realtimeErrorHandler = new RealtimeErrorHandler({
  maxRetries: 3,
  retryDelay: 2000,
  onError: (error) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Realtime Error:', error);
    }
    
    // You can add additional error reporting here
    // e.g., send to error tracking service
  },
  onRetry: (error, attempt) => {
    console.warn(`Retrying Realtime operation (${attempt}/3):`, error.message);
  },
  onMaxRetriesReached: (error) => {
    console.error('Max retries reached for Realtime operation:', error.message);
    
    // You can add additional handling here
    // e.g., show user notification, fallback to polling
  }
});

// Helper functions for common error scenarios
export const handleConnectionError = (message: string) => {
  realtimeErrorHandler.handleError({
    type: 'connection',
    message
  });
};

export const handleSubscriptionError = (table: string, message: string) => {
  realtimeErrorHandler.handleError({
    type: 'subscription',
    message,
    table
  });
};

export const handleChannelError = (channel: string, message: string) => {
  realtimeErrorHandler.handleError({
    type: 'channel',
    message,
    channel
  });
};

export const handleTimeoutError = (operation: string) => {
  realtimeErrorHandler.handleError({
    type: 'timeout',
    message: `Operation timed out: ${operation}`
  });
};

// Export the handler instance
export { RealtimeErrorHandler };
export default realtimeErrorHandler;