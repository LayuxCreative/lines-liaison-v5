import { useEffect, useState, useCallback } from 'react';
import { realtimeService, RealtimeMessage, RealtimeUser } from '../services/realtime/RealtimeService';
import { projectChannelsManager, ProjectChannel, TaskChannel } from '../services/realtime/ProjectChannels';

export interface UseRealtimeOptions {
  userId?: string;
  username?: string;
  autoConnect?: boolean;
}

export interface UseRealtimeReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  messages: RealtimeMessage[];
  activeUsers: RealtimeUser[];
  activeProjectChannels: ProjectChannel[];
  activeTaskChannels: TaskChannel[];
  
  // Connection methods
  connect: (user: RealtimeUser) => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Channel methods
  joinProjectChannel: (projectId: string, projectName: string) => Promise<void>;
  leaveProjectChannel: (projectId: string) => Promise<void>;
  joinTaskChannel: (taskId: string, taskTitle: string, projectId: string, assignees?: string[]) => Promise<void>;
  leaveTaskChannel: (taskId: string) => Promise<void>;
  joinTeamChannel: (teamId: string, teamName: string) => Promise<void>;
  leaveTeamChannel?: (teamId: string) => Promise<void>;
  joinGeneralChannel: () => Promise<void>;
  leaveGeneralChannel?: () => Promise<void>;
  
  // Messaging methods
  sendProjectMessage: (projectId: string, message: string) => Promise<void>;
  sendTaskMessage: (taskId: string, message: string) => Promise<void>;
  sendTeamMessage: (teamId: string, message: string) => Promise<void>;
  sendGeneralMessage: (message: string) => Promise<void>;
  
  // Update methods
  sendProjectUpdate: (projectId: string, updateType: string, updateData: Record<string, unknown>) => Promise<void>;
  sendTaskUpdate: (taskId: string, updateType: string, updateData: Record<string, unknown>) => Promise<void>;
  
  // Typing indicators
  sendTypingIndicator: (channelType: string, channelId: string, isTyping: boolean) => Promise<void>;
  
  // Utility methods
  clearMessages: () => void;
  getChannelParticipants: (channelType: string, channelId: string) => RealtimeUser[];
}

export const useRealtime = (options: UseRealtimeOptions = {}): UseRealtimeReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [activeUsers, setActiveUsers] = useState<RealtimeUser[]>([]);
  const [activeProjectChannels, setActiveProjectChannels] = useState<ProjectChannel[]>([]);
  const [activeTaskChannels, setActiveTaskChannels] = useState<TaskChannel[]>([]);

  // Connection methods
  const connect = useCallback(async (user: RealtimeUser) => {
    try {
      setIsConnecting(true);
      setError(null);
      
      await realtimeService.initializeUser(user.id, user.name);
      setIsConnected(true);
      
      console.log('✅ Connected to Realtime service');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Realtime service';
      setError(errorMessage);
      console.error('❌ Failed to connect to Realtime:', err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await projectChannelsManager.disconnectAll();
      await realtimeService.disconnect();
      setIsConnected(false);
      setMessages([]);
      setActiveUsers([]);
      setActiveProjectChannels([]);
      setActiveTaskChannels([]);
      
      console.log('✅ Disconnected from Realtime service');
    } catch (err) {
      console.error('❌ Failed to disconnect from Realtime:', err);
    }
  }, []);

  // Channel methods
  const joinProjectChannel = useCallback(async (projectId: string, projectName: string) => {
    try {
      await projectChannelsManager.joinProjectChannel(projectId, projectName);
      setActiveProjectChannels(projectChannelsManager.getActiveProjectChannels());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join project channel';
      setError(errorMessage);
    }
  }, []);

  const leaveProjectChannel = useCallback(async (projectId: string) => {
    try {
      await projectChannelsManager.leaveProjectChannel(projectId);
      setActiveProjectChannels(projectChannelsManager.getActiveProjectChannels());
    } catch (err) {
      console.error('❌ Failed to leave project channel:', err);
    }
  }, []);

  const joinTaskChannel = useCallback(async (taskId: string, taskTitle: string, projectId: string, assignees: string[] = []) => {
    try {
      await projectChannelsManager.joinTaskChannel(taskId, taskTitle, projectId, assignees);
      setActiveTaskChannels(projectChannelsManager.getActiveTaskChannels());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join task channel';
      setError(errorMessage);
    }
  }, []);

  const leaveTaskChannel = useCallback(async (taskId: string) => {
    try {
      await projectChannelsManager.leaveTaskChannel(taskId);
      setActiveTaskChannels(projectChannelsManager.getActiveTaskChannels());
    } catch (err) {
      console.error('❌ Failed to leave task channel:', err);
    }
  }, []);

  const joinTeamChannel = useCallback(async (teamId: string, teamName: string) => {
    try {
      await projectChannelsManager.joinTeamChannel(teamId, teamName);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join team channel';
      setError(errorMessage);
    }
  }, []);

  const joinGeneralChannel = useCallback(async () => {
    try {
      await projectChannelsManager.joinGeneralChannel();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join general channel';
      setError(errorMessage);
    }
  }, []);

  // Messaging methods
  const sendProjectMessage = useCallback(async (projectId: string, message: string) => {
    try {
      await projectChannelsManager.sendProjectMessage(projectId, message);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send project message';
      setError(errorMessage);
    }
  }, []);

  const sendTaskMessage = useCallback(async (taskId: string, message: string) => {
    try {
      await projectChannelsManager.sendTaskMessage(taskId, message);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send task message';
      setError(errorMessage);
    }
  }, []);

  const sendTeamMessage = useCallback(async (teamId: string, message: string) => {
    try {
      await projectChannelsManager.sendTeamMessage(teamId, message);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send team message';
      setError(errorMessage);
    }
  }, []);

  const sendGeneralMessage = useCallback(async (message: string) => {
    try {
      await projectChannelsManager.sendGeneralMessage(message);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send general message';
      setError(errorMessage);
    }
  }, []);

  // Update methods
  const sendProjectUpdate = useCallback(async (projectId: string, updateType: string, updateData: Record<string, unknown>) => {
    try {
      await projectChannelsManager.sendProjectUpdate(projectId, updateType, updateData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send project update';
      setError(errorMessage);
    }
  }, []);

  const sendTaskUpdate = useCallback(async (taskId: string, updateType: string, updateData: Record<string, unknown>) => {
    try {
      await projectChannelsManager.sendTaskUpdate(taskId, updateType, updateData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send task update';
      setError(errorMessage);
    }
  }, []);

  // Typing indicators
  const sendTypingIndicator = useCallback(async (channelType: string, channelId: string, isTyping: boolean) => {
    try {
      await projectChannelsManager.sendTypingIndicator(channelType, channelId, isTyping);
    } catch (err) {
      console.error('❌ Failed to send typing indicator:', err);
    }
  }, []);

  // Utility methods
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const getChannelParticipants = useCallback((channelType: string, channelId: string): RealtimeUser[] => {
    return projectChannelsManager.getChannelParticipants(channelType, channelId);
  }, []);

  // Event listeners
  useEffect(() => {
    const handleMessage = (data: unknown) => {
      const message = data as RealtimeMessage;
      setMessages(prev => [...prev, message]);
    };

    const handleUserJoin = (data: unknown) => {
      const user = data as RealtimeUser;
      setActiveUsers(prev => {
        const exists = prev.find(u => u.id === user.id);
        if (exists) return prev;
        return [...prev, user];
      });
    };

    const handleUserLeave = (data: unknown) => {
      const user = data as RealtimeUser;
      setActiveUsers(prev => prev.filter(u => u.id !== user.id));
    };

    const handleConnectionChange = (data: unknown) => {
      const connected = data as boolean;
      setIsConnected(connected);
      if (!connected) {
        setActiveUsers([]);
        setActiveProjectChannels([]);
        setActiveTaskChannels([]);
      }
    };

    // Subscribe to events
    realtimeService.on('message', handleMessage);
    realtimeService.on('presence_join', handleUserJoin);
    realtimeService.on('presence_leave', handleUserLeave);
    realtimeService.on('connection_change', handleConnectionChange);

    return () => {
      // Cleanup event listeners
      realtimeService.off('message', handleMessage);
      realtimeService.off('presence_join', handleUserJoin);
      realtimeService.off('presence_leave', handleUserLeave);
      realtimeService.off('connection_change', handleConnectionChange);
    };
  }, []);

  // Auto-connect if options provided
  useEffect(() => {
    if (options.autoConnect && options.userId && options.username && !isConnected && !isConnecting) {
      const user: RealtimeUser = {
        id: options.userId,
        name: options.username,
        status: 'online',
        lastSeen: new Date()
      };
      connect(user);
    }
  }, [options.autoConnect, options.userId, options.username, isConnected, isConnecting, connect]);

  return {
    isConnected,
    isConnecting,
    error,
    messages,
    activeUsers,
    activeProjectChannels,
    activeTaskChannels,
    
    // Connection methods
    connect,
    disconnect,
    
    // Channel methods
    joinProjectChannel,
    leaveProjectChannel,
    joinTaskChannel,
    leaveTaskChannel,
    joinTeamChannel,
    joinGeneralChannel,
    
    // Messaging methods
    sendProjectMessage,
    sendTaskMessage,
    sendTeamMessage,
    sendGeneralMessage,
    
    // Update methods
    sendProjectUpdate,
    sendTaskUpdate,
    
    // Typing indicators
    sendTypingIndicator,
    
    // Utility methods
    clearMessages,
    getChannelParticipants
  };
};