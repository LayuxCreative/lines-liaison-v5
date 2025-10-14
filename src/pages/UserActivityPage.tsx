import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, User } from 'lucide-react';

const UserActivityPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto"
      >
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-8">
          <div className="flex items-center gap-3 mb-8">
            <Activity className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">User Activity</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Recent Activities */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-emerald-400" />
                <h2 className="text-xl font-semibold text-white">Recent Activities</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300 text-sm">User logged in</span>
                  <span className="text-gray-500 text-xs ml-auto">2 min ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300 text-sm">Project updated</span>
                  <span className="text-gray-500 text-xs ml-auto">5 min ago</span>
                </div>
              </div>
            </motion.div>

            {/* Activity Stats */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Activity Stats</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">Today</span>
                    <span className="text-blue-400">12 activities</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-400 h-2 rounded-full w-3/4"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">This Week</span>
                    <span className="text-emerald-400">48 activities</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-emerald-400 h-2 rounded-full w-4/5"></div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* User Info */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4">User Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-white font-medium">Support User</p>
                    <p className="text-gray-400 text-sm">support@astrolabetech.xyz</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-white/10">
                  <p className="text-gray-300 text-sm">Role: Admin</p>
                  <p className="text-gray-300 text-sm">Status: Active</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserActivityPage;