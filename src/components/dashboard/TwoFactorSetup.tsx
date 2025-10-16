import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Copy, Download, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { twoFactorService, type TwoFactorSetup as TwoFactorSetupData } from '../../services/twoFactorService';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from "../../hooks/useNotifications";
import { supabaseService } from '../../services/supabaseService';

interface TwoFactorSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onComplete, onCancel }) => {
  const { user, refreshUserProfile } = useAuth();
  const { addNotification } = useNotifications();
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [error, setError] = useState<string | null>(null);

  const generateSetup = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      const setup = await twoFactorService.generateSecret(user.email);
      setSetupData(setup);
    } catch (error) {
      console.error('Error generating 2FA setup:', error);
      setError('Failed to generate 2FA setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    generateSetup();
  }, [generateSetup]);

  const handleVerifyCode = async () => {
    if (!setupData || !user) return;

    setIsVerifying(true);
    setError(null);

    try {
      const verification = twoFactorService.verifyToken(verificationCode, setupData.secret);
      
      if (!verification.isValid) {
        setError(verification.error || 'Invalid verification code');
        setIsVerifying(false);
        return;
      }

      // Save 2FA settings to database
      const response = await supabaseService.toggleTwoFactor(true);

      if (!response.success) {
        throw new Error('Failed to enable 2FA');
      }

      // Refresh user profile
      await refreshUserProfile();

      setStep('backup');
      addNotification({
        type: 'security',
        category: 'security',
        title: 'Two-Factor Authentication Enabled',
        message: 'Your account is now protected with 2FA. Please save your backup codes.',
        priority: 'high',
        status: 'unread',
        actionRequired: true,
        userId: user.id,
        metadata: { relatedEntityType: 'user', relatedEntityId: user.id },
      });
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      setError('Failed to enable 2FA. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addNotification({
        type: 'message',
        category: 'system',
        title: 'Copied',
        message: 'Copied to clipboard',
        priority: 'low',
        status: 'unread',
        actionRequired: false,
        userId: user?.id || '',
        metadata: { customData: { target: 'clipboard' } },
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadBackupCodes = () => {
    if (!setupData) return;

    const content = `Lines Liaison - Two-Factor Authentication Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\nUser: ${user?.email}\n\nBackup Codes (use each code only once):\n${setupData.backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}\n\nKeep these codes in a safe place. You can use them to access your account if you lose your authenticator device.`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lines-liaison-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    if (a.parentNode === document.body) {
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {step === 'setup' && setupData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Set Up Two-Factor Authentication
            </h3>
            <p className="text-gray-600">
              Scan the QR code with your authenticator app
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border text-center">
            <img 
              src={setupData.qrCodeUrl} 
              alt="2FA QR Code" 
              className="mx-auto mb-4 max-w-full h-auto"
            />
            <p className="text-sm text-gray-600 mb-2">
              Can't scan? Enter this code manually:
            </p>
            <div className="flex items-center justify-center space-x-2">
              <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                {setupData.secret}
              </code>
              <button
                onClick={() => copyToClipboard(setupData.secret)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter verification code from your app:
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={6}
            />
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleVerifyCode}
              disabled={!verificationCode || isVerifying}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isVerifying && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>Verify & Enable</span>
            </button>
          </div>
        </motion.div>
      )}

      {step === 'backup' && setupData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              2FA Enabled Successfully!
            </h3>
            <p className="text-gray-600">
              Save these backup codes in a safe place
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Important!</h4>
                <p className="text-sm text-yellow-700">
                  These backup codes can be used to access your account if you lose your authenticator device. 
                  Each code can only be used once.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {setupData.backupCodes.map((code, index) => (
                <div key={index} className="bg-gray-50 p-2 rounded text-center font-mono text-sm">
                  {code}
                </div>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => copyToClipboard(setupData.backupCodes.join('\n'))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center justify-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Codes</span>
              </button>
              <button
                onClick={downloadBackupCodes}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>

          <button
            onClick={onComplete}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Complete Setup
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default TwoFactorSetup;