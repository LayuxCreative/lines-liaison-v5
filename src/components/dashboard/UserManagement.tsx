import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Shield,
  User as UserIcon,
  Edit,
  Building2,
  Camera,
  X
} from 'lucide-react';
import { User, PermissionGroup } from '../../types';
import { supabaseService } from '../../services/supabaseService';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from "../../hooks/useNotifications";
import PermissionGroups from './PermissionGroups';
import ImageUploader from '../common/ImageUploader';
import { activityLogger } from '../../utils/activityLogger';

interface UserManagementProps {
  onClose?: () => void;
}

interface NewUser {
  full_name: string;
  email: string;
  role: "admin" | "project_manager" | "team_member" | "client";
  company?: string;
  department?: string;
  position?: string;
  phone?: string;
  additionalPermissions?: string[];
  permission_group_id?: string;
  avatar_url?: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ onClose }) => {
  const { user, refreshUserProfile } = useAuth();
  const { addNotification } = useNotifications();
  
  // State management
  const [activeTab, setActiveTab] = useState<'users' | 'permission_groups'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [sortBy] = useState<'name' | 'email' | 'role' | 'created_at'>('name');
  const [sortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState<string | null>(null);
  
  // Form state
  const [newUser, setNewUser] = useState<NewUser>({
    full_name: '',
    email: '',
    role: 'team_member',
    company: '',
    department: '',
    position: '',
    phone: '',
    additionalPermissions: [],
    permission_group_id: '',
    avatar_url: ''
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersResponse, groupsResponse] = await Promise.all([
        supabaseService.getUsers(),
        supabaseService.getPermissionGroups()
      ]);
      
      if ((usersResponse && !usersResponse.success) || (groupsResponse && !groupsResponse.success)) {
        addNotification({
          type: 'system',
          category: 'system',
          title: 'Data Load Warning',
          message: 'Some data failed to load correctly',
          priority: 'high',
          status: 'unread',
          actionRequired: false,
          userId: user?.id || '',
          metadata: { customData: { usersSuccess: usersResponse?.success, groupsSuccess: groupsResponse?.success } },
        });
      }

      const usersDataRaw = usersResponse?.data as unknown;
      const groupsDataRaw = groupsResponse?.data as unknown;

      setUsers(Array.isArray(usersDataRaw) ? (usersDataRaw as User[]) : []);
      setPermissionGroups(Array.isArray(groupsDataRaw) ? (groupsDataRaw as PermissionGroup[]) : []);
    } catch (error) {
      console.error('Error loading data:', error);
      addNotification({
        type: 'system',
        category: 'system',
        title: 'Data Loading Error',
        message: 'Failed to load users and permission groups data',
        priority: 'high',
        status: 'unread',
        actionRequired: false,
        userId: user?.id || '',
        metadata: { customData: { scope: 'user_management' } },
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification, user?.id]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter and sort users
  const getFilteredAndSortedUsers = () => {
    if (!users || !Array.isArray(users)) return [];
    
    const filtered = users.filter(user => {
      const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      return matchesSearch && matchesRole;
    });

    return filtered.sort((a, b) => {
      let aValue: string | Date = '';
      let bValue: string | Date = '';
      
      switch (sortBy) {
        case 'name':
          aValue = a.full_name || '';
          bValue = b.full_name || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'role':
          aValue = a.role || '';
          bValue = b.role || '';
          break;
        case 'created_at':
          aValue = a.created_at || new Date();
          bValue = b.created_at || new Date();
          break;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // User CRUD operations
  const handleCreateUser = async () => {
    try {
      const userData = {
        ...newUser,
        status: 'available' as const
      };
      
      const response = await supabaseService.createUser(userData as Record<string, unknown>);
      if (!response.success) {
        const errorMessage = typeof response.error === 'string' ? response.error : 'Failed to create new user';
        await activityLogger.log("user_create", "error", "Failed to create user", {
          userRole: newUser.role,
          error: errorMessage
        });
        addNotification({
          type: 'system',
          category: 'system',
          title: 'User Creation Error',
          message: errorMessage,
          priority: 'high',
          status: 'unread',
          actionRequired: false,
          userId: user?.id || '',
          metadata: { customData: { error: errorMessage } },
        });
        return;
      }
      const data = response.data as unknown;
      const createdUser = (Array.isArray(data) ? data[0] : data) as User | undefined;
      if (createdUser) {
        setUsers([...users, createdUser]);
        setShowCreateUser(false);
        resetForm();
        
        await activityLogger.log("user_create", "success", "User created successfully", {
          createdUserId: createdUser.id,
          userRole: createdUser.role
        });
        
        addNotification({
          type: 'system',
          category: 'administrative',
          title: 'User Created',
          message: `User ${newUser.full_name} created successfully`,
          priority: 'medium',
          status: 'unread',
          actionRequired: false,
          userId: user?.id || '',
          metadata: { relatedEntityType: 'user', relatedEntityId: createdUser.id },
        });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      
      await activityLogger.log("user_create", "error", "Failed to create user", {
        userRole: newUser.role,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      
      addNotification({
        type: 'system',
        category: 'system',
        title: 'User Creation Error',
        message: 'Failed to create new user',
        priority: 'high',
        status: 'unread',
        actionRequired: false,
        userId: user?.id || '',
        metadata: { customData: { error: (error instanceof Error ? error.message : 'Unknown error') } },
      });
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    console.log('handleUpdateUser called with:', { userId, updates });
    try {
      // Get original user data for comparison
      const originalUser = users.find(u => u.id === userId);
      
      await activityLogger.log("user_update", "info", "Updating user", {
        userId,
        updatedFields: Object.keys(updates)
      });
      
      console.log('Calling supabaseService.updateUser...');
      const response = await supabaseService.updateUser(userId, updates as Record<string, unknown>);
      if (!response.success) {
        const errorMessage = typeof response.error === 'string' ? response.error : 'Failed to update user data';
        await activityLogger.log("user_update", "error", "Failed to update user", {
          userId,
          error: errorMessage
        });
        addNotification({
          type: 'system',
          category: 'system',
          title: 'Update Error',
          message: errorMessage,
          priority: 'high',
          status: 'unread',
          actionRequired: false,
          userId: user?.id || '',
          metadata: { relatedEntityType: 'user', relatedEntityId: userId, customData: { error: errorMessage } },
        });
        return;
      }
      const respData = response.data as unknown;
      const updatedUser = (Array.isArray(respData) ? respData[0] : respData) as User | undefined;
      if (updatedUser) {
        console.log('Update successful, result:', updatedUser);
        setUsers(users.map(u => u.id === userId ? updatedUser : u));
        setEditingUser(null);
        setShowCreateUser(false);
        resetForm();
        
        // Refresh current user profile if updating own profile
        if (userId === user?.id) {
          await refreshUserProfile();
        }
        
        // Determine what was actually updated by comparing with original values
        const updatedFields = [];
        if (originalUser) {
          if (updates.full_name && updates.full_name !== originalUser.full_name) {
            updatedFields.push('name');
          }
          if (updates.email && updates.email !== originalUser.email) {
            updatedFields.push('email');
          }
          if (updates.avatar_url && updates.avatar_url !== originalUser.avatar_url) {
            updatedFields.push('profile picture');
          }
          if (updates.role && updates.role !== originalUser.role) {
            updatedFields.push('role');
          }
          if (updates.company && updates.company !== originalUser.company) {
            updatedFields.push('company');
          }
          if (updates.department && updates.department !== originalUser.department) {
            updatedFields.push('department');
          }
          if (updates.position && updates.position !== originalUser.position) {
            updatedFields.push('position');
          }
          if (updates.phone && updates.phone !== originalUser.phone) {
            updatedFields.push('phone');
          }
        }
        
        await activityLogger.log("user_update", "success", "User updated successfully", {
          userId,
          updatedFields: updatedFields,
          userName: updatedUser.full_name || updatedUser.email
        });
        
        const updatedFieldsText = updatedFields.length > 0 
          ? updatedFields.join(', ')
          : 'profile data';
        
        addNotification({
          type: 'system',
          category: 'administrative',
          title: 'User Updated',
          message: `Updated ${updatedFieldsText} for ${updatedUser.full_name || updatedUser.email}`,
          priority: 'medium',
          status: 'unread',
          actionRequired: false,
          userId: user?.id || '',
          metadata: { relatedEntityType: 'user', relatedEntityId: userId },
        });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user data';
      
      await activityLogger.log("user_update", "error", "Failed to update user", {
        userId,
        error: errorMessage
      });
      
      addNotification({
        type: 'system',
        category: 'system',
        title: 'Update Error',
        message: errorMessage,
        priority: 'high',
        status: 'unread',
        actionRequired: false,
        userId: user?.id || '',
        metadata: { relatedEntityType: 'user', relatedEntityId: userId, customData: { error: errorMessage } },
      });
    }
  };

  const handleUpdateAvatar = async (userId: string, avatarUrl: string) => {
    try {
      // Update user avatar directly through API
      await handleUpdateUser(userId, { avatar_url: avatarUrl });
      
      addNotification({
        type: 'system',
        category: 'work',
        title: 'Avatar Updated',
        message: 'Profile picture updated successfully',
        priority: 'medium',
        status: 'unread',
        actionRequired: false,
        userId: user?.id || '',
        metadata: { relatedEntityType: 'user', relatedEntityId: userId },
      });
    } catch (error) {
      console.error('Error updating avatar:', error);
      addNotification({
        type: 'system',
        category: 'system',
        title: 'Avatar Update Error',
        message: 'Failed to update profile picture',
        priority: 'high',
        status: 'unread',
        actionRequired: false,
        userId: user?.id || '',
        metadata: { relatedEntityType: 'user', relatedEntityId: userId, customData: { error: (error instanceof Error ? error.message : 'Unknown error') } },
      });
    }
  };



  const toggleUserStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const currentStatus = user.status === 'available';
    const newStatus = !currentStatus;
    await handleUpdateUser(userId, { status: newStatus ? 'available' : 'away' });
  };

  // Form helpers
  const resetForm = () => {
    setNewUser({
      full_name: '',
      email: '',
      role: 'team_member',
      company: '',
      department: '',
      position: '',
      phone: '',
      additionalPermissions: [],
      permission_group_id: '',
      avatar_url: ''
    });
    setEditingUser(null);
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setNewUser({
      full_name: user.full_name || '',
      email: user.email || '',
      role: user.role || 'team_member',
      company: user.company || '',
      department: user.department || '',
      position: user.position || '',
      phone: user.phone || '',
      additionalPermissions: user.additionalPermissions || [],
      permission_group_id: '',
      avatar_url: user.avatar_url || ''
    });
    setShowCreateUser(true);
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-xl p-6 mb-8 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600">Manage users and permission groups</p>
              </div>
            </div>
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="flex space-x-1 mb-8 p-1 bg-white rounded-xl shadow-lg backdrop-blur-sm border border-gray-200"
        >
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition-all ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Users className="h-5 w-5" />
            <span>Users</span>
          </button>
          
          <button
            onClick={() => setActiveTab('permission_groups')}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg transition-all ${
              activeTab === 'permission_groups'
                ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Shield className="h-5 w-5" />
            <span>Permission Groups</span>
          </button>
        </motion.div>

        {/* Tab Content */}
        {activeTab === 'users' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="space-y-6"
          >
            {/* Header with Add Button and Search */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Users</h2>
                  <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
                </div>
                <button
                  onClick={() => setShowCreateUser(true)}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add User</span>
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoComplete="off"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="project_manager">Project Manager</option>
                    <option value="team_member">Team Member</option>
                    <option value="client">Client</option>
                  </select>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {getFilteredAndSortedUsers().map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group border border-gray-100"
                >
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="relative group">
                      {user.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={user.full_name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                          <UserIcon className="h-6 w-6" />
                        </div>
                      )}
                      <button
                        onClick={() => setShowImageUploader(user.id)}
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                      >
                        <Camera className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 break-words leading-tight">{user.full_name}</h3>
                      <span className={`text-xs font-medium ${
                        user.role === 'admin' ? 'text-red-600' :
                        user.role === 'project_manager' ? 'text-blue-600' :
                        user.role === 'team_member' ? 'text-green-600' :
                        'text-gray-600'
                      }`}>
                        {user.role === 'admin' ? 'Admin' :
                         user.role === 'project_manager' ? 'Project Manager' :
                         user.role === 'team_member' ? 'Team Member' : 'Client'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.status === 'available' ? 'bg-green-100 text-green-600' :
                        user.status === 'busy' ? 'bg-red-100 text-red-600' :
                        user.status === 'away' ? 'bg-yellow-100 text-yellow-600' :
                        user.status === 'in_meeting' ? 'bg-red-100 text-red-600' :
                        user.status === 'on_break' ? 'bg-orange-100 text-orange-600' :
                        user.status === 'out_of_office' ? 'bg-gray-100 text-gray-600' :
                        user.status === 'vacation' ? 'bg-blue-100 text-blue-600' :
                        user.status === 'sick_leave' ? 'bg-purple-100 text-purple-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {user.status === 'available' ? 'متاح' :
                         user.status === 'busy' ? 'مشغول' :
                         user.status === 'away' ? 'غائب' :
                         user.status === 'in_meeting' ? 'في اجتماع' :
                         user.status === 'on_break' ? 'في استراحة' :
                         user.status === 'out_of_office' ? 'خارج المكتب' :
                         user.status === 'vacation' ? 'في إجازة' :
                         user.status === 'sick_leave' ? 'إجازة مرضية' :
                         user.status || 'غير محدد'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Join Date:</span>
                      <span className="text-gray-900 text-sm">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US') : 'Not specified'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm break-all">{user.email}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 px-4 rounded-lg transition-all duration-200 text-sm font-medium"
                      >
                        Change Status
                      </button>
                      <button
                        onClick={() => startEdit(user)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {getFilteredAndSortedUsers().length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No users found</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'permission_groups' && (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Permission Groups Header */}
             <div className="bg-white rounded-xl p-6 shadow-lg">
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                 <div>
                   <h2 className="text-2xl font-bold text-gray-900">Permission Groups</h2>
                   <p className="text-gray-600 mt-1">Manage permission templates and access rights</p>
                 </div>
               </div>
             </div>
            
            <PermissionGroups
                    permissionGroups={permissionGroups}
                    availablePermissions={[]}
                    onCreateGroup={(group) => {
                      // Handle create group
                      console.log('Create group:', group);
                    }}
                    onUpdateGroup={(groupId, updates) => {
                      // Handle update group
                      console.log('Update group:', groupId, updates);
                    }}
                    onDeleteGroup={(groupId: string) => {
                      setPermissionGroups(prev => prev.filter(g => g.id !== groupId));
                    }}
                  />
          </motion.div>
        )}

        {/* Image Uploader Modal */}
        {showImageUploader && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              className="bg-white backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="bg-gradient-to-r from-blue-600 to-teal-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Camera className="h-6 w-6" />
                    Update Profile Picture
                  </h3>
                  <button
                    onClick={() => setShowImageUploader(null)}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <ImageUploader
                   currentImageUrl={users.find(u => u.id === showImageUploader)?.avatar_url || ""}
                   onImageUpload={(result) => {
                     if (showImageUploader && result.url) {
                       handleUpdateAvatar(showImageUploader, result.url);
                       setShowImageUploader(null);
                     }
                   }}
                  userId={showImageUploader}
                  size="lg"
                  shape="circle"
                  className="mx-auto"
                />
              </div>
            </motion.div>
          </div>
        )}

        {/* Create/Edit User Modal */}
        {showCreateUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              className="bg-white backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-blue-600 to-teal-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <UserIcon className="h-6 w-6" />
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowCreateUser(false);
                      resetForm();
                    }}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content with scroll */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
                <div className="space-y-6">
                  {/* Profile Image */}
                  <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-4">
                      <ImageUploader
                        currentImageUrl={newUser.avatar_url || ""}
                        onImageUpload={(result) => setNewUser(prev => ({ ...prev, avatar_url: result.url }))}
                        userId={editingUser?.id || 'new-user'}
                        size="lg"
                        shape="circle"
                        className=""
                      />
                    </div>
                    <div className="">
                      <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                        Profile Photo
                      </span>
                    </div>
                  </div>

                  {/* Basic Info Section */}
                  <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-200/50">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={newUser.full_name}
                          onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                          autoComplete="name"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter full name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                          autoComplete="email"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter email address"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Role & Permissions Section */}
                  <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-200/50">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-purple-600" />
                      Role & Permissions
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role *
                        </label>
                        <select
                          value={newUser.role}
                          onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as "admin" | "project_manager" | "team_member" | "client" }))}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="team_member">Team Member</option>
                          <option value="project_manager">Project Manager</option>
                          <option value="admin">Admin</option>
                          <option value="client">Client</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Permission Group
                        </label>
                        <select
                          value={newUser.permission_group_id}
                          onChange={(e) => setNewUser(prev => ({ ...prev, permission_group_id: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Select permission group</option>
                          {permissionGroups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.display_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Work Information Section */}
                  <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-200/50">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-emerald-600" />
                      Work Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company
                        </label>
                        <input
                          type="text"
                          value={newUser.company}
                          onChange={(e) => setNewUser(prev => ({ ...prev, company: e.target.value }))}
                          autoComplete="organization"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter company name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Department
                        </label>
                        <input
                          type="text"
                          value={newUser.department}
                          onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter department"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Position
                        </label>
                        <input
                          type="text"
                          value={newUser.position}
                          onChange={(e) => setNewUser(prev => ({ ...prev, position: e.target.value }))}
                          autoComplete="organization-title"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter position"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={newUser.phone}
                          onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                          autoComplete="tel"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="bg-gray-50/80 px-6 py-3 border-t border-gray-200/50 flex-shrink-0">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-sm text-gray-600 order-2 sm:order-1">
                    * Required fields
                  </p>
                  <div className="flex items-center space-x-3 order-1 sm:order-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        setShowCreateUser(false);
                        setEditingUser(null);
                        resetForm();
                      }}
                      className="flex-1 sm:flex-none px-4 py-2.5 text-gray-700 hover:text-gray-900 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-center"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={editingUser ? () => {
                        const updates: Partial<User> = {
                          full_name: newUser.full_name,
                          email: newUser.email,
                          role: newUser.role,
                        };
                        if (newUser.company !== undefined) updates.company = newUser.company;
                        if (newUser.department !== undefined) updates.department = newUser.department;
                        if (newUser.position !== undefined) updates.position = newUser.position;
                        if (newUser.phone !== undefined) updates.phone = newUser.phone;
                        if (newUser.additionalPermissions !== undefined) updates.additionalPermissions = newUser.additionalPermissions;
                        if (typeof newUser.avatar_url === 'string' && newUser.avatar_url.trim() !== '') {
                          updates.avatar_url = newUser.avatar_url;
                        }
                        console.log('Update button clicked with data:', {
                          userId: editingUser.id,
                          updates
                        });
                        handleUpdateUser(editingUser.id, updates);
                      } : handleCreateUser}
                      className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2"
                    >
                      {editingUser ? (
                        <>
                          <Edit className="h-4 w-4" />
                          <span className="hidden sm:inline">Update User</span>
                          <span className="sm:hidden">Update</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span className="hidden sm:inline">Create User</span>
                          <span className="sm:hidden">Create</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;