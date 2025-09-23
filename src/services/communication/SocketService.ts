import { io, Socket } from "socket.io-client";

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  type: "text" | "file" | "image" | "system";
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
  status: "online" | "away" | "busy" | "offline";
  lastSeen?: Date;
  avatar?: string;
}

export interface Room {
  id: string;
  name: string;
  type: "direct" | "group" | "channel";
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  isPrivate: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  roomId: string;
  timestamp: Date;
}

export class SocketService {
  private socket: Socket | null = null;
  private serverUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10; // Increased from 5 to 10
  private reconnectDelay = 2000; // Increased from 1000 to 2000ms
  private maxReconnectDelay = 30000; // Maximum delay of 30 seconds
  private reconnectBackoffFactor = 1.5; // Exponential backoff factor

  constructor(serverUrl: string = "") {
    this.serverUrl = serverUrl;
  }

  // Connection management
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.serverUrl, {
          transports: ["websocket", "polling"],
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: this.maxReconnectDelay,
          randomizationFactor: 0.5,
          forceNew: false,
          autoConnect: true,
        });

        this.socket.on("connect", () => {
          console.log("Connected to server successfully");
          this.reconnectAttempts = 0; // Reset reconnection attempts on successful connection
          this.reconnectDelay = 2000; // Reset delay to initial value
          resolve();
        });

        this.socket.on("disconnect", (reason) => {
          console.log("Disconnected from server:", reason);
          
          // Handle different disconnect reasons
          if (reason === "io server disconnect") {
            // Server initiated disconnect, don't auto-reconnect
            console.warn("Server disconnected the client. Manual reconnection required.");
          } else if (reason === "transport close" || reason === "transport error") {
            // Network issues, will auto-reconnect
            console.log("Network issue detected. Auto-reconnection will be attempted.");
          } else {
            console.log("Disconnect reason:", reason);
          }
        });

        this.socket.on("connect_error", (error) => {
          console.error("Connection error:", error);
          this.reconnectAttempts++;

          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(`Max reconnection attempts reached (${this.maxReconnectAttempts}). Connection failed.`);
            reject(new Error(`Max reconnection attempts reached. Failed to connect after ${this.maxReconnectAttempts} attempts.`));
          } else {
            // Calculate exponential backoff delay
            const delay = Math.min(
              this.reconnectDelay * Math.pow(this.reconnectBackoffFactor, this.reconnectAttempts - 1),
              this.maxReconnectDelay
            );
            console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} failed. Retrying in ${delay}ms...`);
          }
        });

        this.socket.on("reconnect", (attemptNumber) => {
          console.log(`Successfully reconnected after ${attemptNumber} attempts`);
          this.reconnectAttempts = 0;
          this.reconnectDelay = 2000; // Reset delay to initial value
        });

        this.socket.on("reconnect_attempt", (attemptNumber) => {
          console.log(`Reconnection attempt ${attemptNumber}/${this.maxReconnectAttempts}`);
        });

        this.socket.on("reconnect_error", (error) => {
          console.error("Reconnection error:", error);
        });

        this.socket.on("reconnect_failed", () => {
          console.error(`Failed to reconnect to server after ${this.maxReconnectAttempts} attempts`);
          this.reconnectAttempts = 0; // Reset for potential manual reconnection
          reject(new Error("Failed to reconnect to server"));
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Event listeners
  on(event: string, callback: (...args: unknown[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: unknown[]) => void): void {
    this.socket?.off(event, callback);
  }

  // User management
  joinUser(userId: string, userName: string): void {
    this.socket?.emit("user:join", { userId, userName });
  }

  updateUserStatus(userId: string, status: User["status"]): void {
    this.socket?.emit("user:status", { userId, status });
  }

  // Room management
  joinRoom(roomId: string, userId: string): void {
    this.socket?.emit("room:join", { roomId, userId });
  }

  leaveRoom(roomId: string, userId: string): void {
    this.socket?.emit("room:leave", { roomId, userId });
  }

  createRoom(room: Omit<Room, "id" | "createdAt" | "updatedAt">): void {
    this.socket?.emit("room:create", room);
  }

  // Message management
  sendMessage(roomId: string, message: Message): void {
    this.socket?.emit("message:send", { roomId, message });
  }

  editMessage(roomId: string, message: Message): void {
    this.socket?.emit("message:edit", { roomId, message });
  }

  deleteMessage(roomId: string, messageId: string): void {
    this.socket?.emit("message:delete", { roomId, messageId });
  }

  addReaction(
    roomId: string,
    messageId: string,
    emoji: string,
    userId: string,
  ): void {
    this.socket?.emit("message:reaction", { roomId, messageId, emoji, userId });
  }

  // Typing indicators
  typing(roomId: string, userId: string, userName: string): void {
    this.socket?.emit("typing:start", { roomId, userId, userName });
  }

  stopTyping(roomId: string, userId: string): void {
    this.socket?.emit("typing:stop", { roomId, userId });
  }

  // File sharing
  shareFile(
    roomId: string,
    file: {
      id: string;
      name: string;
      size: number;
      type: string;
      url: string;
      senderId: string;
      senderName: string;
    },
  ): void {
    this.socket?.emit("file:share", { roomId, file });
  }

  // Call management
  initiateCall(
    roomId: string,
    callType: "audio" | "video",
    participants: string[],
  ): void {
    this.socket?.emit("call:initiate", { roomId, callType, participants });
  }

  acceptCall(callId: string, userId: string): void {
    this.socket?.emit("call:accept", { callId, userId });
  }

  rejectCall(callId: string, userId: string): void {
    this.socket?.emit("call:reject", { callId, userId });
  }

  endCall(callId: string, userId: string): void {
    this.socket?.emit("call:end", { callId, userId });
  }

  // WebRTC signaling
  sendSignal(roomId: string, signal: unknown, targetUserId?: string): void {
    this.socket?.emit("webrtc:signal", { roomId, signal, targetUserId });
  }

  sendOffer(
    roomId: string,
    offer: RTCSessionDescriptionInit,
    targetUserId: string,
  ): void {
    this.socket?.emit("webrtc:offer", { roomId, offer, targetUserId });
  }

  sendAnswer(
    roomId: string,
    answer: RTCSessionDescriptionInit,
    targetUserId: string,
  ): void {
    this.socket?.emit("webrtc:answer", { roomId, answer, targetUserId });
  }

  sendIceCandidate(
    roomId: string,
    candidate: RTCIceCandidateInit,
    targetUserId: string,
  ): void {
    this.socket?.emit("webrtc:ice-candidate", {
      roomId,
      candidate,
      targetUserId,
    });
  }

  // Screen sharing
  startScreenShare(roomId: string, userId: string): void {
    this.socket?.emit("screenshare:start", { roomId, userId });
  }

  stopScreenShare(roomId: string, userId: string): void {
    this.socket?.emit("screenshare:stop", { roomId, userId });
  }

  // Presence management
  updatePresence(
    userId: string,
    presence: {
      status: User["status"];
      lastSeen: Date;
      activity?: string;
    },
  ): void {
    this.socket?.emit("presence:update", { userId, presence });
  }

  // Error handling
  protected handleError(error: unknown): void {
    console.error("Socket error:", error);
    // Emit error event for components to handle
    this.socket?.emit("error", error);
  }

  // Utility methods
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  getRooms(): string[] {
    // Note: Client-side socket doesn't have rooms property
    // This would need to be tracked separately or requested from server
    return [];
  }

  // Real-time communication methods will be implemented with actual socket server
}

export default SocketService;
