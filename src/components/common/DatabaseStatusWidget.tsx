import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ConnectionStatus {
  status: 'connected' | 'disconnected' | 'checking';
  responseTime?: number;
  error?: string;
}

export const DatabaseStatusWidget: React.FC = () => {
  const [supabaseStatus, setSupabaseStatus] = useState<ConnectionStatus>({ status: 'checking' });
  const [isExpanded, setIsExpanded] = useState(false);

  const checkSupabaseConnection = async (): Promise<ConnectionStatus> => {
    const startTime = Date.now();
    
    try {
      // Test Supabase connection with auth session check
      const { error: authError } = await supabase.auth.getSession();
      
      if (authError && authError.message !== 'Invalid Refresh Token: Refresh Token Not Found') {
        throw authError;
      }

      // Test database query
      const { error: queryError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (queryError && !queryError.message.includes('RLS')) {
        throw queryError;
      }

      const responseTime = Date.now() - startTime;
      
      return {
        status: 'connected',
        responseTime,
      };
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to database';
      return {
        status: 'disconnected',
        responseTime,
        error: errorMessage
      };
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      const result = await checkSupabaseConnection();
      setSupabaseStatus(result);
    };

    // Initial check
    checkConnection();

    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-400';
      case 'disconnected': return 'text-red-400';
      case 'checking': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <Wifi className="w-4 h-4" />;
      case 'disconnected': return <WifiOff className="w-4 h-4" />;
      case 'checking': return <Database className="w-4 h-4 animate-pulse" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'disconnected': return 'Disconnected';
      case 'checking': return 'Checking...';
      default: return 'Unknown';
    }
  };

  const overallStatus = supabaseStatus.status === 'connected';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <motion.div
        className={`
          backdrop-blur-md rounded-lg border shadow-lg p-3 cursor-pointer
          ${overallStatus 
            ? 'bg-green-500/20 border-green-500/30' 
            : 'bg-red-500/20 border-red-500/30'
          }
        `}
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-2">
          {getStatusIcon(supabaseStatus.status)}
          <span className={`text-sm font-medium ${getStatusColor(supabaseStatus.status)}`}>
            {getStatusText(supabaseStatus.status)}
          </span>
        </div>
      </motion.div>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2 backdrop-blur-md bg-gray-900/80 rounded-lg border border-gray-700 p-4 min-w-[320px]"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4" />
                System Status
              </h3>
            </div>

            {/* Supabase Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Database className="w-4 h-4" />
                Database (Supabase)
              </div>
              <div className="space-y-1 text-xs ml-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={getStatusColor(supabaseStatus.status)}>
                    {getStatusText(supabaseStatus.status)}
                  </span>
                </div>
                {supabaseStatus.responseTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Response Time:</span>
                    <span className="text-white">{supabaseStatus.responseTime}ms</span>
                  </div>
                )}
                {supabaseStatus.error && (
                  <div className="mt-1 p-2 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-xs">
                    {supabaseStatus.error}
                  </div>
                )}
              </div>
            </div>

            {/* Timestamp */}
            <div className="pt-2 border-t border-gray-700">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Last Check:</span>
                <span className="text-white">{new Date().toLocaleTimeString('ar-SA')}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DatabaseStatusWidget;