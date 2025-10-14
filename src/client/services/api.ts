interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    source: string;
  };
}

interface AuthToken {
  token: string;
  type: 'Bearer' | 'Basic';
}

class ApiService {
  private config: ApiConfig;
  private authToken: AuthToken | null = null;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
      timeout: 10000,
      retries: 3,
      ...config
    };
  }

  // Set authentication token
  setAuthToken(token: string, type: 'Bearer' | 'Basic' = 'Bearer') {
    this.authToken = { token, type };
  }

  // Clear authentication token
  clearAuthToken() {
    this.authToken = null;
  }

  // Get current auth token
  getAuthToken(): AuthToken | null {
    return this.authToken;
  }

  private async fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    // Add authentication header if available
    if (this.authToken) {
      headers['Authorization'] = `${this.authToken.type} ${this.authToken.token}`;
    }

    return headers;
  }

  async fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, {
          ...options,
          headers: this.getHeaders(options.headers as Record<string, string>),
          credentials: 'include', // Include cookies for session-based auth
        }, this.config.timeout);

        if (!response.ok) {
          // Handle rate limiting with exponential backoff
          if (response.status === 429 && attempt < this.config.retries) {
            const delay = Math.pow(2, attempt) * 1000;
            if (import.meta.env.DEV) {
              console.warn(`API: Rate limited, retrying in ${delay}ms (attempt ${attempt}/${this.config.retries})`);
            }
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          // Handle authentication errors
          if (response.status === 401) {
            return {
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Unauthorized - Please log in again',
                source: 'api'
              }
            };
          }

          if (response.status === 403) {
            return {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Forbidden - Insufficient permissions',
                source: 'api'
              }
            };
          }

          // Handle server errors
          if (response.status >= 500) {
            if (attempt < this.config.retries) {
              const delay = Math.pow(2, attempt) * 1000;
              if (import.meta.env.DEV) {
                console.warn(`API: Server error ${response.status}, retrying in ${delay}ms (attempt ${attempt}/${this.config.retries})`);
              }
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            return {
              success: false,
              error: {
                code: 'SERVER_ERROR',
                message: `Server error: ${response.status}`,
                source: 'api'
              }
            };
          }

          return {
            success: false,
            error: {
              code: 'HTTP_ERROR',
              message: `HTTP error: ${response.status}`,
              source: 'api'
            }
          };
        }

        const data = await response.json();
        
        // Handle different response formats
        if (data.success !== undefined) {
          return data;
        }
        
        return {
          success: true,
          data: data
        };

      } catch (error) {
        if (attempt === this.config.retries) {
          if (import.meta.env.DEV) {
            console.error(`API: Request failed for ${endpoint} after ${this.config.retries} attempts:`, error);
          }
          
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              return {
                success: false,
                error: {
                  code: 'TIMEOUT',
                  message: 'Request timeout - Please try again',
                  source: 'api'
                }
              };
            }
            return {
              success: false,
              error: {
                code: 'NETWORK_ERROR',
                message: error.message,
                source: 'api'
              }
            };
          }
          
          return {
            success: false,
            error: {
              code: 'NETWORK_ERROR',
              message: 'Network error - Please check your connection',
              source: 'api'
            }
          };
        }
        
        // Wait before retry
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      error: {
        code: 'MAX_RETRIES',
        message: 'Maximum retries exceeded',
        source: 'api'
      }
    };
  }

  // Convenience methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.fetchJson<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.fetchJson<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.fetchJson<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.fetchJson<T>(endpoint, { method: 'DELETE' });
  }
}

// Create and export a configured instance
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export const apiService = new ApiService({
  baseUrl: API_BASE_URL,
  timeout: 10000,
  retries: 3
});

export default apiService;