import { supabase } from '../../config/database';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Realtime service types
export interface SubscriptionOptions {
  table: string;
  schema?: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
}

export interface ChannelOptions {
  name: string;
  config?: {
    broadcast?: { self?: boolean; ack?: boolean };
    presence?: { key?: string };
  };
}

export type RealtimeCallback<T = any> = (payload: RealtimePostgresChangesPayload<T>) => void;
export type BroadcastCallback<T = any> = (payload: T) => void;
export type PresenceCallback<T = any> = (payload: T) => void;

// Realtime service class
export class RealtimeService {
  private static instance: RealtimeService;
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscriptions: Map<string, any> = new Map();

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  // Subscribe to database changes
  subscribeToTable<T = any>(
    options: SubscriptionOptions,
    callback: RealtimeCallback<T>
  ): string {
    const subscriptionId = `${options.table}_${Date.now()}_${Math.random()}`;
    
    const channel = supabase
      .channel(subscriptionId)
      .on(
        'postgres_changes',
        {
          event: options.event || '*',
          schema: options.schema || 'public',
          table: options.table,
          filter: options.filter
        },
        callback
      )
      .subscribe();

    this.channels.set(subscriptionId, channel);
    this.subscriptions.set(subscriptionId, { options, callback });

    return subscriptionId;
  }

  // Subscribe to specific record changes
  subscribeToRecord<T = any>(
    table: string,
    recordId: string,
    callback: RealtimeCallback<T>,
    schema: string = 'public'
  ): string {
    return this.subscribeToTable(
      {
        table,
        schema,
        filter: `id=eq.${recordId}`,
        event: '*'
      },
      callback
    );
  }

  // Subscribe to user-specific changes
  subscribeToUserData<T = any>(
    table: string,
    userId: string,
    callback: RealtimeCallback<T>,
    userColumn: string = 'user_id',
    schema: string = 'public'
  ): string {
    return this.subscribeToTable(
      {
        table,
        schema,
        filter: `${userColumn}=eq.${userId}`,
        event: '*'
      },
      callback
    );
  }

  // Create a broadcast channel
  createBroadcastChannel<T = any>(
    options: ChannelOptions,
    onBroadcast?: BroadcastCallback<T>
  ): string {
    const channel = supabase.channel(options.name, options.config);
    
    if (onBroadcast) {
      channel.on('broadcast', { event: '*' }, onBroadcast);
    }
    
    channel.subscribe();
    
    this.channels.set(options.name, channel);
    
    return options.name;
  }

  // Send broadcast message
  async sendBroadcast<T = any>(
    channelName: string,
    event: string,
    payload: T
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const channel = this.channels.get(channelName);
      
      if (!channel) {
        return {
          success: false,
          error: 'Channel not found'
        };
      }

      const result = await channel.send({
        type: 'broadcast',
        event,
        payload
      });

      return {
        success: result === 'ok'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Broadcast failed'
      };
    }
  }

  // Create presence channel
  createPresenceChannel<T = any>(
    options: ChannelOptions,
    onPresenceSync?: PresenceCallback<T>,
    onPresenceJoin?: PresenceCallback<T>,
    onPresenceLeave?: PresenceCallback<T>
  ): string {
    const channel = supabase.channel(options.name, options.config);
    
    if (onPresenceSync) {
      channel.on('presence', { event: 'sync' }, onPresenceSync);
    }
    
    if (onPresenceJoin) {
      channel.on('presence', { event: 'join' }, onPresenceJoin);
    }
    
    if (onPresenceLeave) {
      channel.on('presence', { event: 'leave' }, onPresenceLeave);
    }
    
    channel.subscribe();
    
    this.channels.set(options.name, channel);
    
    return options.name;
  }

  // Track presence
  async trackPresence<T = any>(
    channelName: string,
    state: T
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const channel = this.channels.get(channelName);
      
      if (!channel) {
        return {
          success: false,
          error: 'Channel not found'
        };
      }

      const result = await channel.track(state);

      return {
        success: result === 'ok'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Track presence failed'
      };
    }
  }

  // Untrack presence
  async untrackPresence(channelName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const channel = this.channels.get(channelName);
      
      if (!channel) {
        return {
          success: false,
          error: 'Channel not found'
        };
      }

      const result = await channel.untrack();

      return {
        success: result === 'ok'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Untrack presence failed'
      };
    }
  }

  // Get presence state
  getPresenceState<T = any>(channelName: string): T[] {
    const channel = this.channels.get(channelName);
    
    if (!channel) {
      return [];
    }

    const presenceState = channel.presenceState();
    return Object.values(presenceState).flat() as T[];
  }

  // Unsubscribe from specific subscription
  unsubscribe(subscriptionId: string): boolean {
    const channel = this.channels.get(subscriptionId);
    
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(subscriptionId);
      this.subscriptions.delete(subscriptionId);
      return true;
    }
    
    return false;
  }

  // Unsubscribe from all subscriptions
  unsubscribeAll(): void {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    
    this.channels.clear();
    this.subscriptions.clear();
  }

  // Get active subscriptions
  getActiveSubscriptions(): Array<{ id: string; options: SubscriptionOptions }> {
    return Array.from(this.subscriptions.entries()).map(([id, sub]) => ({
      id,
      options: sub.options
    }));
  }

  // Get active channels
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  // Check if subscription exists
  hasSubscription(subscriptionId: string): boolean {
    return this.channels.has(subscriptionId);
  }

  // Reconnect all channels
  async reconnectAll(): Promise<void> {
    const subscriptions = Array.from(this.subscriptions.entries());
    
    // Clear existing channels
    this.unsubscribeAll();
    
    // Recreate subscriptions
    for (const [id, sub] of subscriptions) {
      this.subscribeToTable(sub.options, sub.callback);
    }
  }

  // Get connection status
  getConnectionStatus(): string {
    return supabase.realtime.connection?.readyState?.toString() || 'unknown';
  }
}

// Specific service classes for different features
export class ChatRealtimeService {
  private realtimeService: RealtimeService;

  constructor() {
    this.realtimeService = RealtimeService.getInstance();
  }

  // Subscribe to chat messages
  subscribeToMessages(
    chatId: string,
    callback: RealtimeCallback,
    userId?: string
  ): string {
    return this.realtimeService.subscribeToTable(
      {
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
        event: '*'
      },
      callback
    );
  }

  // Subscribe to chat updates
  subscribeToChat(chatId: string, callback: RealtimeCallback): string {
    return this.realtimeService.subscribeToRecord('chats', chatId, callback);
  }

  // Create chat presence channel
  createChatPresence(
    chatId: string,
    onSync?: PresenceCallback,
    onJoin?: PresenceCallback,
    onLeave?: PresenceCallback
  ): string {
    return this.realtimeService.createPresenceChannel(
      { name: `chat_${chatId}` },
      onSync,
      onJoin,
      onLeave
    );
  }

  // Track user in chat
  async trackUserInChat(chatId: string, userState: any): Promise<{ success: boolean; error?: string }> {
    return this.realtimeService.trackPresence(`chat_${chatId}`, userState);
  }
}

export class ProjectRealtimeService {
  private realtimeService: RealtimeService;

  constructor() {
    this.realtimeService = RealtimeService.getInstance();
  }

  // Subscribe to project updates
  subscribeToProject(projectId: string, callback: RealtimeCallback): string {
    return this.realtimeService.subscribeToRecord('projects', projectId, callback);
  }

  // Subscribe to project tasks
  subscribeToProjectTasks(projectId: string, callback: RealtimeCallback): string {
    return this.realtimeService.subscribeToTable(
      {
        table: 'tasks',
        filter: `project_id=eq.${projectId}`,
        event: '*'
      },
      callback
    );
  }

  // Subscribe to project team changes
  subscribeToProjectTeam(projectId: string, callback: RealtimeCallback): string {
    return this.realtimeService.subscribeToTable(
      {
        table: 'project_members',
        filter: `project_id=eq.${projectId}`,
        event: '*'
      },
      callback
    );
  }

  // Create project collaboration channel
  createProjectChannel(
    projectId: string,
    onBroadcast?: BroadcastCallback
  ): string {
    return this.realtimeService.createBroadcastChannel(
      { name: `project_${projectId}` },
      onBroadcast
    );
  }

  // Send project update
  async sendProjectUpdate(
    projectId: string,
    event: string,
    data: any
  ): Promise<{ success: boolean; error?: string }> {
    return this.realtimeService.sendBroadcast(`project_${projectId}`, event, data);
  }
}

export class NotificationRealtimeService {
  private realtimeService: RealtimeService;

  constructor() {
    this.realtimeService = RealtimeService.getInstance();
  }

  // Subscribe to user notifications
  subscribeToUserNotifications(userId: string, callback: RealtimeCallback): string {
    return this.realtimeService.subscribeToUserData(
      'notifications',
      userId,
      callback,
      'user_id'
    );
  }

  // Subscribe to system notifications
  subscribeToSystemNotifications(callback: RealtimeCallback): string {
    return this.realtimeService.subscribeToTable(
      {
        table: 'system_notifications',
        event: '*'
      },
      callback
    );
  }
}

// Export singleton instances
export const realtimeService = RealtimeService.getInstance();
export const chatRealtimeService = new ChatRealtimeService();
export const projectRealtimeService = new ProjectRealtimeService();
export const notificationRealtimeService = new NotificationRealtimeService();

// Export default
export default realtimeService;