import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Smile,
  MoreVertical,
  Search,
  Phone,
  Video,
  Users,
  Settings,
  Hash,
  Lock,
  Bell,
  BellOff,
} from "lucide-react";
import SocketService from "../../services/chat/SocketService";
import { activityLogger } from "../../utils/activityLogger";

export interface ChatMessage {
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

export interface ChatRoom {
  id: string;
  name: string;
  type: "direct" | "group" | "channel";
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isPrivate: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TypingUser {
  userId: string;
  userName: string;
  timestamp: Date;
}

interface ChatManagerProps {
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  onStartCall?: (roomId: string, isVideo: boolean) => void;
  onStartScreenShare?: (roomId: string) => void;
  className?: string;
}

const ChatManager: React.FC<ChatManagerProps> = ({
  currentUser,
  onStartCall,
  onStartScreenShare,
  className = "",
}) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(
    null,
  );
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketService = useRef<SocketService | null>(null);

  // Initialize socket connection
  useEffect(() => {
    socketService.current = new SocketService();

    const handleConnect = () => {
      setIsConnected(true);
      socketService.current?.joinUser(currentUser.id, currentUser.name);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleMessage = (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);

      // Update room's last message
      setRooms((prev) =>
        prev.map((room) =>
          room.id === activeRoom?.id
            ? { ...room, lastMessage: message, updatedAt: new Date() }
            : room,
        ),
      );

      // Show notification if not in active room
      if (notifications && message.senderId !== currentUser.id) {
        showNotification(message);
      }
    };

    const handleTyping = (data: {
      userId: string;
      userName: string;
      roomId: string;
    }) => {
      if (data.roomId === activeRoom?.id && data.userId !== currentUser.id) {
        setTypingUsers((prev) => {
          const filtered = prev.filter((user) => user.userId !== data.userId);
          return [...filtered, { ...data, timestamp: new Date() }];
        });
      }
    };

    const handleStopTyping = (data: { userId: string; roomId: string }) => {
      if (data.roomId === activeRoom?.id) {
        setTypingUsers((prev) =>
          prev.filter((user) => user.userId !== data.userId),
        );
      }
    };

    const handleRoomUpdate = (room: ChatRoom) => {
      setRooms((prev) => {
        const index = prev.findIndex((r) => r.id === room.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = room;
          return updated;
        }
        return [...prev, room];
      });
    };

    socketService.current.on("connect", handleConnect);
    socketService.current.on("disconnect", handleDisconnect);
    socketService.current.on("message", handleMessage);
    socketService.current.on("typing", handleTyping);
    socketService.current.on("stopTyping", handleStopTyping);
    socketService.current.on("roomUpdate", handleRoomUpdate);

    return () => {
      socketService.current?.disconnect();
    };
  }, [currentUser, activeRoom?.id, notifications]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clean up typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTypingUsers((prev) =>
        prev.filter((user) => now.getTime() - user.timestamp.getTime() < 5000),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Show browser notification
  const showNotification = (message: ChatMessage) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`${message.senderName}`, {
        body: message.content,
        icon: "/favicon.ico",
      });
    }
  };



  // Send message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !activeRoom || !socketService.current) return;

    try {
      await activityLogger.log("chat_manager_message_send", "info", "Sending message in chat manager", {
        roomId: activeRoom.id,
        messageLength: newMessage.trim().length,
        senderId: currentUser.id,
        isEdit: !!editingMessage
      });

      const message: ChatMessage = {
        id: `msg_${Date.now()}`,
        content: newMessage.trim(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        timestamp: new Date(),
        type: "text",
        replyTo: replyingTo?.id,
      };

      if (editingMessage) {
        // Edit existing message
        const editedMessage = {
          ...editingMessage,
          content: newMessage.trim(),
          edited: true,
          editedAt: new Date(),
        };

        socketService.current.editMessage(activeRoom.id, editedMessage);
        setEditingMessage(null);

        await activityLogger.log("chat_manager_message_edit", "success", "Message edited successfully", {
          roomId: activeRoom.id,
          messageId: editedMessage.id,
          senderId: currentUser.id
        });
      } else {
        // Send new message
        socketService.current.sendMessage(activeRoom.id, message);

        await activityLogger.log("chat_manager_message_send", "success", "Message sent successfully", {
          roomId: activeRoom.id,
          messageId: message.id,
          senderId: currentUser.id
        });
      }

      setNewMessage("");
      setReplyingTo(null);

      // Stop typing indicator
      socketService.current.stopTyping(activeRoom.id, currentUser.id);
    } catch (error) {
      console.error("Error sending message:", error);
      await activityLogger.log("chat_manager_message_send", "error", "Failed to send message", {
        roomId: activeRoom.id,
        senderId: currentUser.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }, [newMessage, activeRoom, currentUser, replyingTo, editingMessage]);

  // Handle typing
  const handleTyping = useCallback(() => {
    if (!activeRoom || !socketService.current) return;

    socketService.current.typing(
      activeRoom.id,
      currentUser.id,
      currentUser.name,
    );

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socketService.current?.stopTyping(activeRoom.id, currentUser.id);
    }, 3000);
  }, [activeRoom, currentUser]);

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Join room
  const joinRoom = (room: ChatRoom) => {
    if (activeRoom) {
      socketService.current?.leaveRoom(activeRoom.id, currentUser.id);
    }

    setActiveRoom(room);
    setMessages([]);
    socketService.current?.joinRoom(room.id, currentUser.id);

    // Mark room as read
    setRooms((prev) =>
      prev.map((r) => (r.id === room.id ? { ...r, unreadCount: 0 } : r)),
    );
  };

  // Add reaction to message
  const addReaction = (messageId: string, emoji: string) => {
    if (!activeRoom || !socketService.current) return;

    socketService.current.addReaction(
      activeRoom.id,
      messageId,
      emoji,
      currentUser.id,
    );
  };



  // Format timestamp
  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return timestamp.toLocaleDateString();
  };

  // Filter rooms based on search
  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Render message
  const renderMessage = (message: ChatMessage, index: number) => {
    const isOwn = message.senderId === currentUser.id;
    const showAvatar =
      index === 0 || messages[index - 1]?.senderId !== message.senderId;
    const replyMessage = message.replyTo
      ? messages.find((m) => m.id === message.replyTo)
      : null;

    return (
      <div
        key={message.id}
        className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}
      >
        <div
          className={`flex ${isOwn ? "flex-row-reverse" : "flex-row"} items-end space-x-2 max-w-xs lg:max-w-md`}
        >
          {showAvatar && !isOwn && (
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
              {message.senderName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className={`${isOwn ? "mr-2" : "ml-2"}`}>
            {showAvatar && !isOwn && (
              <p className="text-xs text-gray-500 mb-1">{message.senderName}</p>
            )}

            {replyMessage && (
              <div className="bg-gray-100 border-l-4 border-blue-500 p-2 mb-2 rounded text-sm">
                <p className="text-gray-600 text-xs">
                  {replyMessage.senderName}
                </p>
                <p className="text-gray-800">{replyMessage.content}</p>
              </div>
            )}

            <div
              className={`rounded-lg p-3 ${isOwn ? "bg-blue-600 text-white" : "bg-white border"}`}
            >
              <p className="text-sm">{message.content}</p>
              {message.edited && (
                <p className="text-xs opacity-70 mt-1">(edited)</p>
              )}
            </div>

            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500">
                {formatTimestamp(message.timestamp)}
              </p>

              {message.reactions &&
                Object.keys(message.reactions).length > 0 && (
                  <div className="flex space-x-1">
                    {Object.entries(message.reactions).map(([emoji, users]) => (
                      <button
                        key={emoji}
                        onClick={() => addReaction(message.id, emoji)}
                        className="text-xs bg-gray-100 rounded-full px-2 py-1 hover:bg-gray-200"
                      >
                        {emoji} {users.length}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    const names = typingUsers.map((user) => user.userName).join(", ");
    const text =
      typingUsers.length === 1
        ? `${names} is typing...`
        : `${names} are typing...`;

    return (
      <div className="flex items-center space-x-2 p-3 text-gray-500 text-sm">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
          <div
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          />
          <div
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          />
        </div>
        <span>{text}</span>
      </div>
    );
  };

  return (
    <div className={`flex h-full bg-gray-50 ${className}`}>
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setNotifications(!notifications)}
                className={`p-2 rounded-full transition-colors ${
                  notifications
                    ? "text-blue-600 hover:bg-blue-50"
                    : "text-gray-400 hover:bg-gray-100"
                }`}
              >
                {notifications ? (
                  <Bell className="w-5 h-5" />
                ) : (
                  <BellOff className="w-5 h-5" />
                )}
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Connection status */}
        <div
          className={`px-4 py-2 text-sm ${isConnected ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
        >
          {isConnected ? "● Connected" : "● Disconnected"}
        </div>

        {/* Rooms list */}
        <div className="flex-1 overflow-y-auto">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => joinRoom(room)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                activeRoom?.id === room.id ? "bg-blue-50 border-blue-200" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      {room.type === "channel" ? (
                        <Hash className="w-5 h-5 text-gray-600" />
                      ) : room.type === "group" ? (
                        <Users className="w-5 h-5 text-gray-600" />
                      ) : (
                        <span className="text-sm font-medium text-gray-600">
                          {room.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {room.isPrivate && (
                      <Lock className="absolute -bottom-1 -right-1 w-3 h-3 text-gray-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {room.name}
                    </p>
                    {room.lastMessage && (
                      <p className="text-xs text-gray-500 truncate">
                        {room.lastMessage.senderName}:{" "}
                        {room.lastMessage.content}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-1">
                  {room.lastMessage && (
                    <span className="text-xs text-gray-400">
                      {formatTimestamp(room.lastMessage.timestamp)}
                    </span>
                  )}
                  {room.unreadCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {room.unreadCount > 99 ? "99+" : room.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {activeRoom ? (
          <>
            {/* Chat header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    {activeRoom.type === "channel" ? (
                      <Hash className="w-5 h-5 text-gray-600" />
                    ) : activeRoom.type === "group" ? (
                      <Users className="w-5 h-5 text-gray-600" />
                    ) : (
                      <span className="text-sm font-medium text-gray-600">
                        {activeRoom.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{activeRoom.name}</h3>
                    <p className="text-sm text-gray-500">
                      {activeRoom.participants.length} participants
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onStartCall?.(activeRoom.id, false)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onStartCall?.(activeRoom.id, true)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onStartScreenShare?.(activeRoom.id)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Users className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => renderMessage(message, index))}
              {renderTypingIndicator()}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply indicator */}
            {replyingTo && (
              <div className="bg-blue-50 border-t border-blue-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">
                      Replying to {replyingTo.senderName}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {replyingTo.content}
                    </p>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Edit indicator */}
            {editingMessage && (
              <div className="bg-yellow-50 border-t border-yellow-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-yellow-600">Editing message</p>
                  <button
                    onClick={() => {
                      setEditingMessage(null);
                      setNewMessage("");
                    }}
                    className="text-yellow-600 hover:text-yellow-800"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Message input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <textarea
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      editingMessage
                        ? "Edit your message..."
                        : "Type a message..."
                    }
                    className="w-full resize-none border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={1}
                    style={{ minHeight: "40px", maxHeight: "120px" }}
                  />
                </div>

                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                  <Smile className="w-5 h-5" />
                </button>

                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatManager;
