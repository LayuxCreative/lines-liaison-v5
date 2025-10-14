import * as Sentry from '@sentry/react';

interface PerformanceMetric {
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  timestamp?: number;
  [key: string]: unknown;
}



// Performance monitoring configuration
export const initializePerformanceMonitoring = () => {
  // Initialize Sentry for error tracking (only if DSN is provided)
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  if (sentryDsn) {
    try {
      Sentry.init({
        dsn: sentryDsn,
        environment: import.meta.env.MODE,
        tracesSampleRate: 1.0,
        integrations: [
          Sentry.browserTracingIntegration(),
        ],
      });
    } catch (error) {
      console.warn('Sentry initialization failed:', error);
    }
  }

  // Initialize Web Vitals monitoring
  initializeWebVitals();
};

// Web Vitals monitoring
const initializeWebVitals = async () => {
  try {
    const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');
    
    onCLS(onPerfEntry);
    onFCP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
    onINP(onPerfEntry); // INP replaces FID in v5
  } catch (error) {
    console.warn('Web Vitals not available:', error);
  }
};

const onPerfEntry = (metric: { name: string; value: number; [key: string]: unknown }) => {
  // Log performance metrics
  console.log(`Performance metric: ${metric.name}`, metric);
  
  // Send to analytics service
  sendPerformanceMetric(metric);
  
  // Send to Sentry for monitoring
  Sentry.addBreadcrumb({
    category: 'performance',
    message: `${metric.name}: ${metric.value}`,
    level: 'info',
    data: metric,
  });
};

// Performance metrics tracking
export const sendPerformanceMetric = (metric: PerformanceMetric) => {
  // Store locally for dashboard
  const metrics = getStoredMetrics();
  metrics.push({
    ...metric,
    timestamp: Date.now(),
  });
  
  // Keep only last 100 metrics
  if (metrics.length > 100) {
    metrics.splice(0, metrics.length - 100);
  }
  
  localStorage.setItem('performance_metrics', JSON.stringify(metrics));
};

export const getStoredMetrics = (): PerformanceMetric[] => {
  try {
    const stored = localStorage.getItem('performance_metrics');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Error tracking utilities
export const logError = (error: Error, context?: Record<string, unknown>) => {
  console.error('Application Error:', error, context);
  
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
};

export const logWarning = (message: string, context?: Record<string, unknown>) => {
  console.warn('Application Warning:', message, context);
  
  Sentry.captureMessage(message, 'warning');
  Sentry.addBreadcrumb({
    message,
    level: 'warning',
    data: context,
  });
};

// Performance timing utilities
export const measurePerformance = <T extends (...args: unknown[]) => Promise<unknown>>(name: string, fn: T) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const start = performance.now();
    
    try {
      const result = await fn(...args);
      const duration = performance.now() - start;
      
      // Log performance timing
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
      
      // Send timing metric
      sendPerformanceMetric({
        name: `custom_${name}`,
        value: duration,
        rating: duration < 100 ? 'good' : duration < 300 ? 'needs-improvement' : 'poor',
      });
      
      return result as ReturnType<T>;
    } catch (error) {
      const duration = performance.now() - start;
      logError(error as Error, { operation: name, duration });
      throw error;
    }
  };
};

// User session tracking
export const trackUserSession = (userId: string) => {
  Sentry.setUser({ id: userId });
  
  // Track session start
  Sentry.addBreadcrumb({
    category: 'session',
    message: 'User session started',
    level: 'info',
    data: { userId },
  });
};

export const trackPageView = (pageName: string) => {
  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `Page view: ${pageName}`,
    level: 'info',
  });
};

// API performance tracking
export const trackApiCall = async (
  url: string,
  method: string,
  body?: Record<string, unknown>
) => {
  const start = performance.now();
  
  try {
    const response = await fetch(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const duration = performance.now() - start;
    
    // Track API performance
    sendPerformanceMetric({
      name: 'api_call',
      value: duration,
      rating: duration < 200 ? 'good' : duration < 500 ? 'needs-improvement' : 'poor',
      url,
      method,
      status: response.status,
    });
    
    return response;
  } catch (error) {
    const duration = performance.now() - start;
    logError(error as Error, { url, method, duration });
    throw error;
  }
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    
    const memoryInfo = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
    
    sendPerformanceMetric({
      name: 'memory_usage',
      value: memory.usedJSHeapSize,
      ...memoryInfo,
    });
  }
};

// Start memory monitoring
setInterval(monitorMemoryUsage, 30000); // Every 30 seconds