import { useState, useEffect, useRef } from 'react';

export interface RealtimeMetrics {
  // Connection metrics
  connectionUptime: number; // in milliseconds
  reconnectionCount: number;
  lastReconnection: Date | null;
  
  // Performance metrics
  averageLatency: number; // in milliseconds
  messageCount: number;
  messagesPerSecond: number;
  
  // Error metrics
  errorCount: number;
  errorRate: number; // errors per minute
  lastError: Date | null;
  
  // Health score (0-100)
  healthScore: number;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';
}

export interface PerformanceThresholds {
  latencyWarning: number; // ms
  latencyError: number; // ms
  errorRateWarning: number; // errors per minute
  errorRateError: number; // errors per minute
  uptimeTarget: number; // percentage
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  latencyWarning: 1000, // 1 second
  latencyError: 3000, // 3 seconds
  errorRateWarning: 5, // 5 errors per minute
  errorRateError: 10, // 10 errors per minute
  uptimeTarget: 99.5 // 99.5% uptime
};

export const useRealtimeMetrics = (thresholds: Partial<PerformanceThresholds> = {}) => {
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    connectionUptime: 0,
    reconnectionCount: 0,
    lastReconnection: null,
    averageLatency: 0,
    messageCount: 0,
    messagesPerSecond: 0,
    errorCount: 0,
    errorRate: 0,
    lastError: null,
    healthScore: 100,
    status: 'disconnected'
  });

  const config = { ...DEFAULT_THRESHOLDS, ...thresholds };
  
  // Refs for tracking
  const startTimeRef = useRef<Date>(new Date());
  const lastMessageTimeRef = useRef<Date>(new Date());
  const latencyMeasurementsRef = useRef<number[]>([]);
  const messageTimestampsRef = useRef<Date[]>([]);
  const errorTimestampsRef = useRef<Date[]>([]);
  const connectionStartRef = useRef<Date>(new Date());
  const totalDowntimeRef = useRef<number>(0);

  // Calculate health score based on various metrics
  const calculateHealthScore = (): number => {
    let score = 100;
    
    // Latency impact (0-30 points)
    if (metrics.averageLatency > config.latencyError) {
      score -= 30;
    } else if (metrics.averageLatency > config.latencyWarning) {
      score -= 15;
    }
    
    // Error rate impact (0-25 points)
    if (metrics.errorRate > config.errorRateError) {
      score -= 25;
    } else if (metrics.errorRate > config.errorRateWarning) {
      score -= 12;
    }
    
    // Connection stability impact (0-25 points)
    if (metrics.reconnectionCount > 10) {
      score -= 25;
    } else if (metrics.reconnectionCount > 5) {
      score -= 12;
    }
    
    // Uptime impact (0-20 points)
    const totalTime = Date.now() - startTimeRef.current.getTime();
    const uptime = ((totalTime - totalDowntimeRef.current) / totalTime) * 100;
    if (uptime < config.uptimeTarget - 5) {
      score -= 20;
    } else if (uptime < config.uptimeTarget) {
      score -= 10;
    }
    
    return Math.max(0, Math.min(100, score));
  };

  // Determine status based on health score
  const getStatus = (score: number): RealtimeMetrics['status'] => {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 30) return 'poor';
    return 'disconnected';
  };

  // Record a new message
  const recordMessage = (latency?: number) => {
    const now = new Date();
    lastMessageTimeRef.current = now;
    
    // Add to message timestamps (keep last 100)
    messageTimestampsRef.current.push(now);
    if (messageTimestampsRef.current.length > 100) {
      messageTimestampsRef.current = messageTimestampsRef.current.slice(-100);
    }
    
    // Record latency if provided
    if (latency !== undefined) {
      latencyMeasurementsRef.current.push(latency);
      if (latencyMeasurementsRef.current.length > 50) {
        latencyMeasurementsRef.current = latencyMeasurementsRef.current.slice(-50);
      }
    }
    
    updateMetrics();
  };

  // Record an error
  const recordError = () => {
    const now = new Date();
    errorTimestampsRef.current.push(now);
    
    // Keep only errors from last hour
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    errorTimestampsRef.current = errorTimestampsRef.current.filter(timestamp => timestamp > oneHourAgo);
    
    updateMetrics();
  };

  // Record a reconnection
  const recordReconnection = () => {
    const now = new Date();
    
    // Calculate downtime
    const downtime = now.getTime() - connectionStartRef.current.getTime();
    totalDowntimeRef.current += downtime;
    
    // Reset connection start time
    connectionStartRef.current = now;
    
    setMetrics(prev => ({
      ...prev,
      reconnectionCount: prev.reconnectionCount + 1,
      lastReconnection: now
    }));
    
    updateMetrics();
  };

  // Record connection established
  const recordConnection = () => {
    connectionStartRef.current = new Date();
    updateMetrics();
  };

  // Update all metrics
  const updateMetrics = () => {
    const now = new Date();
    
    // Calculate uptime
    const totalTime = now.getTime() - startTimeRef.current.getTime();
    const uptime = totalTime - totalDowntimeRef.current;
    
    // Calculate average latency
    const avgLatency = latencyMeasurementsRef.current.length > 0
      ? latencyMeasurementsRef.current.reduce((sum, lat) => sum + lat, 0) / latencyMeasurementsRef.current.length
      : 0;
    
    // Calculate messages per second
    const recentMessages = messageTimestampsRef.current.filter(
      timestamp => now.getTime() - timestamp.getTime() < 60000 // last minute
    );
    const messagesPerSecond = recentMessages.length / 60;
    
    // Calculate error rate (errors per minute)
    const recentErrors = errorTimestampsRef.current.filter(
      timestamp => now.getTime() - timestamp.getTime() < 60000 // last minute
    );
    const errorRate = recentErrors.length;
    
    const newMetrics: RealtimeMetrics = {
      connectionUptime: uptime,
      reconnectionCount: metrics.reconnectionCount,
      lastReconnection: metrics.lastReconnection,
      averageLatency: avgLatency,
      messageCount: messageTimestampsRef.current.length,
      messagesPerSecond,
      errorCount: errorTimestampsRef.current.length,
      errorRate,
      lastError: errorTimestampsRef.current.length > 0 
        ? errorTimestampsRef.current[errorTimestampsRef.current.length - 1] 
        : null,
      healthScore: 0, // Will be calculated below
      status: 'disconnected'
    };
    
    // Calculate health score
    const healthScore = calculateHealthScore();
    newMetrics.healthScore = healthScore;
    newMetrics.status = getStatus(healthScore);
    
    setMetrics(newMetrics);
  };

  // Reset all metrics
  const resetMetrics = () => {
    startTimeRef.current = new Date();
    connectionStartRef.current = new Date();
    totalDowntimeRef.current = 0;
    latencyMeasurementsRef.current = [];
    messageTimestampsRef.current = [];
    errorTimestampsRef.current = [];
    
    setMetrics({
      connectionUptime: 0,
      reconnectionCount: 0,
      lastReconnection: null,
      averageLatency: 0,
      messageCount: 0,
      messagesPerSecond: 0,
      errorCount: 0,
      errorRate: 0,
      lastError: null,
      healthScore: 100,
      status: 'disconnected'
    });
  };

  // Get performance recommendations
  const getRecommendations = (): string[] => {
    const recommendations: string[] = [];
    
    if (metrics.averageLatency > config.latencyWarning) {
      recommendations.push('High latency detected. Check network connection.');
    }
    
    if (metrics.errorRate > config.errorRateWarning) {
      recommendations.push('High error rate. Review error logs and connection stability.');
    }
    
    if (metrics.reconnectionCount > 5) {
      recommendations.push('Frequent reconnections. Consider checking network stability.');
    }
    
    if (metrics.messagesPerSecond < 0.1 && metrics.messageCount > 0) {
      recommendations.push('Low message throughput. Check subscription configuration.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance is optimal!');
    }
    
    return recommendations;
  };

  // Update metrics every 10 seconds
  useEffect(() => {
    const interval = setInterval(updateMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    recordMessage,
    recordError,
    recordReconnection,
    recordConnection,
    resetMetrics,
    getRecommendations,
    thresholds: config
  };
};