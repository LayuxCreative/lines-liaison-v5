import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Phone,
  Video,
  Share,
  Settings,
  Users,
  Wifi,
  PhoneCall,
} from "lucide-react";
import ChatWindow from "../communication/ChatWindow";
import CallWindow from "../communication/CallWindow";
import ScreenShareWindow from "../communication/ScreenShareWindow";
import UserPresence from "../communication/UserPresence";

interface CommunicationHubProps {
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  projectId?: string;
}

type ActiveView =
  | "chat"
  | "audio-call"
  | "video-call"
  | "screen-share"
  | "settings";

const CommunicationHub: React.FC<CommunicationHubProps> = ({
  currentUser,
  projectId,
}) => {
  const [activeView, setActiveView] = useState<ActiveView>("chat");
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video" | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<{
    id: number;
    name: string;
    status: string;
    avatar?: string;
  }[]>([]);
  const [unreadMessages] = useState(3);

  useEffect(() => {
    // TODO: Replace with actual online users data from API
    setOnlineUsers([]);
  }, []);

  const handleStartCall = (type: "audio" | "video") => {
    setActiveView(type === "audio" ? "audio-call" : "video-call");
    setIsCallActive(true);
    setCallType(type);

  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setActiveView("chat");

  };

  const handleStartScreenShare = () => {
    setActiveView("screen-share");

  };

  const renderActiveView = () => {
    switch (activeView) {
      case "chat":
        return (
          <ChatWindow
            currentUser={currentUser}
            projectId={projectId}
            onStartCall={handleStartCall}
            onStartScreenShare={handleStartScreenShare}
          />
        );
      case "audio-call":
      case "video-call":
        return (
          <CallWindow
            currentUser={currentUser}
            isActive={isCallActive}
            onEndCall={handleEndCall}
            onStartScreenShare={handleStartScreenShare}
            callType={callType}
          />
        );
      case "screen-share":
        return (
          <ScreenShareWindow
            currentUser={currentUser}
            onStopSharing={() => setActiveView("chat")}
          />
        );
      case "settings":
        return (
          <div className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Communication Settings
            </h3>
            <p className="text-gray-600">
              Settings panel will be implemented here.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  const stats = [
    {
      title: "Online Users",
      value: onlineUsers.length.toString(),
      icon: Users,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Unread Messages",
      value: unreadMessages.toString(),
      icon: MessageCircle,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Call Status",
      value: isCallActive ? "Active" : "Idle",
      icon: PhoneCall,
      color: isCallActive ? "bg-red-500" : "bg-gray-500",
      bgColor: isCallActive ? "bg-red-50" : "bg-gray-50",
      textColor: isCallActive ? "text-red-600" : "text-gray-600",
    },
    {
      title: "Connection",
      value: "Connected",
      icon: Wifi,
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Communication Hub
          </h1>
          <p className="text-gray-600">
            Connect with your team through chat, calls, and screen sharing
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1, duration: 0.6 }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${stat.textColor}`} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* User Presence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8"
        >
          <UserPresence 
          currentUser={{
            ...currentUser,
            email: '',
            status: 'online' as const
          }} 
          onlineUsers={onlineUsers.map(user => ({
            ...user,
            id: user.id.toString(),
            email: '',
            status: user.status as 'online' | 'away' | 'busy' | 'offline'
          }))}
        />
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-white rounded-xl shadow-lg mb-8"
        >
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Communication Tools
            </h2>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <button
                onClick={() => setActiveView("chat")}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeView === "chat"
                    ? "bg-blue-600 text-white shadow-lg transform scale-105"
                    : "bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md"
                }`}
              >
                <MessageCircle size={20} />
                <span>Chat</span>
                {unreadMessages > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleStartCall("audio")}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeView === "audio-call"
                    ? "bg-teal-600 text-white shadow-lg transform scale-105"
                    : "bg-gray-50 text-gray-700 hover:bg-teal-50 hover:text-teal-600 hover:shadow-md"
                }`}
              >
                <Phone size={20} />
                <span>Audio Call</span>
              </button>

              <button
                onClick={() => handleStartCall("video")}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeView === "video-call"
                    ? "bg-orange-600 text-white shadow-lg transform scale-105"
                    : "bg-gray-50 text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:shadow-md"
                }`}
              >
                <Video size={20} />
                <span>Video Call</span>
              </button>

              <button
                onClick={handleStartScreenShare}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeView === "screen-share"
                    ? "bg-purple-600 text-white shadow-lg transform scale-105"
                    : "bg-gray-50 text-gray-700 hover:bg-purple-50 hover:text-purple-600 hover:shadow-md"
                }`}
              >
                <Share size={20} />
                <span>Share Screen</span>
              </button>

              <button
                onClick={() => setActiveView("settings")}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeView === "settings"
                    ? "bg-gray-600 text-white shadow-lg transform scale-105"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md"
                }`}
              >
                <Settings size={20} />
                <span>Settings</span>
              </button>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700 font-medium">
                  Connected
                </span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-full">
                <span className="text-sm text-blue-700 font-medium">
                  {onlineUsers.length} users online
                </span>
              </div>
              {isCallActive && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-red-50 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-700 font-medium">
                    Call in progress
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="overflow-hidden"
        >
          {renderActiveView()}
        </motion.div>
      </div>
    </div>
  );
};

export default CommunicationHub;
