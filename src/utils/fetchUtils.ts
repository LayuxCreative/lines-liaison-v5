interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class FetchError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

export const fetchWithRetry = async <T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> => {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw new FetchError('Unauthorized', 401, response);
        }

        if (response.status === 403) {
          throw new FetchError('Access denied', 403, response);
        }

        if (response.status >= 500) {
          throw new FetchError('Server error', response.status, response);
        }

        throw new FetchError(`HTTP ${response.status}`, response.status, response);
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      let data: T;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = (await response.text()) as unknown as T;
      }

      return {
        success: true,
        data,
      };

    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (
        error instanceof FetchError &&
        (error.status === 401 || error.status === 403 || error.status === 404)
      ) {
        break;
      }

      // Don't retry on abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        break;
      }

      // Wait before retry (except on last attempt)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  clearTimeout(timeoutId);

  // Return error response
  return {
    success: false,
    error: lastError?.message || 'Network error',
  };
};

export const apiRequest = async <T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  return fetchWithRetry<T>(url, options);
};

// Convenience methods
export const apiGet = <T = unknown>(endpoint: string, options?: FetchOptions) =>
  apiRequest<T>(endpoint, { ...options, method: 'GET' });

export const apiPost = <T = unknown>(endpoint: string, data?: unknown, options?: FetchOptions) =>
  apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPut = <T = unknown>(endpoint: string, data?: unknown, options?: FetchOptions) =>
  apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiDelete = <T = unknown>(endpoint: string, options?: FetchOptions) =>
  apiRequest<T>(endpoint, { ...options, method: 'DELETE' });

export { FetchError };