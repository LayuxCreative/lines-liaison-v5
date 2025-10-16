import React from 'react';

const EnvTest: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const appName = import.meta.env.VITE_APP_NAME;
  const debug = import.meta.env.VITE_DEBUG;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Environment Variables Test</h1>
        
        <div className="space-y-4">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Supabase URL:</h2>
            <p className="text-green-400 font-mono">
              {supabaseUrl || 'NOT FOUND'}
            </p>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Supabase Key:</h2>
            <p className="text-green-400 font-mono">
              {supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT FOUND'}
            </p>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">App Name:</h2>
            <p className="text-green-400 font-mono">
              {appName || 'NOT FOUND'}
            </p>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Debug Mode:</h2>
            <p className="text-green-400 font-mono">
              {debug || 'NOT FOUND'}
            </p>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">All Environment Variables:</h2>
            <pre className="text-green-400 font-mono text-sm overflow-auto">
              {JSON.stringify(import.meta.env, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvTest;