import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useConnectionMonitor } from '../../hooks/useConnectionMonitor';

interface ConnectionStatusProps {
  showDetails?: boolean;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  showDetails = false, 
  className = '' 
}) => {
  const { status, metrics, forceReconnect } = useConnectionMonitor();

  const getStatusColor = () => {
    if (status.isReconnecting) return 'text-yellow-400';
    if (status.isConnected) return 'text-green-400';
    return 'text-red-400';
  };

  const getStatusIcon = () => {
    if (status.isReconnecting) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (status.isConnected) return <Wifi className="w-4 h-4" />;
    return <WifiOff className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (status.isReconnecting) return `Reconnecting... (${status.reconnectAttempts}/10)`;
    if (status.isConnected) return 'Connected';
    return 'Disconnected';
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`${className}`}>
      {/* Basic Status Indicator */}
      <motion.div
        className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700/50"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <div className={`${getStatusColor()}`}>
          {getStatusIcon()}
        </div>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        
        {status.lastError && (
          <AlertTriangle className="w-4 h-4 text-red-400" />
        )}

        {!status.isReconnecting && !status.isConnected && (
          <button
            onClick={forceReconnect}
            className="ml-2 p-1 rounded bg-blue-600 hover:bg-blue-700 transition-colors"
            title="Reconnect"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </motion.div>

      {/* Detailed Status Panel */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 p-4 rounded-lg bg-gray-800/70 backdrop-blur-sm border border-gray-700/50"
          >
            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* Connection Info */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Connection Info
                </h4>
                
                <div className="space-y-1 text-gray-400">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={getStatusColor()}>{getStatusText()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                      <span>Response Time:</span>
                      <span>{status.responseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Check:</span>
                      <span>
                        {status.lastCheck 
                          ? new Date(status.lastCheck).toLocaleTimeString('en-US')
                          : 'Never'
                        }
                      </span>
                    </div>
                    {status.lastError && (
                      <div className="flex justify-between">
                        <span>Last Error:</span>
                      <span className="text-red-400 text-xs truncate max-w-32" title={status.lastError}>
                        {status.lastError}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-300 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Statistics
                </h4>
                
                <div className="space-y-1 text-gray-400">
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span>{formatUptime(metrics.uptime)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Disconnections:</span>
                    <span>{metrics.totalDisconnections}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Reconnections:</span>
                    <span>{metrics.totalReconnections}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Avg Response:</span>
                    <span>{Math.round(metrics.averageResponseTime)}ms</span>
                  </div>
                  
                  {metrics.lastDisconnection && (
                    <div className="flex justify-between">
                      <span>Last Disconnect:</span>
                      <span className="text-xs">
                        {metrics.lastDisconnection.toLocaleTimeString('en-US')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Connection Quality Indicator */}
            <div className="mt-4 pt-3 border-t border-gray-700/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Connection Quality:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <div
                      key={bar}
                      className={`w-1 h-3 rounded-full ${
                        status.responseTime < bar * 200
                          ? status.isConnected
                            ? 'bg-green-400'
                            : 'bg-red-400'
                          : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConnectionStatus;