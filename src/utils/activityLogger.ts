export const activityLogger = {
  async log(action: string, level: 'info' | 'success' | 'warning' | 'error', description: string, metadata?: Record<string, unknown>) {
    try {
      // In development, just log to console
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${level.toUpperCase()}] ${action}: ${description}`, metadata || '');
      }
      
      // In production, send to backend for storage
      if (process.env.NODE_ENV === 'production') {
        // Temporary console log until backend endpoint is implemented
        console.log(`[BACKEND] ${action}: ${description}`, metadata || {});
      }
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }
};