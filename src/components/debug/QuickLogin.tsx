import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

export const QuickLogin: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@linesliaison.com',
        password: 'admin123'
      });

      if (error) {
        setMessage(`Login failed: ${error.message}`);
      } else {
        setMessage('Login successful!');
        console.log('Login data:', data);
      }
    } catch (err) {
      setMessage(`Login error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestDatabase = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (error) {
        setMessage(`Database test failed: ${error.message}`);
      } else {
        setMessage(`Database test successful! Found ${data?.length || 0} records`);
        console.log('Database data:', data);
      }
    } catch (err) {
      setMessage(`Database error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setMessage(`Logout failed: ${error.message}`);
      } else {
        setMessage('Logout successful!');
      }
    } catch (err) {
      setMessage(`Logout error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Quick Authentication Test</h3>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Login as Admin'}
          </button>
          
          <button
            onClick={handleTestDatabase}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Test Database Access'}
          </button>
          
          <button
            onClick={handleLogout}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Logout'}
          </button>
        </div>
        
        {message && (
          <div className={`p-3 rounded ${
            message.includes('successful') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};