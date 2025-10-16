import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, AlertTriangle, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from "../../hooks/useNotifications";
import { supabaseService } from '../../services/supabaseService';
import TwoFactorSetup from './TwoFactorSetup';

const TwoFactorManagement: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const { addNotification } = useNotifications();
  const [showSetup, setShowSetup] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  const handleDisable2FA = async () => {
    if (!user) return;

    setIsDisabling(true);
    try {
      const response = await supabaseService.toggleTwoFactor(false);

      if (!response.success) throw new Error(response.error);

      await refreshUserProfile();
      
      addNotification({
        type: 'success',
        title: 'Two-Factor Authentication Disabled',
        message: 'Your account is no longer protected with 2FA.',
        userId: user.id
      });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      addNotification({
        type: 'error',
        title: 'Failed to Disable 2FA',
        message: 'Please try again later.',
        userId: user.id
      });
    } finally {
      setIsDisabling(false);
    }
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
  };

  const handleSetupCancel = () => {
    setShowSetup(false);
  };

  if (showSetup) {
    return (
      <TwoFactorSetup
        onComplete={handleSetupComplete}
        onCancel={handleSetupCancel}
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Shield className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Two-Factor Authentication
        </h3>
      </div>

      {user?.twoFactorEnabled ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">2FA is enabled</p>
              <p className="text-sm text-green-600">
                Your account is protected with two-factor authentication
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleDisable2FA}
              disabled={isDisabling}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDisabling ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">2FA is not enabled</p>
              <p className="text-sm text-yellow-600">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Benefits of 2FA:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Protects against unauthorized access</li>
              <li>• Secures your account even if password is compromised</li>
              <li>• Industry standard security practice</li>
            </ul>
          </div>

          <button
            onClick={() => setShowSetup(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Settings className="w-4 h-4" />
            <span>Enable 2FA</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default TwoFactorManagement;