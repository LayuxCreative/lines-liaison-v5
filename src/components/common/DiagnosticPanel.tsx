import React, { useState } from 'react';
import { diagnosticTest } from '../../utils/diagnosticTest';

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: unknown;
}

const DiagnosticPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    try {
      const testResults = await diagnosticTest.runAllTests();
      setResults(testResults);
    } catch (error) {
      console.error('Diagnostic tests failed:', error);
      setResults([{
        test: 'System Error',
        status: 'fail',
        message: 'Failed to run diagnostic tests',
        details: error instanceof Error ? error.message : 'Unknown error'
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return '✅';
      case 'fail':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'text-green-400';
      case 'fail':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDetails = (details: unknown): string => {
    try {
      return typeof details === 'string' 
        ? details 
        : JSON.stringify(details, null, 2);
    } catch {
      return 'Unable to display details';
    }
  };

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
      >
        🔧 Diagnostics
      </button>

      {isOpen && (
        <div className="absolute bottom-12 right-0 w-96 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold">Diagnostic Panel</h3>
            <button
              onClick={runTests}
              disabled={isRunning}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              {isRunning ? 'Running tests...' : 'Run Tests'}
            </button>
          </div>

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="bg-gray-800 rounded p-3">
                  <div className="flex items-center gap-2">
                    <span>{getStatusIcon(result.status)}</span>
                    <span className="text-white font-medium">{result.test}</span>
                  </div>
                  <p className={`text-sm mt-1 ${getStatusColor(result.status)}`}>
                    {result.message}
                  </p>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                        Show Details
                      </summary>
                      <pre className="text-gray-400 text-xs mt-1 overflow-x-auto">
                        <span>{formatDetails(result.details)}</span>
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}

          {results.length === 0 && !isRunning && (
            <p className="text-gray-400 text-center py-4">
              Click "Run Tests" to start diagnostics
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DiagnosticPanel;