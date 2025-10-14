import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, AlertTriangle } from 'lucide-react';

interface TwoFactorLoginProps {
  email: string;
  onVerified: (token: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const TwoFactorLogin: React.FC<TwoFactorLoginProps> = ({
  email,
  onVerified,
  onBack,
  isLoading = false
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode.trim()) {
      setError('Please enter a verification code');
      return;
    }

    setError(null);
    onVerified(verificationCode);
  };

  const handleBackupCodeToggle = () => {
    setUseBackupCode(!useBackupCode);
    setVerificationCode('');
    setError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      <div className="text-center mb-6">
        <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Two-Factor Authentication
        </h2>
        <p className="text-gray-600">
          Enter the verification code from your authenticator app
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Signing in as: <span className="font-medium">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {useBackupCode ? 'Backup Code' : 'Verification Code'}
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder={useBackupCode ? 'Enter backup code' : '000000'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={useBackupCode ? 10 : 6}
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-600 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!verificationCode || isLoading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Verifying...' : 'Verify & Sign In'}
        </button>

        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={handleBackupCodeToggle}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {useBackupCode 
              ? 'Use authenticator app instead' 
              : 'Use backup code instead'
            }
          </button>
          
          <div>
            <button
              type="button"
              onClick={onBack}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-700 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to login</span>
            </button>
          </div>
        </div>
      </form>

      {!useBackupCode && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Need help?</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Open your authenticator app (Google Authenticator, Authy, etc.)</li>
            <li>• Find the Lines Liaison entry</li>
            <li>• Enter the 6-digit code shown</li>
          </ul>
        </div>
      )}
    </motion.div>
  );
};

export default TwoFactorLogin;