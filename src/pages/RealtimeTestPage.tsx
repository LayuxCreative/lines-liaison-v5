import React from 'react';
import { RealtimeTest } from '../components/realtime/RealtimeTest';

const RealtimeTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Realtime Test</h1>
          <p className="text-gray-300">Testing real-time connection and channels functionality</p>
        </div>
        
        <RealtimeTest />
      </div>
    </div>
  );
};

export default RealtimeTestPage;