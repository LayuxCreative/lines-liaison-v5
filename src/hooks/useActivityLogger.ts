import { useCallback } from 'react';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';

export interface ActivityMetadata {
  [key: string]: unknown;
}

export const useActivityLogger = () => {
  const { user } = useAuth();

  // Base activity logging function
  const logActivity = useCallback(async (
    eventType: string,
    targetId: string | undefined,
    targetType: string,
    metadata: ActivityMetadata
  ) => {
    if (!user) return;

    try {
      await supabaseService.createActivity({
        event_type: eventType,
        target_id: targetId,
        target_type: targetType,
        metadata: {
          user_id: user.id,
          actor_email: user.email,
          ...metadata
        }
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }, [user]);

  // Specific activity logging methods
  const logLogin = useCallback(() => {
    logActivity('login', user?.id, 'user', {
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent
    });
  }, [logActivity, user]);

  const logLogout = useCallback(() => {
    logActivity('logout', user?.id, 'user', {
      timestamp: new Date().toISOString()
    });
  }, [logActivity, user]);

  const logProfileUpdate = useCallback((updatedFields: string[]) => {
    logActivity('profile_update', user?.id, 'user', {
      updated_fields: updatedFields,
      timestamp: new Date().toISOString()
    });
  }, [logActivity, user]);

  const logProjectCreate = useCallback((projectId: string, projectName: string) => {
    logActivity('project_create', projectId, 'project', {
      project_name: projectName,
      timestamp: new Date().toISOString()
    });
  }, [logActivity]);

  const logProjectUpdate = useCallback((projectId: string, updatedFields: string[]) => {
    logActivity('project_update', projectId, 'project', {
      updated_fields: updatedFields,
      timestamp: new Date().toISOString()
    });
  }, [logActivity]);

  const logProjectDelete = useCallback((projectId: string, projectName: string) => {
    logActivity('project_delete', projectId, 'project', {
      project_name: projectName,
      timestamp: new Date().toISOString()
    });
  }, [logActivity]);

  const logFileUpload = useCallback((fileName: string, fileSize: number, projectId?: string) => {
    logActivity('file_upload', projectId, 'file', {
      file_name: fileName,
      file_size: fileSize,
      timestamp: new Date().toISOString()
    });
  }, [logActivity]);

  const logFileDownload = useCallback((fileName: string, projectId?: string) => {
    logActivity('file_download', projectId, 'file', {
      file_name: fileName,
      timestamp: new Date().toISOString()
    });
  }, [logActivity]);

  const logTaskCreate = useCallback((taskId: string, taskTitle: string, projectId?: string) => {
    logActivity('task_create', taskId, 'task', {
      task_title: taskTitle,
      project_id: projectId,
      timestamp: new Date().toISOString()
    });
  }, [logActivity]);

  const logTaskUpdate = useCallback((taskId: string, updatedFields: string[], projectId?: string) => {
    logActivity('task_update', taskId, 'task', {
      updated_fields: updatedFields,
      project_id: projectId,
      timestamp: new Date().toISOString()
    });
  }, [logActivity]);

  const logTaskComplete = useCallback((taskId: string, taskTitle: string, projectId?: string) => {
    logActivity('task_complete', taskId, 'task', {
      task_title: taskTitle,
      project_id: projectId,
      timestamp: new Date().toISOString()
    });
  }, [logActivity]);

  return {
    logActivity,
    logLogin,
    logLogout,
    logProfileUpdate,
    logProjectCreate,
    logProjectUpdate,
    logProjectDelete,
    logFileUpload,
    logFileDownload,
    logTaskCreate,
    logTaskUpdate,
    logTaskComplete
  };
};