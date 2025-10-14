import { io, Socket } from 'socket.io-client';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  type: 'text' | 'file' | 'image' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyTo?: string;
  reactions?: { [emoji: string]: string[] };
  edited?: boolean;
  editedAt?: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: Date;
  isTyping?: boolean;
}

export interface Room {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'project';
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  roomId: string;
}

class SocketService {
  private socket: Socket | null = null;
  private currentUser: User | null = null;
  private eventHandlers: Map<string, ((...args: unknown[]) => void)[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.setupEventHandlers();
  }

  // Connection management
  connect(serverUrl: string, user: User): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.currentUser = user;
        
        // Disconnect existing connection if any
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }
        
        this.socket = io(serverUrl, {
          auth: {
            userId: user.id,
            userName: user.name,
            userEmail: user.email
          },
          transports: ['websocket', 'polling'],
          timeout: 20000, // Increased timeout
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000
        });

        // Set up connection timeout
        const connectionTimeout = setTimeout(() => {
          console.error('Connection timeout after 20 seconds');
          this.socket?.disconnect();
          reject(new Error('Connection timeout'));
        }, 20000);

        this.socket.on('connect', () => {
          clearTimeout(connectionTimeout);
          console.log('Connected to chat server');
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          clearTimeout(connectionTimeout);
          console.error('Connection error:', error);
          this.emit('connectionError', error);
          
          // Try fallback connection with polling only
          if (this.reconnectAttempts === 0) {
            this.reconnectAttempts++;
            setTimeout(() => {
              this.connectWithPolling(serverUrl, user).then(resolve).catch(reject);
            }, 2000);
          } else {
            reject(error);
          }
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Disconnected from chat server:', reason);
          this.emit('disconnected', reason);
          
          if (reason === 'io server disconnect' || reason === 'transport close') {
            // Server disconnected, try to reconnect
            this.handleReconnection();
          }
        });

        this.setupSocketEventHandlers();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Fallback connection method with polling only
  private connectWithPolling(serverUrl: string, user: User): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Attempting fallback connection with polling transport...');
      
      this.socket = io(serverUrl, {
        auth: {
          userId: user.id,
          userName: user.name,
          userEmail: user.email
        },
        transports: ['polling'], // Only use polling as fallback
        timeout: 15000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000
      });

      const fallbackTimeout = setTimeout(() => {
        console.error('Fallback connection timeout');
        this.socket?.disconnect();
        reject(new Error('Fallback connection timeout'));
      }, 15000);

      this.socket.on('connect', () => {
        clearTimeout(fallbackTimeout);
        console.log('Connected via polling fallback');
        this.reconnectAttempts = 0;
        this.emit('connected');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        clearTimeout(fallbackTimeout);
        console.error('Fallback connection error:', error);
        reject(error);
      });

      this.setupSocketEventHandlers();
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentUser = null;
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        if (this.socket) {
          this.socket.connect();
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  // Event handling
  on(event: string, handler: (...args: unknown[]) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: (...args: unknown[]) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: unknown[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(...args));
    }
  }

  private setupEventHandlers(): void {
    // Setup default event handlers
  }

  private setupSocketEventHandlers(): void {
    if (!this.socket) return;

    // Message events
    this.socket.on('message:new', (message: Message) => {
      this.emit('messageReceived', message);
    });

    this.socket.on('message:updated', (message: Message) => {
      this.emit('messageUpdated', message);
    });

    this.socket.on('message:deleted', (messageId: string) => {
      this.emit('messageDeleted', messageId);
    });

    // Typing events
    this.socket.on('typing:start', (data: TypingIndicator) => {
      this.emit('typingStart', data);
    });

    this.socket.on('typing:stop', (data: TypingIndicator) => {
      this.emit('typingStop', data);
    });

    // User presence events
    this.socket.on('user:online', (user: User) => {
      this.emit('userOnline', user);
    });

    this.socket.on('user:offline', (user: User) => {
      this.emit('userOffline', user);
    });

    this.socket.on('user:status', (data: { userId: string; status: User['status'] }) => {
      this.emit('userStatusChanged', data);
    });

    // Room events
    this.socket.on('room:joined', (room: Room) => {
      this.emit('roomJoined', room);
    });

    this.socket.on('room:left', (roomId: string) => {
      this.emit('roomLeft', roomId);
    });

    this.socket.on('room:updated', (room: Room) => {
      this.emit('roomUpdated', room);
    });

    // Call events
    this.socket.on('call:incoming', (data: { callerId: string; callerName: string; roomId: string; type: 'audio' | 'video' }) => {
      this.emit('incomingCall', data);
    });

    this.socket.on('call:accepted', (data: { userId: string; roomId: string }) => {
      this.emit('callAccepted', data);
    });

    this.socket.on('call:rejected', (data: { userId: string; roomId: string }) => {
      this.emit('callRejected', data);
    });

    this.socket.on('call:ended', (data: { roomId: string }) => {
      this.emit('callEnded', data);
    });

    // WebRTC signaling events
    this.socket.on('webrtc:signal', (data: { from: string; to: string; signal: unknown }) => {
      this.emit('webrtcSignal', data);
    });
  }

  // Message operations
  sendMessage(roomId: string, content: string, type: Message['type'] = 'text', replyTo?: string): void {
    if (!this.socket || !this.currentUser) {
      throw new Error('Not connected to chat server');
    }

    const message: Partial<Message> = {
      content,
      type,
      senderId: this.currentUser.id,
      senderName: this.currentUser.name,
      timestamp: new Date(),
      replyTo
    };

    this.socket.emit('message:send', { roomId, message });
  }

  editMessage(messageId: string, newContent: string): void {
    if (!this.socket) {
      throw new Error('Not connected to chat server');
    }

    this.socket.emit('message:edit', { messageId, content: newContent });
  }

  deleteMessage(messageId: string): void {
    if (!this.socket) {
      throw new Error('Not connected to chat server');
    }

    this.socket.emit('message:delete', { messageId });
  }

  // File upload
  uploadFile(roomId: string, file: File): Promise<Message> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.currentUser) {
        reject(new Error('Not connected to chat server'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const fileData = {
          name: file.name,
          size: file.size,
          type: file.type,
          data: reader.result
        };

        this.socket!.emit('file:upload', { roomId, file: fileData }, (response: { success: boolean; message?: Message; error?: string }) => {
          if (response.success && response.message) {
            resolve(response.message);
          } else {
            reject(new Error(response.error || 'File upload failed'));
          }
        });
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  // Typing indicators
  startTyping(roomId: string): void {
    if (!this.socket || !this.currentUser) return;

    this.socket.emit('typing:start', {
      roomId,
      userId: this.currentUser.id,
      userName: this.currentUser.name
    });
  }

  stopTyping(roomId: string): void {
    if (!this.socket || !this.currentUser) return;

    this.socket.emit('typing:stop', {
      roomId,
      userId: this.currentUser.id,
      userName: this.currentUser.name
    });
  }

  // Room operations
  joinRoom(roomId: string): void {
    if (!this.socket) {
      throw new Error('Not connected to chat server');
    }

    this.socket.emit('room:join', { roomId });
  }

  leaveRoom(roomId: string): void {
    if (!this.socket) {
      throw new Error('Not connected to chat server');
    }

    this.socket.emit('room:leave', { roomId });
  }

  createRoom(name: string, type: Room['type'], participants: string[]): void {
    if (!this.socket) {
      throw new Error('Not connected to chat server');
    }

    this.socket.emit('room:create', { name, type, participants });
  }

  // User status
  updateStatus(status: User['status']): void {
    if (this.socket && this.currentUser) {
      this.currentUser.status = status;
      this.socket.emit('user_status_update', { 
        userId: this.currentUser.id, 
        status 
      });
    }
  }

  // User management
  joinUser(userId: string, userName: string): void {
    if (this.socket) {
      this.socket.emit('user_join', { userId, userName });
    }
  }

  // Typing indicators with proper method name
  typing(roomId: string): void {
    this.startTyping(roomId);
  }

  // Call operations
  initiateCall(roomId: string, type: 'audio' | 'video'): void {
    if (!this.socket) {
      throw new Error('Not connected to chat server');
    }

    this.socket.emit('call:initiate', { roomId, type });
  }

  acceptCall(roomId: string): void {
    if (!this.socket) {
      throw new Error('Not connected to chat server');
    }

    this.socket.emit('call:accept', { roomId });
  }

  rejectCall(roomId: string): void {
    if (!this.socket) {
      throw new Error('Not connected to chat server');
    }

    this.socket.emit('call:reject', { roomId });
  }

  endCall(roomId: string): void {
    if (!this.socket) {
      throw new Error('Not connected to chat server');
    }

    this.socket.emit('call:end', { roomId });
  }

  // Message reactions
  addReaction(roomId: string, messageId: string, emoji: string, userId: string): void {
    if (!this.socket) {
      throw new Error('Not connected to chat server');
    }

    this.socket.emit('message:reaction:add', { roomId, messageId, emoji, userId });
  }

  removeReaction(roomId: string, messageId: string, emoji: string, userId: string): void {
    if (!this.socket) {
      throw new Error('Not connected to chat server');
    }

    this.socket.emit('message:reaction:remove', { roomId, messageId, emoji, userId });
  }

  // Screen sharing
  startScreenShare(roomId: string): void {
    if (!this.socket || !this.currentUser) {
      throw new Error('Not connected to chat server');
    }

    this.socket.emit('screenshare:start', { roomId, userId: this.currentUser.id });
  }

  stopScreenShare(roomId: string): void {
    if (!this.socket || !this.currentUser) {
      throw new Error('Not connected to chat server');
    }

    this.socket.emit('screenshare:stop', { roomId, userId: this.currentUser.id });
  }

  // WebRTC signaling
  sendSignal(to: string, signal: unknown): void {
    if (!this.socket || !this.currentUser) {
      throw new Error('Not connected to chat server');
    }

    this.socket.emit('webrtc:signal', {
      from: this.currentUser.id,
      to,
      signal
    });
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Cleanup
  destroy(): void {
    this.disconnect();
    this.eventHandlers.clear();
  }
}

export default SocketService;