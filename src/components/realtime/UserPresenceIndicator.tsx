import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Circle, Clock } from 'lucide-react';
import { useRealtime } from '../../hooks/useRealtime';

interface UserPresenceIndicatorProps {
  channelType: 'project' | 'task' | 'team' | 'general';
  channelId?: string;
  showUserList?: boolean;
  maxDisplayUsers?: number;
  className?: string;
  onUserClick?: (userId: string) => void;
}

interface ActiveUser {
  id: string;
  name: string;
  status: 'online' | 'away' | 'offline';
  joined_at: string;
}

export const UserPresenceIndicator: React.FC<UserPresenceIndicatorProps> = ({
  channelType,
  channelId,
  showUserList = true,
  maxDisplayUsers = 5
}) => {
  const { 
    isConnected, 
    activeUsers, 
    joinProjectChannel,
    leaveProjectChannel,
    joinTaskChannel,
    leaveTaskChannel,
    joinTeamChannel,
    joinGeneralChannel
  } = useRealtime();
  
  const [displayUsers, setDisplayUsers] = useState<ActiveUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    if (isConnected && channelId) {
      switch (channelType) {
        case 'project':
          joinProjectChannel(channelId, `Project ${channelId}`);
          break;
        case 'task':
          joinTaskChannel(channelId, `Task ${channelId}`, 'default-project');
          break;
        case 'team':
          joinTeamChannel(channelId, `Team ${channelId}`);
          break;
        case 'general':
          joinGeneralChannel();
          break;
      }
    }

    return () => {
      if (channelId) {
        switch (channelType) {
          case 'project':
            leaveProjectChannel(channelId);
            break;
          case 'task':
            leaveTaskChannel(channelId);
            break;
        }
      }
    };
  }, [isConnected, channelType, channelId, joinProjectChannel, leaveProjectChannel, joinTaskChannel, leaveTaskChannel, joinTeamChannel, joinGeneralChannel]);

  useEffect(() => {
    const users = activeUsers.map(user => ({
      id: user.id,
      name: user.name,
      status: user.status as 'online' | 'away' | 'offline',
      joined_at: new Date().toISOString()
    }));

    setTotalUsers(users.length);
    setDisplayUsers(users.slice(0, maxDisplayUsers));
  }, [activeUsers, maxDisplayUsers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
  };

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <Circle className="w-4 h-4 text-red-500" />
        <span className="text-sm">Offline</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Connection Status */}
      <div className="flex items-center space-x-2">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-2 h-2 bg-green-500 rounded-full"
        />
        <span className="text-sm text-gray-600">Online</span>
      </div>

      {/* Users Count */}
      <div className="flex items-center space-x-2">
        <Users className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium text-gray-700">
          {totalUsers} active users
        </span>
      </div>

      {/* User Avatars */}
      {showUserList && displayUsers.length > 0 && (
        <div className="flex items-center space-x-1">
          <AnimatePresence>
            {displayUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium relative">
                  {user.name.charAt(0).toUpperCase()}
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(user.status)} rounded-full border-2 border-white`} />
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-gray-300 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(user.joined_at)}</span>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Show more indicator */}
          {totalUsers > maxDisplayUsers && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium"
            >
              +{totalUsers - maxDisplayUsers}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserPresenceIndicator;