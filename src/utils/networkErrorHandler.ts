/**
 * Network error handler utilities
 * Handles network errors, timeouts, and connection issues
 */

export interface NetworkError {
  name: string;
  message: string;
  code?: string;
  status?: number;
}

interface ErrorLike {
  name?: string;
  message?: string;
}

function isErrorLike(error: unknown): error is ErrorLike {
  return typeof error === 'object' && error !== null;
}

const networkErrorPatterns = [
  'err_aborted', 'err_network', 'err_internet_disconnected',
  'err_connection_refused', 'err_connection_reset', 'err_connection_timed_out',
  'network_error', 'aborterror', 'timeouterror',
  'failed to fetch', 'network request failed'
];

export const isNetworkError = (error: unknown): boolean => {
  if (!error) return false;
  
  const errorString = error.toString().toLowerCase();
  let errorName = '';
  let errorMessage = '';
  
  if (isErrorLike(error)) {
    errorName = error.name?.toLowerCase() || '';
    errorMessage = error.message?.toLowerCase() || '';
  }
  
  return networkErrorPatterns.some(pattern => 
    errorString.includes(pattern) ||
    errorName.includes(pattern) ||
    errorMessage.includes(pattern)
  );
};

export const handleNetworkError = (error: unknown, context: string = 'Unknown'): void => {
  if (isNetworkError(error)) {
    const errorInfo = isErrorLike(error) 
      ? { 
          name: error.name, 
          message: error.message, 
          context 
        }
      : { error: String(error), context };
    
    console.warn(`🌐 Network error in ${context} (this is often normal):`, errorInfo);
    
    // Don't throw for network errors as they're often expected
    return;
  }
  
  // For non-network errors, log and potentially re-throw
  console.error(`❌ Unexpected error in ${context}:`, error);
  throw error;
};

export const createTimeoutPromise = (ms: number, errorMessage?: string): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage || `Operation timed out after ${ms}ms`));
    }, ms);
  });
};

export const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> => {
  return Promise.race([
    promise,
    createTimeoutPromise(timeoutMs, errorMessage)
  ]);
};

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  context: string = 'Operation'
): Promise<T> => {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (isNetworkError(error)) {
        console.warn(`🔄 ${context} failed (attempt ${attempt}/${maxRetries}), retrying...`);
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // For non-network errors or final attempt, throw immediately
      throw error;
    }
  }
  
  throw lastError;
};

export const createRobustFetch = (defaultTimeout: number = 8000) => {
  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), defaultTimeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          'Cache-Control': 'no-cache'
        }
      });
      
      return response;
    } catch (error) {
      handleNetworkError(error, `Fetch to ${url}`);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };
};