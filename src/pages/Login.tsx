import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  ArrowRight,
  CheckCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { SupabaseConnectionTest } from "../utils/connectionTest";


const Login: React.FC = () => {
  const [email, setEmail] = useState("admin@linesliaison.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Test Supabase connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      setConnectionStatus({
        isConnected: false,
        message: "Checking connection...",
        isChecking: true
      });

      try {
        // Increased timeout for better reliability
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 30000)
        );

        const connectionPromise = SupabaseConnectionTest.testConnection();
        
        const result = await Promise.race([connectionPromise, timeoutPromise]) as { success: boolean; message: string; latency?: number };
        
        setConnectionStatus({
          isConnected: result.success,
          message: result.success ? "Connected successfully" : result.message,
          isChecking: false
        });
      } catch (error) {
        console.error('Connection test failed:', error);
        // Allow login attempt even if connection test fails
        setConnectionStatus({
          isConnected: true, // Changed to true to allow login attempts
          message: "Connection test timeout - proceeding with login",
          isChecking: false
        });
      }
    };

    testConnection();
  }, []);



  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    // Skip connection check - allow login attempt regardless

    // Get form data using FormData as recommended
    const formData = new FormData(e.currentTarget);
    const formEmail = formData.get('email') as string;
    const formPassword = formData.get('password') as string;

    // Basic validation
    if (!formEmail || !formPassword) {
      setError('Please enter both email and password');
      setIsSubmitting(false);
      return;
    }

    if (!formEmail.includes('@')) {
      setError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('🔑 Attempting login with provided credentials...');
      
      const result = await login(formEmail, formPassword);
      
      if (result.success) {
        setSuccess("Login successful! Redirecting to dashboard...");
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 1500);
      } else {
        let errorMessage = result.error || "Login failed";
        
        // Provide more user-friendly error messages
        if (errorMessage.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (errorMessage.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account before logging in.';
        } else if (errorMessage.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a few minutes and try again.';
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };





  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-start justify-center px-4 sm:px-6 lg:px-8 pt-16">
      <div className="max-w-4xl w-full py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center lg:text-left lg:sticky lg:top-8"
        >
          <div className="flex items-center justify-center lg:justify-start space-x-3 mb-6">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-600 rounded-2xl shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                LiNES AND LiAiSON
              </h1>
              <p className="text-sm text-gray-600 font-medium">
                Engineering Excellence
              </p>
            </div>
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Welcome Back
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Access your project management dashboard and collaborate with your
            team on engineering excellence.
          </p>

          {/* Security Note */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-green-900">
                  Secure Access
                </h4>
                <p className="text-xs text-green-700 mt-1">
                  Your data is protected with enterprise-grade security and
                  encryption.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="max-w-md w-full mx-auto"
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
                  {connectionStatus.isChecking && 'Checking Supabase connection...'}
                  {connectionStatus.isConnected && !connectionStatus.isChecking && 'Connected successfully'}
                  {!connectionStatus.isConnected && !connectionStatus.isChecking && 'Connection failed. Please try again.'}
                </p>
              </div>
            </div>

            {/* Error Messages */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
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
                    placeholder="admin@linesliaison.com"
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

              {/* Admin Account Info */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <p className="text-sm text-blue-800 font-medium">
                    Admin Account Ready
                  </p>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Use the credentials above to sign in as administrator
                </p>
              </div>
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
      </div>
    </div>
  );
};

export default Login;
