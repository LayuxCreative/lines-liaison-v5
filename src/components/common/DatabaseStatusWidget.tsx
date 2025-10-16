import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Wifi, WifiOff, AlertCircle, Shield, HardDrive, Zap } from 'lucide-react';
import { pingSupabaseHealth, getSupabaseProjectRef } from '../../lib/supabase';
import supabase from '../../lib/supabase';

interface ConnectionStatus {
  status: 'connected' | 'disconnected' | 'checking';
  responseTime?: number;
  error?: string;
}

interface ServiceStatus {
  auth: ConnectionStatus;
  storage: ConnectionStatus;
  realtime: ConnectionStatus;
}

export const DatabaseStatusWidget: React.FC = () => {
  const [supabaseStatus, setSupabaseStatus] = useState<ConnectionStatus>({ status: 'checking' });
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    auth: { status: 'checking' },
    storage: { status: 'checking' },
    realtime: { status: 'checking' }
  });
  const [projectRef, setProjectRef] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);

  const checkSupabaseConnection = async (): Promise<ConnectionStatus> => {
    const startTime = Date.now();
    try {
      const health = await pingSupabaseHealth(5000);
      const responseTime = Date.now() - startTime;

      if (health.ok) {
        return { status: 'connected', responseTime };
      }

      return {
        status: 'disconnected',
        responseTime,
        error: typeof health.status !== 'undefined' ? `HTTP ${health.status}` : health.error || 'Health check failed'
      };
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to database';
      return { status: 'disconnected', responseTime, error: errorMessage };
    }
  };

  const checkAuthService = async (): Promise<ConnectionStatus> => {
    const startTime = Date.now();
    try {
      const { error } = await supabase.auth.getSession();
      const responseTime = Date.now() - startTime;
      
      if (error) {
        return { status: 'disconnected', responseTime, error: error.message };
      }
      
      return { status: 'connected', responseTime };
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Auth service check failed';
      return { status: 'disconnected', responseTime, error: errorMessage };
    }
  };

  const checkStorageService = async (): Promise<ConnectionStatus> => {
    const startTime = Date.now();
    try {
      const { error } = await supabase.storage.listBuckets();
      const responseTime = Date.now() - startTime;
      
      if (error) {
        return { status: 'disconnected', responseTime, error: error.message };
      }
      
      return { status: 'connected', responseTime };
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Storage service check failed';
      return { status: 'disconnected', responseTime, error: errorMessage };
    }
  };

  const checkRealtimeService = async (): Promise<ConnectionStatus> => {
    const startTime = Date.now();
    try {
      // Check if realtime is available by checking channel status
      const channel = supabase.channel('health-check');
      const responseTime = Date.now() - startTime;
      
      // If we can create a channel, realtime is available
      if (channel) {
        channel.unsubscribe();
        return { status: 'connected', responseTime };
      }
      
      return { status: 'disconnected', responseTime, error: 'Realtime channel creation failed' };
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Realtime service check failed';
      return { status: 'disconnected', responseTime, error: errorMessage };
    }
  };

  useEffect(() => {
    const checkAllServices = async () => {
      // Get project reference
      const ref = getSupabaseProjectRef() || '';
      setProjectRef(ref);

      // Check main database connection
      const dbResult = await checkSupabaseConnection();
      setSupabaseStatus(dbResult);

      // Check individual services
      const [authResult, storageResult, realtimeResult] = await Promise.all([
        checkAuthService(),
        checkStorageService(),
        checkRealtimeService()
      ]);

      setServiceStatus({
        auth: authResult,
        storage: storageResult,
        realtime: realtimeResult
      });
    };

    // Initial check
    checkAllServices();

    // Check every 30 seconds
    const interval = setInterval(checkAllServices, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-emerald-400';
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
          backdrop-blur-xl rounded-lg border shadow-xl p-3 cursor-pointer
          ${overallStatus 
            ? 'bg-emerald-500/30 border-emerald-400/50 shadow-emerald-500/20' 
            : 'bg-red-500/30 border-red-400/50 shadow-red-500/20'
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
          className="mt-2 backdrop-blur-xl bg-gray-900/90 rounded-lg border border-gray-600/50 shadow-2xl p-4 min-w-[380px]"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4" />
                Supabase Status
              </h3>
            </div>

            {/* Project Reference */}
            {projectRef && (
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-300">
                  <Database className="w-4 h-4" />
                  Connected Project
                </div>
                <div className="text-xs text-blue-200 mt-1 font-mono">
                  {projectRef}
                </div>
              </div>
            )}

            {/* Main Database Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Database className="w-4 h-4" />
                Database
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

            {/* Auth Service Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Shield className="w-4 h-4" />
                Authentication
              </div>
              <div className="space-y-1 text-xs ml-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={getStatusColor(serviceStatus.auth.status)}>
                    {getStatusText(serviceStatus.auth.status)}
                  </span>
                </div>
                {serviceStatus.auth.responseTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Response Time:</span>
                    <span className="text-white">{serviceStatus.auth.responseTime}ms</span>
                  </div>
                )}
                {serviceStatus.auth.error && (
                  <div className="mt-1 p-2 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-xs">
                    {serviceStatus.auth.error}
                  </div>
                )}
              </div>
            </div>

            {/* Storage Service Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <HardDrive className="w-4 h-4" />
                Storage
              </div>
              <div className="space-y-1 text-xs ml-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={getStatusColor(serviceStatus.storage.status)}>
                    {getStatusText(serviceStatus.storage.status)}
                  </span>
                </div>
                {serviceStatus.storage.responseTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Response Time:</span>
                    <span className="text-white">{serviceStatus.storage.responseTime}ms</span>
                  </div>
                )}
                {serviceStatus.storage.error && (
                  <div className="mt-1 p-2 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-xs">
                    {serviceStatus.storage.error}
                  </div>
                )}
              </div>
            </div>

            {/* Realtime Service Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Zap className="w-4 h-4" />
                Realtime
              </div>
              <div className="space-y-1 text-xs ml-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={getStatusColor(serviceStatus.realtime.status)}>
                    {getStatusText(serviceStatus.realtime.status)}
                  </span>
                </div>
                {serviceStatus.realtime.responseTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Response Time:</span>
                    <span className="text-white">{serviceStatus.realtime.responseTime}ms</span>
                  </div>
                )}
                {serviceStatus.realtime.error && (
                  <div className="mt-1 p-2 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-xs">
                    {serviceStatus.realtime.error}
                  </div>
                )}
              </div>
            </div>

            {/* Timestamp */}
            <div className="pt-2 border-t border-gray-600">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Last Check:</span>
                <span className="text-white">{new Date().toLocaleTimeString('en-US')}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DatabaseStatusWidget;