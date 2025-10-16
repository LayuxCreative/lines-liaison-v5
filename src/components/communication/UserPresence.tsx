import React, { useState } from "react";
import { Users, Clock } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useUserProfiles } from "../../hooks/useUserProfiles";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: "online" | "away" | "busy" | "offline";
  lastSeen?: Date | undefined;
  isTyping?: boolean;
}

interface UserPresenceProps {
  currentUser?: User;
  onlineUsers?: User[];
}

const UserPresence: React.FC<UserPresenceProps> = () => {
  const [showUserList, setShowUserList] = useState(false);
  const { user: currentUser } = useAuth();
  
  const { 
    users: profileUsers, 
    loading, 
    onlineCount, 
    totalCount 
  } = useUserProfiles({
    excludeCurrentUser: true,
    currentUserId: currentUser?.id,
    realtime: true
  });

  // Transform the data to match our User interface
  const users: User[] = profileUsers.map(profile => ({
    id: profile.id,
    name: profile.full_name || profile.email,
    email: profile.email,
    avatar: profile.avatar_url,
    status: profile.status === 'available' ? 'online' : 
            profile.status === 'busy' ? 'busy' :
            profile.status === 'away' ? 'away' : 'offline',
    lastSeen: profile.last_seen ? new Date(profile.last_seen) : undefined,
    isTyping: false
  }));

  const getStatusColor = (status: User["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = (status: User["status"]) => {
    switch (status) {
      case "online":
        return "Online";
      case "away":
        return "Away";
      case "busy":
        return "Busy";
      case "offline":
        return "Offline";
      default:
        return "Unknown";
    }
  };

  const formatLastSeen = (lastSeen: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return "Just now";
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };



  if (loading) {
    return (
      <div className="relative">
        <div className="flex items-center space-x-2 px-3 py-2 rounded-lg">
          <Users size={16} className="text-gray-400" />
          <span className="text-sm text-gray-400">Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Status Summary */}
      <button
        onClick={() => setShowUserList(!showUserList)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Users size={16} className="text-gray-600 dark:text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {onlineCount}/{totalCount} online
        </span>
        <div className="flex items-center space-x-1">
          {users.slice(0, 3).map((user) => (
            <div key={user.id} className="relative">
              <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {user.name.charAt(0)}
                </span>
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(user.status)} rounded-full border-2 border-white dark:border-gray-900`}
              ></div>
            </div>
          ))}
          {users.length > 3 && (
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                +{users.length - 3}
              </span>
            </div>
          )}
        </div>
      </button>

      {/* User List Dropdown */}
      {showUserList && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Team Members
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {onlineCount} of {totalCount} members online
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {/* Online Users */}
            <div className="p-2">
              <h4 className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Online ({users.filter((u) => u.status === "online").length})
              </h4>
              {users
                .filter((user) => user.status === "online")
                .map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(user.status)} rounded-full border-2 border-white dark:border-gray-800`}
                      ></div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.name}
                        {user.id === currentUser?.id && " (You)"}
                      </p>
                      {user.isTyping ? (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Typing...
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {getStatusText(user.status)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* Away/Busy Users */}
            {users.filter((u) => u.status === "away" || u.status === "busy")
              .length > 0 && (
              <div className="p-2">
                <h4 className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Away/Busy (
                  {
                    users.filter(
                      (u) => u.status === "away" || u.status === "busy",
                    ).length
                  }
                  )
                </h4>
                {users
                  .filter(
                    (user) => user.status === "away" || user.status === "busy",
                  )
                  .map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <div className="relative">
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(user.status)} rounded-full border-2 border-white dark:border-gray-800`}
                        ></div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {getStatusText(user.status)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Offline Users */}
            {users.filter((u) => u.status === "offline").length > 0 && (
              <div className="p-2">
                <h4 className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Offline ({users.filter((u) => u.status === "offline").length})
                </h4>
                {users
                  .filter((user) => user.status === "offline")
                  .map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg opacity-60"
                    >
                      <div className="relative">
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(user.status)} rounded-full border-2 border-white dark:border-gray-800`}
                        ></div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        <div className="flex items-center space-x-1">
                          <Clock size={10} className="text-gray-400" />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user.lastSeen
                              ? formatLastSeen(user.lastSeen)
                              : "Unknown"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPresence;
