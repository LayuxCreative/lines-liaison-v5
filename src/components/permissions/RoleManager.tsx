import React, { useState, useCallback, useEffect } from "react";
import {
  Permission,
  PermissionCategory,
  PermissionLevel,
  User,
  Role,
} from "../../types";
import { supabaseService } from "../../services/supabaseService";
import { useNotifications } from "../../hooks/useNotifications";
import { activityLogger } from "../../utils/activityLogger";



interface RoleManagerProps {
  currentUser: User;
  availablePermissions: Permission[];
  onRoleCreate?: (role: Omit<Role, "id" | "createdAt" | "updatedAt">) => void;
  onRoleUpdate?: (roleId: string, updates: Partial<Role>) => void;
  onRoleDelete?: (roleId: string) => void;
}

export const RoleManager: React.FC<RoleManagerProps> = ({
  currentUser,
  availablePermissions,
  onRoleCreate,
  onRoleUpdate,
  onRoleDelete,
}) => {
  const { addNotification } = useNotifications();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as Permission[],
  });

  // Load roles from Supabase
  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setIsLoadingRoles(true);
      const response = await supabaseService.getRoles();
      
      if (!response.success) {
        throw new Error(response.error);
      }
      
      setRoles(response.data || []);
    } catch (error) {
      console.error('Error loading roles:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load roles',
        userId: currentUser.id,
        priority: 'medium',
      });
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getPermissionsByCategory = useCallback(
    (category: PermissionCategory) => {
      return availablePermissions.filter((p) => p.category === category);
    },
    [availablePermissions],
  );

  const getPermissionIcon = (category: PermissionCategory) => {
    switch (category) {
      case "dashboard":
        return "DASH";
      case "projects":
        return "PROJ";
      case "tasks":
        return "TASK";
      case "files":
        return "FILE";
      case "financial":
        return "MONEY";
      default:
        return "TOOL";
    }
  };

  const getLevelColor = (level: PermissionLevel) => {
    switch (level) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "write":
        return "bg-yellow-100 text-yellow-800";
      case "read":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) return;

    try {
      // Log role creation attempt
      await activityLogger.log("role_create", "info", "Role creation initiated", {
        roleName: newRole.name,
        description: newRole.description,
        permissionsCount: newRole.permissions.length,
        userId: currentUser.id
      });

      const roleData = {
        name: newRole.name,
        display_name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions.map(p => p.id),
        is_active: true,
      };

      const response = await supabaseService.createRole(roleData);
      if (!response.success) {
        throw new Error(response.error);
      }
      const createdRole = response.data;
      setRoles((prev) => [...prev, createdRole]);

      if (onRoleCreate) {
        onRoleCreate({
          name: createdRole.name,
          description: createdRole.description,
          permissions: newRole.permissions,
        });
      }

      // Log successful role creation
      await activityLogger.log("role_create", "success", "Role created successfully", {
        roleId: createdRole.id,
        roleName: createdRole.name,
        description: createdRole.description,
        permissionsCount: newRole.permissions.length,
        userId: currentUser.id
      });

      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Role created successfully',
        userId: currentUser.id,
        priority: 'medium',
      });

      setNewRole({ name: "", description: "", permissions: [] });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create role';
      
      // Log role creation error
      await activityLogger.log("role_create", "error", "Failed to create role", {
        roleName: newRole.name,
        description: newRole.description,
        permissionsCount: newRole.permissions.length,
        userId: currentUser.id,
        error: errorMessage
      });

      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to create role',
        userId: currentUser.id,
        priority: 'medium',
      });
    }
  };

  const handleUpdateRole = async (role: Role) => {
    try {
      // Log role update attempt
      await activityLogger.log("role_update", "info", "Role update initiated", {
        roleId: role.id,
        roleName: role.name,
        description: role.description,
        userId: currentUser.id
      });

      const permissionIds = Array.isArray(role.permissions) && typeof role.permissions[0] === 'string' 
        ? role.permissions as string[]
        : (role.permissions as Permission[]).map((p: Permission) => p.id);

      const updateData = {
        name: role.name,
        description: role.description,
        permissions: permissionIds,
      };

      console.log('Updating role:', role.id, 'with data:', updateData);
      const response = await supabaseService.updateRole(role.id, updateData);
      if (!response.success) {
        throw new Error(response.error);
      }
      const updatedRole = response.data;
      console.log('Role updated successfully:', updatedRole);
      setRoles((prev) =>
        prev.map((r) => r.id === role.id ? updatedRole : r)
      );

      if (onRoleUpdate) {
        onRoleUpdate(role.id, role);
      }

      // Log successful role update
      await activityLogger.log("role_update", "success", "Role updated successfully", {
        roleId: role.id,
        roleName: role.name,
        description: role.description,
        permissionsCount: permissionIds.length,
        userId: currentUser.id
      });

      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Role updated successfully',
        userId: currentUser.id,
        priority: 'medium',
      });

      setSelectedRole(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update role';
      
      // Log role update error
      await activityLogger.log("role_update", "error", "Failed to update role", {
        roleId: role.id,
        roleName: role.name,
        userId: currentUser.id,
        error: errorMessage
      });

      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update role',
        userId: currentUser.id,
        priority: 'medium',
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (confirm("Are you sure you want to delete this role?")) {
      try {
        activityLogger.log("role_delete", "info", "Starting role deletion", {
          roleId,
          userId: currentUser.id
        });

        const response = await supabaseService.deleteRole(roleId);
        if (!response.success) {
          throw new Error(response.error);
        }
        setRoles((prev) => prev.filter((r) => r.id !== roleId));

        if (onRoleDelete) {
          onRoleDelete(roleId);
        }

        activityLogger.log("role_delete", "success", "Role deleted successfully", {
          roleId,
          userId: currentUser.id
        });

        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Role deleted successfully',
          userId: currentUser.id,
          priority: 'medium',
        });
      } catch (error) {
        console.error('Error deleting role:', error);
        
        activityLogger.log("role_delete", "error", "Failed to delete role", {
          roleId,
          userId: currentUser.id,
          error: error instanceof Error ? error.message : "Unknown error"
        });

        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to delete role',
          userId: currentUser.id,
          priority: 'medium',
        });
      }
    }
  };

  const togglePermissionInRole = (
    permission: Permission,
    rolePermissions: Permission[],
  ) => {
    const hasPermission = rolePermissions.some((p) => p.id === permission.id);

    if (hasPermission) {
      return rolePermissions.filter((p) => p.id !== permission.id);
    } else {
      return [...rolePermissions, permission];
    }
  };

  const renderPermissionSelector = (
    permissions: Permission[],
    onChange: (permissions: Permission[]) => void,
  ) => {
    const categories = Array.from(
      new Set(availablePermissions.map((p) => p.category)),
    ) as PermissionCategory[];

    return (
      <div className="space-y-4">
        {categories.map((category) => {
          const categoryPermissions = getPermissionsByCategory(category);
          const selectedCount = categoryPermissions.filter((p) =>
            permissions.some((sp) => sp.id === p.id),
          ).length;

          return (
            <div key={category} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getPermissionIcon(category)}</span>
                  <h4 className="font-medium text-gray-900 capitalize">
                    {category}
                  </h4>
                  <span className="text-sm text-gray-500">
                    ({selectedCount}/{categoryPermissions.length})
                  </span>
                </div>
                <button
                  onClick={() => {
                    const allSelected =
                      selectedCount === categoryPermissions.length;
                    if (allSelected) {
                      // Remove all category permissions
                      const filtered = permissions.filter(
                        (p) => p.category !== category,
                      );
                      onChange(filtered);
                    } else {
                      // Add all category permissions
                      const withoutCategory = permissions.filter(
                        (p) => p.category !== category,
                      );
                      onChange([...withoutCategory, ...categoryPermissions]);
                    }
                  }}
                  className={`text-sm px-3 py-1 rounded ${
                    selectedCount === categoryPermissions.length
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {selectedCount === categoryPermissions.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {categoryPermissions.map((permission) => {
                  const isSelected = permissions.some(
                    (p) => p.id === permission.id,
                  );

                  return (
                    <label
                      key={permission.id}
                      className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          const updated = togglePermissionInRole(
                            permission,
                            permissions,
                          );
                          onChange(updated);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">
                            {permission.name}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getLevelColor(permission.level)}`}
                          >
                            {permission.level}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {permission.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {permission.actions.map((action) => (
                            <span
                              key={action}
                              className="px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              {action}
                            </span>
                          ))}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderRoleCard = (role: Role) => (
    <div
      key={role.id}
      className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium text-gray-900">{role.name}</h3>

          </div>
          <p className="text-gray-600 text-sm mt-1">{role.description}</p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedRole(role);
              setIsEditing(true);
            }}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteRole(role.id)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Permissions:</span>
          <span className="font-medium">{role.permissions.length}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {Array.from(new Set(role.permissions.map((p) => p.category))).map(
            (category) => (
              <span
                key={category}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded capitalize"
              >
                {getPermissionIcon(category as PermissionCategory)} {category}
              </span>
            ),
          )}
        </div>

        <div className="text-xs text-gray-500 mt-2">
          Updated: {new Date(role.updated_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
          <p className="text-gray-600">
            Create and manage user roles and permissions
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Role
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Roles Grid */}
      {isLoadingRoles ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading roles...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map(renderRoleCard)}
        </div>
      )}

      {/* Create Role Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Create New Role
              </h3>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewRole({ name: "", description: "", permissions: [] });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role Name
                  </label>
                  <input
                    type="text"
                    value={newRole.name}
                    onChange={(e) =>
                      setNewRole((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter role name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newRole.description}
                    onChange={(e) =>
                      setNewRole((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter role description"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Permissions ({newRole.permissions.length} selected)
                </label>
                {renderPermissionSelector(newRole.permissions, (permissions) =>
                  setNewRole((prev) => ({ ...prev, permissions })),
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewRole({ name: "", description: "", permissions: [] });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                disabled={!newRole.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {isEditing && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Edit Role: {selectedRole.name}
              </h3>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedRole(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role Name
                  </label>
                  <input
                    type="text"
                    value={selectedRole.name}
                    onChange={(e) =>
                      setSelectedRole((prev) =>
                        prev ? { ...prev, name: e.target.value } : null,
                      )
                    }
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={selectedRole.description}
                    onChange={(e) =>
                      setSelectedRole((prev) =>
                        prev ? { ...prev, description: e.target.value } : null,
                      )
                    }
                    disabled={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Permissions ({selectedRole.permissions.length} selected)
                </label>
                {renderPermissionSelector(
                  Array.isArray(selectedRole.permissions) && typeof selectedRole.permissions[0] === 'string' 
                    ? availablePermissions.filter(p => (selectedRole.permissions as string[]).includes(p.id))
                    : selectedRole.permissions as Permission[] || [],
                  (permissions) =>
                    setSelectedRole((prev) =>
                      prev ? { ...prev, permissions: permissions.map(p => p.id) } : null,
                    ),
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedRole(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateRole(selectedRole)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManager;
