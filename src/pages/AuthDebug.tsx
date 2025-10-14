import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import QuickLogin from '../components/test/QuickLogin';

const AuthDebug: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [session, setSession] = useState<unknown>(null);
  const [dbTest, setDbTest] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('Session data:', sessionData);
        console.log('Session error:', sessionError);
        setSession(sessionData);

        // Test database connection
        const { data: testData, error: testError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .limit(1);
        
        console.log('DB test data:', testData);
        console.log('DB test error:', testError);
        setDbTest({ data: testData, error: testError });

      } catch (err) {
        console.error('Auth check error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>
        
        <div className="grid gap-6">
          {/* Quick Login Test */}
          <QuickLogin />
          
          {/* Auth Context Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Auth Context</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
              <p><strong>User:</strong> {user ? 'Logged in' : 'Not logged in'}</p>
              {user && (
                <div className="ml-4">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Role:</strong> {user.role}</p>
                </div>
              )}
            </div>
          </div>

          {/* Supabase Session */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Supabase Session</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          {/* Database Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Database Connection Test</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(dbTest, null, 2)}
            </pre>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-red-800 mb-4">Error</h2>
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthDebug;