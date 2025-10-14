// Realtime functionality temporarily disabled - needs backend WebSocket implementation
// import { backendApiService } from '../backendApiService';
// import { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js';

// Placeholder types for compatibility
type RealtimeChannel = Record<string, unknown>;
type RealtimeChannelSendResponse = Record<string, unknown>;

export interface RealtimeMessage {
  id: string;
  type: 'message' | 'notification' | 'status' | 'typing' | 'project_update' | 'task_update';
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  roomId: string;
  metadata?: Record<string, unknown>;
}

export interface RealtimeRoom {
  id: string;
  name: string;
  type: 'project' | 'task' | 'general' | 'team';
  participants: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface RealtimeUser {
  id: string;
  name: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
}

type EventCallback = (data: unknown) => void;

export class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private currentUser: RealtimeUser | null = null;
  private eventListeners: Map<string, EventCallback[]> = new Map();

  constructor() {
    this.setupConnectionHandlers();
  }

  // Initialize user session
  async initializeUser(userId: string, userName: string): Promise<void> {
    this.currentUser = {
      id: userId,
      name: userName,
      status: 'online',
      lastSeen: new Date()
    };

    // Join user presence channel
    await this.joinChannel('presence', 'global');
    
    // Broadcast user online status
    await this.broadcastUserStatus('online');
  }

  // Join a channel
  async joinChannel(channelType: string, channelId: string): Promise<RealtimeChannel> {
    const channelName = `${channelType}:${channelId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    // Placeholder channel implementation - needs backend WebSocket
    const channel = {
      on: () => ({ subscribe: () => Promise.resolve('SUBSCRIBED') }),
      subscribe: () => Promise.resolve('SUBSCRIBED'),
      unsubscribe: () => Promise.resolve('CLOSED'),
      send: () => Promise.resolve({ status: 'ok' })
    } as RealtimeChannel;

    // Setup channel event handlers
    channel
      .on('broadcast', { event: 'message' }, (payload) => {
        this.handleMessage(payload.payload as RealtimeMessage);
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        this.handleTyping(payload.payload);
      })
      .on('broadcast', { event: 'user_status' }, (payload) => {
        this.handleUserStatus(payload.payload);
      })
      .on('presence', { event: 'sync' }, () => {
        this.handlePresenceSync(channel);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        this.handlePresenceJoin(key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        this.handlePresenceLeave(key, leftPresences);
      });

    // Subscribe to channel
    const status = await channel.subscribe();
    
    if (status === 'SUBSCRIBED') {
      this.channels.set(channelName, channel);
      this.emit('channel_joined', { channelName, channelType, channelId });
      
      // Track presence if user is initialized
      if (this.currentUser) {
        await channel.track({
          user_id: this.currentUser.id,
          user_name: this.currentUser.name,
          status: this.currentUser.status,
          joined_at: new Date().toISOString()
        });
      }
    } else {
      throw new Error(`Failed to subscribe to channel: ${channelName}`);
    }

    return channel;
  }

  // Leave a channel
  async leaveChannel(channelType: string, channelId: string): Promise<void> {
    const channelName = `${channelType}:${channelId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      await channel.unsubscribe();
      this.channels.delete(channelName);
      this.emit('channel_left', { channelName, channelType, channelId });
    }
  }

  // Send message to channel
  async sendMessage(
    channelType: string, 
    channelId: string, 
    content: string, 
    messageType: RealtimeMessage['type'] = 'message',
    metadata?: Record<string, unknown>
  ): Promise<RealtimeChannelSendResponse> {
    const channelName = `${channelType}:${channelId}`;
    const channel = this.channels.get(channelName);
    
    if (!channel) {
      throw new Error(`Channel not found: ${channelName}`);
    }

    if (!this.currentUser) {
      throw new Error('User not initialized');
    }

    const message: RealtimeMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: messageType,
      content,
      senderId: this.currentUser.id,
      senderName: this.currentUser.name,
      timestamp: new Date(),
      roomId: channelId,
      metadata
    };

    const response = await channel.send({
      type: 'broadcast',
      event: 'message',
      payload: message
    });

    return response;
  }

  // Send typing indicator
  async sendTyping(channelType: string, channelId: string, isTyping: boolean): Promise<void> {
    const channelName = `${channelType}:${channelId}`;
    const channel = this.channels.get(channelName);
    
    if (!channel || !this.currentUser) return;

    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        isTyping,
        timestamp: new Date()
      }
    });
  }

  // Broadcast user status
  async broadcastUserStatus(status: RealtimeUser['status']): Promise<void> {
    if (!this.currentUser) return;

    this.currentUser.status = status;
    this.currentUser.lastSeen = new Date();

    // Broadcast to all channels
    for (const [, channel] of this.channels) {
      await channel.send({
        type: 'broadcast',
        event: 'user_status',
        payload: {
          userId: this.currentUser.id,
          userName: this.currentUser.name,
          status,
          lastSeen: this.currentUser.lastSeen
        }
      });
    }
  }

  // Get channel participants
  getChannelParticipants(channelType: string, channelId: string): RealtimeUser[] {
    const channelName = `${channelType}:${channelId}`;
    const channel = this.channels.get(channelName);
    
    if (!channel) return [];

    const presenceState = channel.presenceState();
    const participants: RealtimeUser[] = [];

    Object.values(presenceState).forEach((presences: unknown) => {
      (presences as unknown[]).forEach((presence: unknown) => {
        const presenceData = presence as { user_id: string; user_name: string; status?: string; joined_at: string };
        participants.push({
          id: presenceData.user_id,
          name: presenceData.user_name,
          status: (presenceData.status as RealtimeUser['status']) || 'online',
          lastSeen: new Date(presenceData.joined_at)
        });
      });
    });

    return participants;
  }

  // Event handling
  on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Event handlers
  private handleMessage(message: RealtimeMessage): void {
    this.emit('message', message);
  }

  private handleTyping(data: unknown): void {
    this.emit('typing', data);
  }

  private handleUserStatus(data: unknown): void {
    this.emit('user_status', data);
  }

  private handlePresenceSync(channel: RealtimeChannel): void {
    const participants = this.getChannelParticipants('', '');
    this.emit('presence_sync', { channel: channel.topic, participants });
  }

  private handlePresenceJoin(key: string, newPresences: unknown[]): void {
    this.emit('presence_join', { key, newPresences });
  }

  private handlePresenceLeave(key: string, leftPresences: unknown[]): void {
    this.emit('presence_leave', { key, leftPresences });
  }

  private setupConnectionHandlers(): void {
    // Supabase v2 uses per-channel connection handling
    // No global realtime connection handlers are available
    // Connection status is managed through channel.subscribe() callbacks
    console.log('✅ RealtimeService initialized with Supabase v2 compatibility');
  }

  // Cleanup
  async disconnect(): Promise<void> {
    // Broadcast offline status
    if (this.currentUser) {
      await this.broadcastUserStatus('offline');
    }

    // Unsubscribe from all channels
    for (const [, channel] of this.channels) {
      await channel.unsubscribe();
    }

    this.channels.clear();
    this.eventListeners.clear();
    this.currentUser = null;
  }

  // Get active channels
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  // Check if channel is active
  isChannelActive(channelType: string, channelId: string): boolean {
    const channelName = `${channelType}:${channelId}`;
    return this.channels.has(channelName);
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();