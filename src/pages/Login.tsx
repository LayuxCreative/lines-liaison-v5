import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { supabase, pingSupabaseHealth } from "../lib/supabase";
import LoadingSpinner from "../components/common/LoadingSpinner";
import TwoFactorLogin from "../components/auth/TwoFactorLogin";

const Login: React.FC = () => {
  const [email, setEmail] = useState("support@astrolabetech.xyz");
  const [password, setPassword] = useState("Support@2024!");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean;
    message: string;
    isChecking: boolean;
  }>({
    isConnected: false,
    message: "Checking connection...",
    isChecking: true
  });

  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (user && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [user, isLoading, navigate, from]);

  // Test Supabase database connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      console.log('🔍 Testing Supabase connection...');
      setConnectionStatus({
        isConnected: false,
        message: "Checking database connection...",
        isChecking: true
      });

      try {
        // Test 1: Check if Supabase client is initialized
        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }

        // Test 2: Health ping that doesn't depend on RLS
        const health = await pingSupabaseHealth(5000);
        console.log('🔍 Health ping:', health);

        if (health.ok) {
          setConnectionStatus({
            isConnected: true,
            message: "Successfully connected to database",
            isChecking: false
          });
          console.log('✅ Supabase health OK');
        } else {
          throw new Error(`Health check failed: ${health.error || health.status}`);
        }
      } catch (error) {
        console.error('❌ Supabase connection test failed:', error);
        setConnectionStatus({
          isConnected: false,
          message: "Not connected to database",
          isChecking: false
        });
      }
    };

    // Add a small delay to ensure component is mounted
    const timer = setTimeout(testConnection, 500);
    return () => clearTimeout(timer);
  }, []);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🔍 DEBUG: Login attempt started
    console.log('🔍 DEBUG: Login attempt started', { 
      email, 
      timestamp: new Date().toISOString(),
      connectionStatus: connectionStatus.isConnected 
    });
    
    // Prevent submission if connection health is not OK
    if (!connectionStatus.isConnected) {
      setError('Authentication service is currently unreachable. Please try again later or check your connection.');
      return;
    }

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // 🔍 DEBUG: Calling login function
      console.log('🔍 DEBUG: Calling login function with email:', email);
      
      // Add a safety timeout so UI never hangs indefinitely
      function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
        return new Promise<T>((resolve, reject) => {
          const id = setTimeout(() => reject(new Error('Authentication service request timed out')), ms);
          promise
            .then((value) => { clearTimeout(id); resolve(value); })
            .catch((err) => { clearTimeout(id); reject(err); });
        });
      }

      const result = await withTimeout(login(email, password), 15000);
      
      if (result.success) {
        // 🔍 DEBUG: Login successful
        console.log('🔍 DEBUG: Login successful, redirecting...');
        setSuccess("Login successful! Redirecting...");
        navigate(from, { replace: true });
      } else {
        // Handle login failure
        console.error('🔍 DEBUG: Login failed:', result.error);
        
        if (result.requiresTwoFactor) {
          setShowTwoFactor(true);
        } else if (result.error?.includes('Email not confirmed')) {
          setError("Please confirm your email before logging in. Check your inbox.");
        } else {
          setError(result.error || "Login failed. Please try again.");
        }
      }
    } catch (err: unknown) {
      // 🔍 DEBUG: Unexpected error occurred
      console.error('🔍 DEBUG: Unexpected error:', err);
      
      const error = err as Error;
      // Provide localized message for timeout and generic errors
      const message = error.message?.toLowerCase().includes('timed out')
        ? 'Authentication service timed out. Please try again shortly.'
        : (error.message || "An unexpected error occurred. Please try again.");
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleTwoFactorVerified = async () => {
    setSuccess("Login successful! Redirecting to dashboard...");
    setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 1500);
  };

  const handleTwoFactorBack = () => {
    setShowTwoFactor(false);
    setEmail("");
    setPassword("");
  };

  // Show 2FA form if required
  if (showTwoFactor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <TwoFactorLogin
          email={email}
          onVerified={handleTwoFactorVerified}
          onBack={handleTwoFactorBack}
          isLoading={isSubmitting}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full"
      >
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Sign In</h3>
              <p className="text-gray-600 mt-2">
                Enter your credentials to access your account
              </p>
            </div>

            {/* Connection Status */}
            <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2">
                {connectionStatus.isChecking ? (
                  <LoadingSpinner size="sm" />
                ) : connectionStatus.isConnected ? (
                  <Wifi className="w-4 h-4 text-green-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-600" />
                )}
                <p className={`text-sm font-medium ${
                  connectionStatus.isConnected 
                    ? 'text-green-600' 
                    : connectionStatus.isChecking 
                    ? 'text-gray-600' 
                    : 'text-red-600'
                }`}>
                  {connectionStatus.isChecking && 'Checking database connection...'}
                  {connectionStatus.isConnected && !connectionStatus.isChecking && 'Successfully connected to database'}
                  {!connectionStatus.isConnected && !connectionStatus.isChecking && 'Not connected to database'}
                </p>
              </div>
            </div>

            {/* Error Messages */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
                {error.includes('Please confirm your email') && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (email) {
                        try {
                          await supabase.auth.resend({
                            type: 'signup',
                            email: email,
                          });
                          setSuccess('A new confirmation email has been sent to your email address');
                          setError('');
                        } catch (err) {
                          console.error('Error resending confirmation:', err);
                          setError('Failed to send confirmation email. Please try again.');
                        }
                      }
                    }}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    Resend Confirmation Email
                  </button>
                )}
              </div>
            )}

            {/* Success Messages */}
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>


            </form>

            {/* Contact Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Need access?{" "}
                <a
                  href="/contact"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Contact our team
                </a>
              </p>
            </div>
          </div>
        </motion.div>
    </div>
  );
};

export default Login;
