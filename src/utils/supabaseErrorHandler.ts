// Supabase Error Handler - 406 Not Acceptable Fix
// Handles content negotiation and HTTP errors

export interface SupabaseError {
  code: string;
  message: string;
  details?: unknown;
  hint?: string;
}

export interface ErrorHandlerResult {
  success: boolean;
  error?: SupabaseError;
  retryable: boolean;
}

export class SupabaseErrorHandler {
  static handle406Error(response: Response): ErrorHandlerResult {
    const contentType = response.headers.get('content-type');
    const acceptHeader = response.headers.get('accept');
    


    return {
      success: false,
      error: {
        code: 'CONTENT_NOT_ACCEPTABLE',
        message: 'Server cannot produce content matching the Accept header',
        details: {
          contentType,
          acceptHeader,
          url: response.url
        },
        hint: 'Check Accept headers and content negotiation'
      },
      retryable: true
    };
  }

  static handleHttpError(response: Response): ErrorHandlerResult {
    switch (response.status) {
      case 400:
        return {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Invalid request parameters',
            details: { status: response.status, url: response.url }
          },
          retryable: false
        };

      case 401:
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required or invalid',
            details: { status: response.status, url: response.url }
          },
          retryable: false
        };

      case 403:
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied - insufficient permissions',
            details: { status: response.status, url: response.url }
          },
          retryable: false
        };

      case 404:
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Resource not found',
            details: { status: response.status, url: response.url }
          },
          retryable: false
        };

      case 406:
        return this.handle406Error(response);

      case 409:
        return {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Resource conflict',
            details: { status: response.status, url: response.url }
          },
          retryable: false
        };

      case 422:
        return {
          success: false,
          error: {
            code: 'UNPROCESSABLE_ENTITY',
            message: 'Invalid data format or validation failed',
            details: { status: response.status, url: response.url }
          },
          retryable: false
        };

      case 429:
        return {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests - rate limit exceeded',
            details: { status: response.status, url: response.url }
          },
          retryable: true
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          success: false,
          error: {
            code: 'SERVER_ERROR',
            message: 'Internal server error',
            details: { status: response.status, url: response.url }
          },
          retryable: true
        };

      default:
        return {
          success: false,
          error: {
            code: 'UNKNOWN_ERROR',
            message: `HTTP ${response.status}: ${response.statusText}`,
            details: { status: response.status, url: response.url }
          },
          retryable: response.status >= 500
        };
    }
  }

  static async handleSupabaseResponse<T>(
    response: Response
  ): Promise<{ data: T | null; error: SupabaseError | null }> {
    if (response.ok) {
      try {
        const data = await response.json();
        return { data, error: null };
      } catch (parseError) {
        return {
          data: null,
          error: {
            code: 'PARSE_ERROR',
            message: 'Failed to parse response JSON',
            details: parseError
          }
        };
      }
    }

    const errorResult = this.handleHttpError(response);
    return { data: null, error: errorResult.error || null };
  }

  static createRetryableRequest(
    originalFetch: typeof fetch,
    maxRetries = 3,
    baseDelay = 1000
  ) {
    return async (...args: Parameters<typeof fetch>): Promise<Response> => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const [url, options = {}] = args;
          
          // Ensure proper headers for content negotiation
          const enhancedOptions = {
            ...options,
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'Content-Type': 'application/json',
              'Accept-Encoding': 'gzip, deflate, br',
              'Accept-Language': 'en-US,en;q=0.9',
              ...options.headers
            }
          };

          const response = await originalFetch(url, enhancedOptions);

          // Check if we should retry
          if (response.status === 406 || response.status >= 500) {
            const errorResult = this.handleHttpError(response);
            
            if (errorResult.retryable && attempt < maxRetries) {
              const delay = baseDelay * Math.pow(2, attempt);
              console.warn(`Retrying request after ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          }

          return response;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt);
            console.warn(`Network error, retrying after ${delay}ms:`, lastError.message);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
      }

      throw lastError || new Error('Max retries exceeded');
    };
  }
}

export default SupabaseErrorHandler;