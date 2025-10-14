import React, { useEffect, useCallback } from 'react';
import { supabaseService } from '../../services/supabaseService';

// Extend Window interface to include activityLogger
declare global {
  interface Window {
    activityLogger?: {
      logUserLogin: () => void;
      logUserLogout: () => void;
      log: (message: string) => void;
    };
  }
}

interface RealtimeActivityLoggerProps {
  userId: string;
  userEmail: string;
}

export const RealtimeActivityLogger: React.FC<RealtimeActivityLoggerProps> = ({
  userId,
  userEmail
}) => {
  const logActivity = useCallback(async (
    eventType: string,
    description: string,
    metadata?: Record<string, unknown>
  ) => {
    try {
      const activity = await supabaseService.createActivity({
        event_type: eventType,
        target_id: userId,
        target_type: 'user',
        metadata: {
          ...metadata,
          description,
          user_id: userId,
          user_email: userEmail
        }
      });

      return activity;
    } catch (error) {
      console.error('Failed to log activity:', error);
      throw error;
    }
  }, [userId, userEmail]);

  // Activity logging methods
  const logUserLogin = useCallback(() => {
    logActivity(
      'login',
      `${userEmail} logged in`,
      { login_time: new Date().toISOString() }
    );
  }, [logActivity, userEmail]);

  const logUserLogout = useCallback(() => {
    logActivity(
      'logout',
      `${userEmail} logged out`,
      { logout_time: new Date().toISOString() }
    );
  }, [logActivity, userEmail]);

  // Expose methods globally for use by other components
  useEffect(() => {
    window.activityLogger = {
      logUserLogin,
      logUserLogout,
      log: (message: string) => {
        console.log(`[Activity Logger]: ${message}`);
      }
    };

    return () => {
      delete window.activityLogger;
    };
  }, [logUserLogin, logUserLogout]);

  // Auto-log user login when component mounts (regardless of realtime connection)
  useEffect(() => {
    logUserLogin();
  }, [logUserLogin]);

  // Auto-log user logout when component unmounts
  useEffect(() => {
    return () => {
      logUserLogout();
    };
  }, [logUserLogout]);



  // This component doesn't render anything visible
  return null;
};

export default RealtimeActivityLogger;