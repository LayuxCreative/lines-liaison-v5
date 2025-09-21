import { supabase } from '../config/supabase';

// Enhanced connection utility with automatic retry and circuit breaker pattern
interface ConnectionMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  lastRequestTime: Date | null;
}

interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: Date | null;
  nextAttemptTime: Date | null;
}

interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

interface QueryResult<T> {
  data: T | null;
  error: SupabaseError | null;
}

interface EnhancedMetrics extends ConnectionMetrics, CircuitBreakerState {
  successRate: number;
}

class EnhancedConnection {
  private metrics: ConnectionMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLatency: 0,
    lastRequestTime: null
  };

  private circuitBreaker: CircuitBreakerState = {
    isOpen: false,
    failureCount: 0,
    lastFailureTime: null,
    nextAttemptTime: null
  };

  private readonly maxFailures = 5;
  private readonly circuitBreakerTimeout = 60000; // 1 minute

  // Execute query with automatic retry and circuit breaker
  async executeQuery<T>(
    queryFn: () => Promise<QueryResult<T>>,
    maxRetries: number = 3
  ): Promise<QueryResult<T>> {
    // Check circuit breaker
    if (this.isCircuitBreakerOpen()) {
      return {
        data: null,
        error: { message: 'Circuit breaker is open. Service temporarily unavailable.' }
      };
    }

    const startTime = Date.now();
    let lastError: SupabaseError | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.metrics.totalRequests++;
        this.metrics.lastRequestTime = new Date();

        const result = await queryFn();

        if (!result.error) {
          // Success - update metrics and reset circuit breaker
          this.metrics.successfulRequests++;
          this.updateLatency(Date.now() - startTime);
          this.resetCircuitBreaker();
          return result;
        }

        lastError = result.error;
        
        // If it's the last attempt, don't wait
        if (attempt < maxRetries) {
          const delay = this.calculateBackoffDelay(attempt);
          console.log(`Query attempt ${attempt} failed, retrying in ${delay}ms...`);
          await this.delay(delay);
        }

      } catch (error) {
          lastError = error instanceof Error 
            ? { message: error.message } 
            : { message: 'Unknown error occurred' };
          
          if (attempt < maxRetries) {
            const delay = this.calculateBackoffDelay(attempt);
            console.log(`Query attempt ${attempt} failed with error, retrying in ${delay}ms...`);
            await this.delay(delay);
          }
        }
      }

      // All attempts failed
      this.metrics.failedRequests++;
      this.recordFailure();

      return {
        data: null,
        error: lastError || { message: 'All retry attempts failed' }
      };
    }

    // Calculate exponential backoff delay
    private calculateBackoffDelay(attempt: number): number {
      const baseDelay = 1000; // 1 second
      const maxDelay = 30000; // 30 seconds
      const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
      
      return Math.min(baseDelay * Math.pow(2, attempt - 1) + jitter, maxDelay);
    }

    // Check if circuit breaker is open
    private isCircuitBreakerOpen(): boolean {
      if (!this.circuitBreaker.isOpen) {
        return false;
      }

      // Check if it's time to attempt a half-open state
      if (this.circuitBreaker.nextAttemptTime && new Date() >= this.circuitBreaker.nextAttemptTime) {
        this.circuitBreaker.isOpen = false;
        console.log('Circuit breaker moving to half-open state');
        return false;
      }

      return true;
    }

    // Record a failure and potentially open circuit breaker
    private recordFailure(): void {
      this.circuitBreaker.failureCount++;
      this.circuitBreaker.lastFailureTime = new Date();

      if (this.circuitBreaker.failureCount >= this.maxFailures) {
        this.circuitBreaker.isOpen = true;
        this.circuitBreaker.nextAttemptTime = new Date(Date.now() + this.circuitBreakerTimeout);
        console.log(`Circuit breaker opened due to ${this.circuitBreaker.failureCount} failures`);
      }
    }

    // Reset circuit breaker on successful request
    private resetCircuitBreaker(): void {
      if (this.circuitBreaker.failureCount > 0 || this.circuitBreaker.isOpen) {
        console.log('Circuit breaker reset - connection stable');
      }
      
      this.circuitBreaker.isOpen = false;
      this.circuitBreaker.failureCount = 0;
      this.circuitBreaker.lastFailureTime = null;
      this.circuitBreaker.nextAttemptTime = null;
    }

    // Update average latency
    private updateLatency(latency: number): void {
      const totalLatency = this.metrics.averageLatency * (this.metrics.successfulRequests - 1) + latency;
      this.metrics.averageLatency = totalLatency / this.metrics.successfulRequests;
    }

    // Utility delay function
    private delay(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get connection metrics
    getMetrics(): EnhancedMetrics {
      return {
        ...this.metrics,
        ...this.circuitBreaker,
        successRate: this.metrics.totalRequests > 0 
          ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
          : 0
      };
    }

    // Test connection health
    async testConnection(): Promise<boolean> {
      const result = await this.executeQuery(async () => {
        return await supabase
          .from('activities')
          .select('id')
          .limit(1);
      }, 1); // Single attempt for health check

      return !result.error;
    }
  }

  // Export singleton instance
  export const enhancedConnection = new EnhancedConnection();

  // Helper functions for common operations
  export const executeWithRetry = <T>(
    queryFn: () => Promise<QueryResult<T>>,
    maxRetries?: number
  ) => enhancedConnection.executeQuery(queryFn, maxRetries);

  export const getConnectionMetrics = () => enhancedConnection.getMetrics();

  export const testConnectionHealth = () => enhancedConnection.testConnection();