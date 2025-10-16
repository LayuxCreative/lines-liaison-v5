import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { supabaseService } from '../services/supabaseService';

const DataDebug: React.FC = () => {
  const { user } = useAuth();
  const { projects, tasks, messages, loadProjects, loadTasks, loadMessages } = useData();
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);

  const testDirectQueries = async () => {
    setLoading(true);
    const results: Record<string, unknown> = {};
    
    try {
      console.log('Testing direct Supabase queries...');
      
      // Test projects query
      console.log('Testing projects query...');
      const projectsResult = await supabaseService.getProjects(user?.id);
      results.projects = projectsResult;
      console.log('Projects result:', projectsResult);
      
      // Test tasks query
      console.log('Testing tasks query...');
      const tasksResult = await supabaseService.getTasks();
      results.tasks = tasksResult;
      console.log('Tasks result:', tasksResult);
      
      // Test messages query
      console.log('Testing messages query...');
      const messagesResult = await supabaseService.getMessages();
      results.messages = messagesResult;
      console.log('Messages result:', messagesResult);
      
    } catch (error) {
      console.error('Error in direct queries:', error);
      results.error = error;
    }
    
    setDebugInfo(results);
    setLoading(false);
  };

  const reloadContextData = async () => {
    if (!user?.id) return;
    
    try {
      console.log('Reloading context data...');
      await Promise.all([
        loadProjects(user.id),
        loadTasks(),
        loadMessages()
      ]);
      console.log('Context data reloaded');
    } catch (error) {
      console.error('Error reloading context data:', error);
    }
  };

  useEffect(() => {
    console.log('DataDebug mounted');
    console.log('User:', user);
    console.log('Projects from context:', projects);
    console.log('Tasks from context:', tasks);
    console.log('Messages from context:', messages);
  }, [user, projects, tasks, messages]);

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Data Debug Page</h1>
        
        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Authentication</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        {/* Context Data */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Context Data</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Projects ({projects.length})</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-40">
                {JSON.stringify(projects, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-medium">Tasks ({tasks.length})</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-40">
                {JSON.stringify(tasks, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-medium">Messages ({messages.length})</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-40">
                {JSON.stringify(messages, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="space-x-4">
            <button
              onClick={testDirectQueries}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Direct Queries'}
            </button>
            <button
              onClick={reloadContextData}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Reload Context Data
            </button>
          </div>
        </div>

        {/* Debug Results */}
        {Object.keys(debugInfo).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Direct Query Results</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataDebug;