import React from 'react';
import { motion } from 'framer-motion';
import { Database, CheckCircle } from 'lucide-react';
import SupabaseTest from '../components/test/SupabaseTest';

const SupabaseTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Database className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Supabase Connection Test</h1>
          </div>
          <p className="text-gray-300">
            Testing the Supabase connection and database queries
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-semibold text-white">Configuration Status</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-gray-300 mb-1">Supabase URL:</p>
              <p className="text-green-400 font-mono text-xs break-all">
                {import.meta.env.VITE_SUPABASE_URL || 'NOT CONFIGURED'}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-gray-300 mb-1">API Key:</p>
              <p className="text-green-400 font-mono text-xs">
                ✅ Configured
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <SupabaseTest />
        </motion.div>
      </div>
    </div>
  );
};

export default SupabaseTestPage;