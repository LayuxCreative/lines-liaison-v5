import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Filter, 
  Download, 
  Search, 
  User, 
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
  BarChart3,
  TrendingUp,
  Users
} from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';

interface ActivityRecord {
  id: string;
  project_id: string;
  user_id: string;
  action: string;
  description: string;
  timestamp: string;
  metadata: Record<string, any>;
}

interface FilterOptions {
  dateFrom: string;
  dateTo: string;
  action: string;
  userId: string;
  search: string;
}

const Reports: React.FC = () => {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    dateFrom: '',
    dateTo: '',
    action: '',
    userId: '',
    search: ''
  });

  const actionTypes = [
    'user_login',
    'user_logout',
    'project_created',
    'project_updated',
    'task_created',
    'task_updated',
    'file_uploaded',
    'comment_added'
  ];

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [activities, filters]);

  const fetchActivities = async () => {
     try {
       setLoading(true);
       const data = await supabaseService.getActivities();
       setActivities((data as ActivityRecord[]) || []);
     } catch (error) {
       console.error('Error fetching activities:', error);
     } finally {
       setLoading(false);
     }
   };

  const applyFilters = () => {
    let filtered = [...activities];

    // Date filter
    if (filters.dateFrom) {
      filtered = filtered.filter(activity => 
        new Date(activity.timestamp) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(activity => 
        new Date(activity.timestamp) <= new Date(filters.dateTo)
      );
    }

    // Action filter
    if (filters.action) {
      filtered = filtered.filter(activity => 
        activity.action === filters.action
      );
    }

    // User filter
    if (filters.userId) {
      filtered = filtered.filter(activity => 
        activity.user_id?.includes(filters.userId)
      );
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.description.toLowerCase().includes(searchLower) ||
        activity.action.toLowerCase().includes(searchLower)
      );
    }

    setFilteredActivities(filtered);
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      action: '',
      userId: '',
      search: ''
    });
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'User ID', 'Action', 'Description'],
      ...filteredActivities.map(activity => [
        new Date(activity.timestamp).toLocaleDateString(),
        activity.user_id,
        activity.action,
        activity.description
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activities-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'user_login':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'user_logout':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate stats
  const totalActivities = activities.length;
  const uniqueUsers = new Set(activities.map(a => a.user_id)).size;
  const todayActivities = activities.filter(a => 
    new Date(a.timestamp).toDateString() === new Date().toDateString()
  ).length;
  const loginCount = activities.filter(a => a.action === 'user_login').length;



  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Reports</h1>
          <p className="text-gray-600">
            Monitor and analyze system activities and user interactions
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Activities</p>
                <p className="text-3xl font-bold text-gray-900">{activities.length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Today's Activities</p>
                <p className="text-3xl font-bold text-gray-900">{todayActivities}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Users</p>
                <p className="text-3xl font-bold text-gray-900">{uniqueUsers}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Date From */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Date To */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search activities..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Action Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filters.action}
                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">All Actions</option>
                {actionTypes.map(action => (
                  <option key={action} value={action}>
                    {action.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* User ID */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="User ID..."
                value={filters.userId}
                onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
            
            <div className="text-gray-600 text-sm">
              Showing <span className="font-semibold">{filteredActivities.length}</span> of{' '}
              <span className="font-semibold">{activities.length}</span> activities
            </div>
            <div className="text-gray-600 text-sm">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </motion.div>

        {/* Results Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-6 border border-white/20"
        >
          <div className="flex items-center justify-between">
            <div className="text-white">
              Showing <span className="font-semibold">{filteredActivities.length}</span> of{' '}
              <span className="font-semibold">{activities.length}</span> activities
            </div>
            <div className="text-slate-300 text-sm">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </motion.div>

        {/* Activities Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project ID
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredActivities.map((activity, index) => (
                    <motion.tr
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(activity.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {activity.user_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          activity.action === 'login' ? 'bg-green-100 text-green-800' :
                          activity.action === 'logout' ? 'bg-red-100 text-red-800' :
                          activity.action === 'project_created' ? 'bg-blue-100 text-blue-800' :
                          activity.action === 'project_updated' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {activity.action.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {activity.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {activity.project_id || 'N/A'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {filteredActivities.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Activity className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No activities found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your filters to see more results.
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Reports;
