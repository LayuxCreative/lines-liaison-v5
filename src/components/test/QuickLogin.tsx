import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

const QuickLogin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const testLogin = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@linesliaison.com',
        password: 'admin123'
      });

      if (error) {
        setMessage(`Login Error: ${error.message}`);
        console.error('Login error:', error);
      } else {
        setMessage('Login successful!');
        console.log('Login success:', data);
        
        // Test database access
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);
          
        if (profileError) {
          setMessage(prev => prev + ` | Profile Error: ${profileError.message}`);
        } else {
          setMessage(prev => prev + ` | Profile data loaded: ${profileData?.length} records`);
        }
      }
    } catch (err) {
      setMessage(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testLogout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setMessage(`Logout Error: ${error.message}`);
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
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Quick Authentication Test</h3>
      
      <div className="space-y-4">
        <button
          onClick={testLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Login (admin@linesliaison.com)'}
        </button>
        
        <button
          onClick={testLogout}
          disabled={loading}
          className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Logout'}
        </button>
        
        {message && (
          <div className={`p-3 rounded text-sm ${
            message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickLogin;