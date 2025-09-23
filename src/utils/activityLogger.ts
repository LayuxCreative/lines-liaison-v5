import { supabase } from '../config/unifiedSupabase';

export interface ActivityLog {
  id?: string;
  project_id?: string;
  user_id?: string;
  action: string;
  details?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  status: 'success' | 'error' | 'warning' | 'info';
  error_message?: string;
  duration_ms?: number;
}

export interface LoggerConfig {
  enableConsoleLog: boolean;
  enableDatabaseLog: boolean;
  enableErrorTracking: boolean;
  maxRetries: number;
  batchSize: number;
  flushInterval: number;
}

class ActivityLogger {
  private config: LoggerConfig = {
    enableConsoleLog: true,
    enableDatabaseLog: false, // Temporarily disabled to prevent login issues
    enableErrorTracking: true,
    maxRetries: 3,
    batchSize: 10,
    flushInterval: 5000
  };

  private logQueue: ActivityLog[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor() {
    this.startBatchProcessor();
  }

  private startBatchProcessor(): void {
    this.flushTimer = setInterval(() => {
      this.flushLogs();
    }, this.config.flushInterval);
  }

  private async flushLogs(): Promise<void> {
    if (this.isProcessing || this.logQueue.length === 0 || !this.config.enableDatabaseLog) return;

    this.isProcessing = true;
    const logsToProcess = this.logQueue.splice(0, this.config.batchSize);

    try {
      await this.saveBatchToDatabase(logsToProcess);
    } catch (error) {
      console.warn('Failed to flush activity logs (non-blocking):', error);
      // Don't re-add failed logs to prevent infinite retry loops
    } finally {
      this.isProcessing = false;
    }
  }

  private async saveBatchToDatabase(logs: ActivityLog[]): Promise<void> {
    if (!this.config.enableDatabaseLog) return;

    try {
      const { error } = await supabase
        .from('activities')
        .insert(logs.map(log => ({
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          project_id: log.project_id || 'system',
          user_id: log.user_id || null,
          action: log.action,
          description: log.details || log.action,
          timestamp: log.timestamp || new Date().toISOString(),
          metadata: log.metadata || {}
        })));

      if (error) {
        throw new Error(`Database insert failed: ${error.message}`);
      }
    } catch (error) {
      // Log error but don't throw to prevent blocking other operations
      console.warn('Activity logging failed:', error);
    }
  }

  private async getUserInfo(): Promise<{ user_id?: string; session_id?: string }> {
    try {
      const { data } = await supabase.auth.getSession();
      return {
        user_id: data?.session?.user?.id,
        session_id: data?.session?.access_token?.substring(0, 10)
      };
    } catch {
      return {};
    }
  }

  private getBrowserInfo(): { ip_address?: string; user_agent?: string } {
    return {
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      ip_address: 'client'
    };
  }

  public async log(
    action: string,
    status: ActivityLog['status'] = 'info',
    details?: string,
    metadata?: Record<string, any>,
    error?: Error
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const userInfo = await this.getUserInfo();
      const logEntry: ActivityLog = {
        action,
        status,
        details,
        metadata,
        timestamp: new Date().toISOString(),
        error_message: error?.message,
        duration_ms: Date.now() - startTime,
        ...userInfo,
        ...this.getBrowserInfo()
      };

      // Console logging (always enabled for debugging)
      if (this.config.enableConsoleLog) {
        this.logToConsole(logEntry);
      }

      // Add to queue for batch processing (only if database logging is enabled)
      if (this.config.enableDatabaseLog) {
        this.logQueue.push(logEntry);
      }

    } catch (logError) {
      // Don't throw errors from logging to prevent blocking main operations
      console.warn('Failed to create activity log:', logError);
    }
  }

  private logToConsole(log: ActivityLog): void {
    const timestamp = new Date(log.timestamp!).toLocaleTimeString();
    const prefix = `[${timestamp}] [${log.status.toUpperCase()}]`;
    
    switch (log.status) {
      case 'error':
        console.error(`${prefix} ${log.action}:`, log.details, log.error_message);
        break;
      case 'warning':
        console.warn(`${prefix} ${log.action}:`, log.details);
        break;
      case 'success':
        console.log(`${prefix} ${log.action}:`, log.details);
        break;
      default:
        console.info(`${prefix} ${log.action}:`, log.details);
    }
  }

  // Convenience methods
  public async logSuccess(action: string, details?: string, metadata?: Record<string, any>): Promise<void> {
    return this.log(action, 'success', details, metadata);
  }

  public async logError(action: string, error: Error, details?: string, metadata?: Record<string, any>): Promise<void> {
    return this.log(action, 'error', details, metadata, error);
  }

  public async logWarning(action: string, details?: string, metadata?: Record<string, any>): Promise<void> {
    return this.log(action, 'warning', details, metadata);
  }

  public async logInfo(action: string, details?: string, metadata?: Record<string, any>): Promise<void> {
    return this.log(action, 'info', details, metadata);
  }

  // Auth specific methods (non-blocking)
  public async logLogin(userId: string, method: string = 'email'): Promise<void> {
    try {
      const log: ActivityLog = {
        id: `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        action: 'user_login',
        details: `User logged in via ${method}`,
        metadata: { login_method: method },
        status: 'success',
        timestamp: new Date().toISOString()
      };
      
      if (this.config.enableConsoleLog) {
        this.logToConsole(log);
      }

      if (this.config.enableDatabaseLog) {
        this.logQueue.push(log);
      }
    } catch (error) {
      console.warn('Login logging failed (non-blocking):', error);
    }
  }

  public async logLogout(userId?: string): Promise<void> {
    try {
      const log: ActivityLog = {
        id: `logout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        action: 'user_logout',
        details: 'User logged out',
        metadata: {},
        status: 'success',
        timestamp: new Date().toISOString()
      };
      
      if (this.config.enableConsoleLog) {
        this.logToConsole(log);
      }

      if (this.config.enableDatabaseLog) {
        this.logQueue.push(log);
      }
    } catch (error) {
      console.warn('Logout logging failed (non-blocking):', error);
    }
  }

  public async logAuthError(action: string, error: Error): Promise<void> {
    return this.logError(`auth_${action}`, error, `Authentication ${action} failed`);
  }

  // Activity specific methods
  public async logActivity(action: string, details?: string, metadata?: Record<string, any>): Promise<void> {
    return this.logInfo(`activity_${action}`, details, metadata);
  }

  public async logApiCall(endpoint: string, method: string, status: number, duration: number): Promise<void> {
    const statusType: ActivityLog['status'] = status >= 400 ? 'error' : status >= 300 ? 'warning' : 'success';
    return this.log(
      'api_call',
      statusType,
      `${method} ${endpoint} - ${status}`,
      { endpoint, method, status_code: status, duration_ms: duration }
    );
  }

  public async logUserAction(action: string, details?: string, metadata?: Record<string, any>): Promise<void> {
    return this.logInfo(`user_action_${action}`, details, metadata);
  }

  public async logSystemEvent(event: string, details?: string, metadata?: Record<string, any>): Promise<void> {
    return this.logInfo(`system_${event}`, details, metadata);
  }

  // Configuration methods
  public updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public enableDatabaseLogging(): void {
    this.config.enableDatabaseLog = true;
  }

  public disableDatabaseLogging(): void {
    this.config.enableDatabaseLog = false;
  }

  public getQueueSize(): number {
    return this.logQueue.length;
  }

  public async forceFlush(): Promise<void> {
    if (this.config.enableDatabaseLog) {
      await this.flushLogs();
    }
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    // Don't force flush on destroy to prevent blocking shutdown
  }
}

// Export singleton instance
export const activityLogger = new ActivityLogger();

// Legacy compatibility
export const logActivity = activityLogger.log.bind(activityLogger);

// Auto cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    activityLogger.destroy();
  });
}