import React, { useState, useEffect } from 'react';
import { X, Shield, Users, Settings, FileText, MessageSquare, BarChart3 } from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { Role, PermissionItem } from '../../types';

interface CreateRoleModalProps {
  onClose: () => void;
  onRoleCreated: (role: Role) => void;
  editingRole?: Role;
}

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({ onClose, onRoleCreated, editingRole }) => {
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [availablePermissions, setAvailablePermissions] = useState<PermissionItem[]>([]);
  
  const [roleData, setRoleData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  // Load permissions from database
  useEffect(() => {
    loadPermissions();
  }, []);

  // Initialize role data when editingRole changes
  useEffect(() => {
    if (editingRole) {
      setRoleData({
        name: editingRole.name || '',
        description: editingRole.description || '',
        permissions: Array.isArray(editingRole.permissions) ? editingRole.permissions : []
      });
    } else {
      setRoleData({
        name: '',
        description: '',
        permissions: []
      });
    }
  }, [editingRole]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const loadPermissions = async () => {
    try {
      setIsLoadingPermissions(true);
      const permissions = await supabaseService.getPermissions();
      setAvailablePermissions(permissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load permissions',
        userId: user?.id || '',
        priority: 'medium'
      });
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  // Group permissions by category
  const getPermissionsByCategory = () => {
    const grouped: { [key: string]: PermissionItem[] } = {};
    availablePermissions.forEach(permission => {
      const category = permission.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(permission);
    });
    return grouped;
  };

  // Update selected permissions when editing an existing role
  useEffect(() => {
    if (editingRole && availablePermissions.length > 0) {
      setRoleData(prev => ({
        ...prev,
        permissions: editingRole.permissions || []
      }));
    }
  }, [editingRole, availablePermissions]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'User Management': return <Users className="w-4 h-4" />;
      case 'Project Management': return <FileText className="w-4 h-4" />;
      case 'Communication': return <MessageSquare className="w-4 h-4" />;
      case 'Reports': return <BarChart3 className="w-4 h-4" />;
      case 'System': return <Settings className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!roleData.name.trim()) {
      newErrors.name = 'Role name is required';
    }
    
    if (!roleData.description.trim()) {
      newErrors.description = 'Role description is required';
    }
    
    if (roleData.permissions.length === 0) {
      newErrors.permissions = 'At least one permission must be selected';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePermissionToggle = (permissionId: string) => {
    setRoleData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      let result;
      
      if (editingRole) {
        // Update existing role
        result = await supabaseService.updateRole(editingRole.id, {
          name: roleData.name,
          display_name: roleData.name,
          description: roleData.description,
          permissions: roleData.permissions,
          is_active: true
        });
        
        addNotification({
          type: 'success',
          title: 'Success',
          message: `Role "${roleData.name}" updated successfully`,
          userId: user?.id || '',
          priority: 'medium'
        });
      } else {
        // Create new role
        result = await supabaseService.createRole({
          name: roleData.name,
          display_name: roleData.name,
          description: roleData.description,
          permissions: roleData.permissions,
          is_active: true
        });
        
        addNotification({
          type: 'success',
          title: 'Success',
          message: `Role "${roleData.name}" created successfully`,
          userId: user?.id || '',
          priority: 'medium'
      });
      }
      
      onRoleCreated(result);
      onClose();
    } catch (error) {
      console.error('Error with role:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: editingRole ? 'Failed to update role. Please try again.' : 'Failed to create role. Please try again.',
        userId: user?.id || '',
        priority: 'high'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/20 flex items-center justify-center p-4"
      style={{
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        width: "100vw",
        height: "100vh",
        top: 0,
        left: 0,
        position: "fixed",
        margin: 0,
        padding: "16px"
      }}
    >
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {editingRole ? 'Edit Role' : 'Create New Role'}
              </h3>
              <p className="text-sm text-gray-600">
                {editingRole ? 'Modify role permissions and access levels' : 'Define role permissions and access levels'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 180px)" }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name *
                </label>
                <input
                  type="text"
                  value={roleData.name}
                  onChange={(e) => setRoleData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter role name (e.g., Project Manager)"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={roleData.description}
                  onChange={(e) => setRoleData(prev => ({ ...prev, description: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Brief description of the role"
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>
            </div>



            {/* Permissions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Permissions * ({roleData.permissions.length} selected)
                </label>
                {errors.permissions && <p className="text-red-500 text-sm">{errors.permissions}</p>}
              </div>
              
              <div className="space-y-6">
                {isLoadingPermissions ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading permissions...</span>
                  </div>
                ) : (
                  Object.entries(getPermissionsByCategory()).map(([category, permissions]) => (
                    <div key={category} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        {getCategoryIcon(category)}
                        <h4 className="font-medium text-gray-900">{category}</h4>
                        <span className="text-sm text-gray-500">
                           ({permissions.filter(p => roleData.permissions.includes(p.name)).length}/{permissions.length})
                         </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {permissions.map((permission) => (
                          <label key={permission.id} className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={roleData.permissions.includes(permission.name)}
                              onChange={() => handlePermissionToggle(permission.name)}
                              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{permission.display_name || permission.name}</div>
                              <div className="text-xs text-gray-500">{permission.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
          <div className="text-sm text-gray-600">
            * Required fields
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{editingRole ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>{editingRole ? 'Update Role' : 'Create Role'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoleModal;