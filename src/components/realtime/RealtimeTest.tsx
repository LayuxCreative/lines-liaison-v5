import React, { useState, useEffect } from 'react';
import { useRealtime } from '../../hooks/useRealtime';
import { RealtimeUser } from '../../services/realtime/RealtimeService';

interface RealtimeTestProps {
  className?: string;
}

export const RealtimeTest: React.FC<RealtimeTestProps> = ({ className = '' }) => {
  const [userId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);
  const [userName] = useState(() => `User ${Math.floor(Math.random() * 1000)}`);
  const [messageInput, setMessageInput] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<{type: string, id: string, name: string} | null>(null);

  const {
    isConnected,
    isConnecting,
    error,
    messages,
    activeUsers,
    activeProjectChannels,
    activeTaskChannels,
    connect,
    disconnect,
    joinProjectChannel,
    leaveProjectChannel,
    joinTaskChannel,
    leaveTaskChannel,
    joinTeamChannel,
    joinGeneralChannel,
    sendProjectMessage,
    sendTaskMessage,
    sendTeamMessage,
    sendGeneralMessage,
    clearMessages
  } = useRealtime();

  // Auto-connect on mount
  useEffect(() => {
    const user: RealtimeUser = {
      id: userId,
      name: userName,
      status: 'online',
      lastSeen: new Date()
    };
    connect(user);

    return () => {
      disconnect();
    };
  }, [userId, userName, connect, disconnect]);

  const handleConnect = async () => {
    const user: RealtimeUser = {
      id: userId,
      name: userName,
      status: 'online',
      lastSeen: new Date()
    };
    await connect(user);
  };

  const handleJoinProjectChannel = async () => {
    const projectId = 'project_001';
    const projectName = 'App Development Project';
    await joinProjectChannel(projectId, projectName);
    setSelectedChannel({ type: 'project', id: projectId, name: projectName });
  };

  const handleJoinTaskChannel = async () => {
    const taskId = 'task_001';
    const taskTitle = 'UI Development';
    const projectId = 'project_001';
    await joinTaskChannel(taskId, taskTitle, projectId, [userId]);
    setSelectedChannel({ type: 'task', id: taskId, name: taskTitle });
  };

  const handleJoinTeamChannel = async () => {
    const teamId = 'team_001';
    const teamName = 'Development Team';
    await joinTeamChannel(teamId, teamName);
    setSelectedChannel({ type: 'team', id: teamId, name: teamName });
  };

  const handleJoinGeneralChannel = async () => {
    await joinGeneralChannel();
    setSelectedChannel({ type: 'general', id: 'main', name: 'General Channel' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChannel) return;

    try {
      switch (selectedChannel.type) {
        case 'project':
          await sendProjectMessage(selectedChannel.id, messageInput);
          break;
        case 'task':
          await sendTaskMessage(selectedChannel.id, messageInput);
          break;
        case 'team':
          await sendTeamMessage(selectedChannel.id, messageInput);
          break;
        case 'general':
          await sendGeneralMessage(messageInput);
          break;
      }
      setMessageInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleLeaveChannel = async () => {
    if (!selectedChannel) return;

    try {
      switch (selectedChannel.type) {
        case 'project':
          await leaveProjectChannel(selectedChannel.id);
          break;
        case 'task':
          await leaveTaskChannel(selectedChannel.id);
          break;
      }
      setSelectedChannel(null);
    } catch (err) {
      console.error('Failed to leave channel:', err);
    }
  };

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Realtime Channels Test</h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-300">
            {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* User Info */}
      <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">User Information</h3>
        <p className="text-gray-300">ID: {userId}</p>
        <p className="text-gray-300">Name: {userName}</p>
        <p className="text-gray-300">Active Users: {activeUsers.length}</p>
      </div>

      {/* Connection Controls */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={handleConnect}
          disabled={isConnected || isConnecting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Connect
        </button>
        <button
          onClick={disconnect}
          disabled={!isConnected}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Disconnect
        </button>
        <button
          onClick={clearMessages}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          Clear Messages
        </button>
      </div>

      {/* Channel Controls */}
      {isConnected && (
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Channels</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <button
              onClick={handleJoinProjectChannel}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
            >
              Join Project
            </button>
            <button
              onClick={handleJoinTaskChannel}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm transition-colors"
            >
              Join Task
            </button>
            <button
              onClick={handleJoinTeamChannel}
              className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm transition-colors"
            >
              Join Team
            </button>
            <button
              onClick={handleJoinGeneralChannel}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
            >
              General Channel
            </button>
          </div>

          {selectedChannel && (
            <div className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
              <span className="text-white">Active Channel: {selectedChannel.name}</span>
              <button
                onClick={handleLeaveChannel}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
              >
                Leave
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Channels Info */}
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Active Project Channels ({activeProjectChannels.length})</h4>
            {activeProjectChannels.map(channel => (
              <div key={channel.projectId} className="text-gray-300 text-sm mb-1">
                {channel.projectName} - {channel.participantCount} participants
              </div>
            ))}
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">Active Task Channels ({activeTaskChannels.length})</h4>
            {activeTaskChannels.map(channel => (
              <div key={channel.taskId} className="text-gray-300 text-sm mb-1">
                {channel.taskTitle} - {channel.assignees.length} assigned
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      {isConnected && selectedChannel && (
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Send Message</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={`Type a message in ${selectedChannel.name}...`}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Messages ({messages.length})</h3>
        <div className="max-h-64 overflow-y-auto space-y-2">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No messages yet</p>
          ) : (
            messages.map((message, index) => (
              <div key={index} className="bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-blue-400 font-semibold">{message.senderName}</span>
                  <span className="text-gray-400 text-xs">
                    {message.timestamp.toLocaleTimeString('ar-SA')}
                  </span>
                </div>
                <p className="text-white">{message.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">Channel: {message.roomId}</span>
                  <span className="text-xs text-gray-400">Type: {message.type}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};