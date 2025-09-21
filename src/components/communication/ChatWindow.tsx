import React, { useState, useEffect, useRef } from "react";
import { Send, Paperclip, Smile, Phone, Video, Share } from "lucide-react";

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  type: "text" | "file" | "image";
  fileUrl?: string;
}

interface ChatWindowProps {
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  projectId?: string;
  onStartCall: (type: "audio" | "video") => void;
  onStartScreenShare: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  currentUser,
  projectId,
  onStartCall,
  onStartScreenShare,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize empty messages - will be loaded from actual data
    setMessages([]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        content: newMessage,
        senderId: currentUser?.id || "current-user",
        senderName: currentUser?.name || "You",
        timestamp: new Date(),
        type: "text",
      };

      setMessages((prev) => [...prev, message]);
      setNewMessage("");

      // Here we would emit the message via Socket.io
  
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Here we would upload the file and create a message
  

      const fileMessage: Message = {
        id: Date.now().toString(),
        content: `Shared file: ${file.name}`,
        senderId: currentUser?.id || "current-user",
        senderName: currentUser?.name || "You",
        timestamp: new Date(),
        type: "file",
        fileUrl: URL.createObjectURL(file),
      };

      setMessages((prev) => [...prev, fileMessage]);
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isCurrentUser = (senderId: string) => {
    return senderId === currentUser?.id || senderId === "current-user";
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {projectId ? "Project Chat" : "General Chat"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {messages.length} messages
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onStartCall("audio")}
            className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Start audio call"
          >
            <Phone size={18} />
          </button>
          <button
            onClick={() => onStartCall("video")}
            className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Start video call"
          >
            <Video size={18} />
          </button>
          <button
            onClick={onStartScreenShare}
            className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Share screen"
          >
            <Share size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${isCurrentUser(message.senderId) ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                isCurrentUser(message.senderId)
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
              }`}
            >
              {!isCurrentUser(message.senderId) && (
                <p className="text-xs font-semibold mb-1 opacity-75">
                  {message.senderName}
                </p>
              )}

              {message.type === "file" ? (
                <div>
                  <p className="text-sm">{message.content}</p>
                  {message.fileUrl && (
                    <a
                      href={message.fileUrl}
                      download
                      className="text-xs underline opacity-75 hover:opacity-100"
                    >
                      Download
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm">{message.content}</p>
              )}

              <p className="text-xs opacity-75 mt-1">
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}



        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleFileUpload}
            className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>

          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              rows={1}
              style={{ minHeight: "40px", maxHeight: "120px" }}
            />
          </div>

          <button
            className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Add emoji"
          >
            <Smile size={18} />
          </button>

          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <Send size={18} />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="*/*"
        />
      </div>
    </div>
  );
};

export default ChatWindow;
