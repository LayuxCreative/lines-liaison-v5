import React, { useState } from 'react';
import { Shield, Plus, Edit3, Trash2, Users, Check, X } from 'lucide-react';
import { PermissionGroup, PermissionItem } from '../../types';

interface PermissionGroupsProps {
  permissionGroups: PermissionGroup[];
  availablePermissions: PermissionItem[];
  onCreateGroup: (group: Omit<PermissionGroup, 'id'>) => void;
  onUpdateGroup: (groupId: string, updates: Partial<PermissionGroup>) => void;
  onDeleteGroup: (groupId: string) => void;
}

interface NewPermissionGroup {
  name: string;
  description: string;
  permissions: string[];
  color: string;
}

const PermissionGroups: React.FC<PermissionGroupsProps> = ({
  permissionGroups,
  availablePermissions,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PermissionGroup | null>(null);
  const [newGroup, setNewGroup] = useState<NewPermissionGroup>({
    name: '',
    description: '',
    permissions: [],
    color: 'blue'
  });

  const colorOptions = [
    { name: 'blue', class: 'from-blue-500 to-blue-600', bg: 'bg-blue-100', text: 'text-blue-800' },
    { name: 'purple', class: 'from-purple-500 to-purple-600', bg: 'bg-purple-100', text: 'text-purple-800' },
    { name: 'green', class: 'from-green-500 to-green-600', bg: 'bg-green-100', text: 'text-green-800' },
    { name: 'red', class: 'from-red-500 to-red-600', bg: 'bg-red-100', text: 'text-red-800' },
    { name: 'yellow', class: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-100', text: 'text-yellow-800' },
    { name: 'indigo', class: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-100', text: 'text-indigo-800' }
  ];

  const getColorClasses = (color: string) => {
    const colorOption = colorOptions.find(c => c.name === color) || colorOptions[0];
    return colorOption;
  };

  const handleCreateGroup = () => {
    if (newGroup.name.trim()) {
      onCreateGroup({
        name: newGroup.name,
        description: newGroup.description,
        permissions: newGroup.permissions,
        color: newGroup.color
      });
      setNewGroup({ name: '', description: '', permissions: [], color: 'blue' });
      setShowCreateForm(false);
    }
  };

  const handleEditGroup = (group: PermissionGroup) => {
    setEditingGroup(group);
    setNewGroup({
      name: group.name,
      description: group.description || '',
      permissions: group.permissions,
      color: group.color || 'blue'
    });
    setShowCreateForm(true);
  };

  const handleUpdateGroup = () => {
    if (editingGroup && newGroup.name.trim()) {
      onUpdateGroup(editingGroup.id, {
        name: newGroup.name,
        description: newGroup.description,
        permissions: newGroup.permissions,
        color: newGroup.color
      });
      setEditingGroup(null);
      setNewGroup({ name: '', description: '', permissions: [], color: 'blue' });
      setShowCreateForm(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    setNewGroup(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const cancelEdit = () => {
    setEditingGroup(null);
    setNewGroup({ name: '', description: '', permissions: [], color: 'blue' });
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Permission Groups</h2>
          <p className="text-white/70">Create and manage permission templates for user roles</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingGroup ? 'Edit Permission Group' : 'Create New Permission Group'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Group Name</label>
              <input
                type="text"
                value={newGroup.name}
                onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter group name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Color Theme</label>
              <div className="flex space-x-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setNewGroup(prev => ({ ...prev, color: color.name }))}
                    className={`w-8 h-8 rounded-full bg-gradient-to-r ${color.class} border-2 ${
                      newGroup.color === color.name ? 'border-white' : 'border-transparent'
                    } transition-all duration-200`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/80 mb-2">Description</label>
            <textarea
              value={newGroup.description}
              onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
              placeholder="Enter group description"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/80 mb-3">Permissions</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {availablePermissions.map((permission) => (
                <label
                  key={permission.id}
                  className="flex items-center p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={newGroup.permissions.includes(permission.id)}
                    onChange={() => togglePermission(permission.id)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center ${
                    newGroup.permissions.includes(permission.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-white/30'
                  }`}>
                    {newGroup.permissions.includes(permission.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{permission.name}</div>
                    {permission.description && (
                      <div className="text-xs text-white/60">{permission.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={cancelEdit}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
            >
              {editingGroup ? 'Update Group' : 'Create Group'}
            </button>
          </div>
        </div>
      )}

      {/* Permission Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {permissionGroups.map((group) => {
          const colorClasses = getColorClasses(group.color || 'blue');
          return (
            <div
              key={group.id}
              className="group bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            >
              {/* Group Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses.class} rounded-xl flex items-center justify-center shadow-lg`}>
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{group.name}</h3>
                    <p className="text-sm text-white/60">{group.permissions.length} permissions</p>
                  </div>
                </div>
                
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditGroup(group)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => onDeleteGroup(group.id)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
              
              {/* Description */}
              {group.description && (
                <p className="text-white/70 text-sm mb-4">{group.description}</p>
              )}
              
              {/* Permissions Preview */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-white/80 uppercase tracking-wide">Permissions</div>
                <div className="flex flex-wrap gap-1">
                  {group.permissions.slice(0, 6).map((permissionId) => {
                    const permission = availablePermissions.find(p => p.id === permissionId);
                    return (
                      <span
                        key={permissionId}
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${colorClasses.bg} ${colorClasses.text}`}
                      >
                        {permission?.name || permissionId}
                      </span>
                    );
                  })}
                  {group.permissions.length > 6 && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-white/10 text-white/70">
                      +{group.permissions.length - 6} more
                    </span>
                  )}
                </div>
              </div>
              
              {/* Usage Stats */}
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center text-white/60">
                  <Users className="w-4 h-4 mr-2" />
                  <span className="text-sm">0 users</span>
                </div>
                <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {permissionGroups.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white/70 mb-2">No Permission Groups</h3>
          <p className="text-white/50 mb-4">Create your first permission group to get started</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Group
          </button>
        </div>
      )}
    </div>
  );
};

export default PermissionGroups;