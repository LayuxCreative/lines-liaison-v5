import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { getStoredMetrics } from '../../services/performanceMonitoringService';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url?: string;
  method?: string;
  status?: number;
}

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string>('all');

  useEffect(() => {
    const loadMetrics = () => {
      const storedMetrics = getStoredMetrics();
      setMetrics(storedMetrics);
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getMetricsByType = (type: string) => {
    if (type === 'all') return metrics;
    return metrics.filter(metric => metric.name === type);
  };

  const getAverageValue = (metricType: string) => {
    const typeMetrics = getMetricsByType(metricType);
    if (typeMetrics.length === 0) return 0;
    return typeMetrics.reduce((sum, metric) => sum + metric.value, 0) / typeMetrics.length;
  };

  const getMetricTrend = (metricType: string) => {
    const typeMetrics = getMetricsByType(metricType);
    if (typeMetrics.length < 2) return 'stable';
    
    const recent = typeMetrics.slice(-5);
    const older = typeMetrics.slice(-10, -5);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length;
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 10) return 'up';
    if (change < -10) return 'down';
    return 'stable';
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const metricTypes = [
    { key: 'all', label: 'All Metrics', icon: Activity },
    { key: 'CLS', label: 'Cumulative Layout Shift', icon: Zap },
    { key: 'FID', label: 'First Input Delay', icon: Clock },
    { key: 'FCP', label: 'First Contentful Paint', icon: CheckCircle },
    { key: 'LCP', label: 'Largest Contentful Paint', icon: AlertTriangle },
    { key: 'TTFB', label: 'Time to First Byte', icon: TrendingUp },
    { key: 'api_call', label: 'API Calls', icon: Activity },
  ];

  const filteredMetrics = getMetricsByType(selectedMetric);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-gray-600">
            {metrics.length} metrics collected
          </span>
        </div>
      </div>

      {/* Metric Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {metricTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedMetric === type.key;
          const average = getAverageValue(type.key);
          const trend = getMetricTrend(type.key);
          
          return (
            <button
              key={type.key}
              onClick={() => setSelectedMetric(type.key)}
              className={`p-3 rounded-lg border transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon className="w-4 h-4" />
                {getTrendIcon(trend)}
              </div>
              <div className="text-xs font-medium truncate">{type.label}</div>
              {type.key !== 'all' && (
                <div className="text-xs text-gray-500 mt-1">
                  {average.toFixed(1)}ms avg
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['CLS', 'FID', 'FCP', 'LCP'].map((metricType) => {
          const typeMetrics = getMetricsByType(metricType);
          const average = getAverageValue(metricType);
          const latest = typeMetrics[typeMetrics.length - 1];
          const rating = latest?.rating || 'good';
          
          return (
            <div key={metricType} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">{metricType}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(rating)}`}>
                  {rating}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {average.toFixed(1)}
                <span className="text-sm font-normal text-gray-500 ml-1">ms</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {typeMetrics.length} measurements
              </div>
            </div>
          );
        })}
      </div>

      {/* Metrics Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Metrics
            {selectedMetric !== 'all' && (
              <span className="ml-2 text-sm text-gray-500">
                ({selectedMetric})
              </span>
            )}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMetrics.slice(-20).reverse().map((metric, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {metric.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {metric.value.toFixed(2)}
                    {metric.name.includes('api_call') ? 'ms' : metric.name === 'CLS' ? '' : 'ms'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(metric.rating)}`}>
                      {metric.rating}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(metric.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.url && (
                      <div className="truncate max-w-xs">
                        {metric.method} {metric.url}
                        {metric.status && (
                          <span className={`ml-2 ${metric.status >= 400 ? 'text-red-600' : 'text-green-600'}`}>
                            ({metric.status})
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredMetrics.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No metrics available for the selected type
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceDashboard;