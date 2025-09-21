import React, { useState } from "react";
import {
  Shield,
  UserPlus,
  Edit3,
  Trash2,
} from "lucide-react";
import { useNotifications } from "../../contexts/NotificationContext";
import { supabaseService } from "../../services/supabaseService";
import { PermissionGroup } from "../../types";

interface Permission {
  id: string;
  name: string;
  description: string;
  hasReadWrite?: boolean;
  readId?: string;
  writeId?: string;
}

interface PermissionsManagementProps {
  permissionGroups: PermissionGroup[];
  setPermissionGroups: (groups: PermissionGroup[]) => void;
  permissions: Permission[];
  isLoadingPermissions: boolean;
}

const PermissionsManagement: React.FC<PermissionsManagementProps> = ({
  permissionGroups,
  setPermissionGroups,
  permissions,
  isLoadingPermissions,
}) => {
  const { addNotification } = useNotifications();
  
  // Enhanced Permission Group Management
  const [editingPermissionGroup, setEditingPermissionGroup] = useState<{
    id: string;
    name: string;
    display_name?: string;
    description: string;
    permissions: string[];
    is_active: boolean;
  } | null>(null);
  
  const [showCreatePermissionGroup, setShowCreatePermissionGroup] = useState(false);
  const [newPermissionGroup, setNewPermissionGroup] = useState({
    name: "",
    display_name: "",
    description: "",
    permissions: [] as string[],
    is_active: true,
  });

  // Permission Groups Management Functions
  const handleCreatePermissionGroup = async () => {
    if (!newPermissionGroup.name.trim()) {
      addNotification({
        type: "error",
        title: "Validation Error",
        message: "Permission group name is required.",
        userId: "",
        priority: "medium" as const,
      });
      return;
    }

    try {
      const groupName = newPermissionGroup.name
        .toLowerCase()
        .replace(/\s+/g, "_");

      // Auto-assign all permissions to Administrator group
      let finalPermissions = newPermissionGroup.permissions;
      if (
        newPermissionGroup.name.toLowerCase() === "administrator" ||
        newPermissionGroup.name.toLowerCase() === "admin"
      ) {
        finalPermissions = permissions.reduce((acc: string[], permission) => {
          if (permission.hasReadWrite && permission.readId && permission.writeId) {
            acc.push(permission.readId, permission.writeId);
          } else {
            acc.push(permission.id);
          }
          return acc;
        }, []);
      }

      const group = {
        name: groupName,
        display_name: newPermissionGroup.name,
        description: newPermissionGroup.description,
        permissions: finalPermissions,
        is_active: newPermissionGroup.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date(),
      };

      const createdGroup = await supabaseService.createPermissionGroup(group);

      const updatedGroups = [...permissionGroups, createdGroup];
      setPermissionGroups(updatedGroups);

      setShowCreatePermissionGroup(false);
      setNewPermissionGroup({
        name: "",
        display_name: "",
        description: "",
        permissions: [],
        is_active: true,
      });

      addNotification({
        type: "success",
        title: "Permission Group Created",
        message: `Permission group "${createdGroup.display_name}" has been created successfully.`,
        userId: "",
        priority: "medium" as const,
      });
    } catch (error) {
      console.error('Error creating permission group:', error);
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to create permission group. Please try again.",
        userId: "",
        priority: "medium" as const,
      });
    }
  };

  const handleEditPermissionGroup = (group: {id: string; name: string; display_name?: string; description: string; permissions: string[]; is_active: boolean}) => {
    setEditingPermissionGroup({
      id: group.id,
      name: group.name,
      display_name: group.display_name,
      description: group.description,
      permissions: group.permissions,
      is_active: group.is_active,
    });
    setNewPermissionGroup({
      name: group.display_name || group.name,
      display_name: group.display_name || group.name,
      description: group.description,
      permissions: group.permissions,
      is_active: group.is_active,
    });
    setShowCreatePermissionGroup(true);
  };

  const handleUpdatePermissionGroup = async () => {
    if (!newPermissionGroup.name.trim()) {
      addNotification({
        type: "error",
        title: "Validation Error",
        message: "Permission group name is required.",
        userId: "",
        priority: "medium" as const,
      });
      return;
    }

    if (!editingPermissionGroup) {
      return;
    }

    try {
      // Auto-assign all permissions to Administrator group
      let finalPermissions = newPermissionGroup.permissions;
      if (
        newPermissionGroup.name.toLowerCase() === "administrator" ||
        editingPermissionGroup?.id === "admin" ||
        editingPermissionGroup?.name === "admin"
      ) {
        finalPermissions = permissions.reduce((acc: string[], permission) => {
          if (permission.hasReadWrite && permission.readId && permission.writeId) {
            acc.push(permission.readId, permission.writeId);
          } else {
            acc.push(permission.id);
          }
          return acc;
        }, []);
      }

      const updatedGroup = {
        ...editingPermissionGroup,
        name: newPermissionGroup.name.toLowerCase().replace(/\s+/g, "_"),
        display_name: newPermissionGroup.name,
        description: newPermissionGroup.description,
        permissions: finalPermissions,
        is_active: newPermissionGroup.is_active,
        updated_at: new Date(),
      };

      const savedGroup = await supabaseService.updatePermissionGroup(editingPermissionGroup.id, updatedGroup);

      const updatedGroups = permissionGroups.map((group) =>
        group.id === editingPermissionGroup.id ? savedGroup : group
      );
      setPermissionGroups(updatedGroups);

      setShowCreatePermissionGroup(false);
      setEditingPermissionGroup(null);
      setNewPermissionGroup({
        name: "",
        display_name: "",
        description: "",
        permissions: [],
        is_active: true,
      });

      addNotification({
        type: "success",
        title: "Permission Group Updated",
        message: `Permission group "${savedGroup.display_name}" has been updated successfully.`,
        userId: "",
        priority: "medium" as const,
      });
    } catch (error) {
      console.error('Error updating permission group:', error);
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to update permission group. Please try again.",
        userId: "",
        priority: "medium" as const,
      });
    }
  };

  const handleDeletePermissionGroup = async (groupId: string) => {
    const group = permissionGroups.find((g) => g.id === groupId);
    if (!group) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the permission group "${group.name}"?`,
    );
    if (!confirmed) return;

    try {
      await supabaseService.deletePermissionGroup(groupId);
      const updatedGroups = permissionGroups.filter((g) => g.id !== groupId);
      setPermissionGroups(updatedGroups);

      addNotification({
        type: "success",
        title: "Permission Group Deleted",
        message: `Permission group "${group.name}" has been deleted.`,
        userId: "",
        priority: "medium" as const,
      });
    } catch (error) {
      console.error("Error deleting permission group:", error);
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to delete permission group. Please try again.",
        userId: "",
        priority: "medium" as const,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <span>Role Management</span>
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            Manage all roles and permission groups in your organization
          </p>
        </div>
        <button
          onClick={() => setShowCreatePermissionGroup(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center space-x-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New Role</span>
        </button>
      </div>

      {/* All Roles Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {permissionGroups.map((group) => (
          <div
            key={group.id}
            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h6 className="font-medium text-gray-900">
                  {group.display_name || group.name}
                </h6>
                <p className="text-xs text-gray-500 mt-1">
                  {group.description}
                </p>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleEditPermissionGroup(group)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit role"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                {group.id !== "admin" && (
                  <button
                    onClick={() => handleDeletePermissionGroup(group.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-600">
              <div className="flex justify-between items-center">
                <span>Permissions: {group.permissions.length}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    group.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {group.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {permissionGroups.length === 0 && (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No roles available</p>
          <p className="text-sm text-gray-400">
            Create your first role to get started
          </p>
        </div>
      )}

      {/* Create/Edit Permission Group Modal */}
      {(showCreatePermissionGroup || editingPermissionGroup) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              {editingPermissionGroup ? "Edit Role" : "Create New Role"}
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={newPermissionGroup.name}
                  onChange={(e) =>
                    setNewPermissionGroup({
                      ...newPermissionGroup,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Content Management"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newPermissionGroup.description}
                  onChange={(e) =>
                    setNewPermissionGroup({
                      ...newPermissionGroup,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe what this permission group is for..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Permissions
                </label>
                <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-1 gap-3">
                    {isLoadingPermissions ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Loading permissions...</span>
                      </div>
                    ) : (
                      permissions.map((permission) => {
                      const hasRead = !!(
                        permission.hasReadWrite &&
                        permission.readId &&
                        newPermissionGroup.permissions.includes(
                          permission.readId,
                        )
                      );
                      const hasWrite = !!(
                        permission.hasReadWrite &&
                        permission.writeId &&
                        newPermissionGroup.permissions.includes(
                          permission.writeId,
                        )
                      );
                      const hasFullControl = hasRead && hasWrite;

                      return (
                        <div
                          key={permission.id}
                          className="p-3 border rounded bg-white"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {permission.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {permission.description}
                              </div>
                            </div>

                            {/* Permission Controls */}
                            <div className="flex items-center space-x-3">
                              {permission.hasReadWrite &&
                              permission.readId &&
                              permission.writeId ? (
                                <>
                                  {hasFullControl && (
                                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                                      Full Control
                                    </span>
                                  )}
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={hasRead}
                                      onChange={(e) => {
                                        const updatedPermissions = e.target
                                          .checked
                                          ? [
                                              ...newPermissionGroup.permissions,
                                              permission.readId!,
                                            ]
                                          : newPermissionGroup.permissions.filter(
                                              (p) => p !== permission.readId,
                                            );
                                        setNewPermissionGroup({
                                          ...newPermissionGroup,
                                          permissions: updatedPermissions,
                                        });
                                      }}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span className="text-sm text-blue-600 font-medium">
                                      Read
                                    </span>
                                  </label>
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={hasWrite}
                                      onChange={(e) => {
                                        const updatedPermissions = e.target
                                          .checked
                                          ? [
                                              ...newPermissionGroup.permissions,
                                              permission.writeId!,
                                            ]
                                          : newPermissionGroup.permissions.filter(
                                              (p) => p !== permission.writeId,
                                            );
                                        setNewPermissionGroup({
                                          ...newPermissionGroup,
                                          permissions: updatedPermissions,
                                        });
                                      }}
                                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <span className="text-sm text-green-600 font-medium">
                                      Write
                                    </span>
                                  </label>
                                </>
                              ) : (
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={newPermissionGroup.permissions.includes(
                                      permission.id,
                                    )}
                                    onChange={(e) => {
                                      const updatedPermissions = e.target
                                        .checked
                                        ? [
                                            ...newPermissionGroup.permissions,
                                            permission.id,
                                          ]
                                        : newPermissionGroup.permissions.filter(
                                            (p) => p !== permission.id,
                                          );
                                      setNewPermissionGroup({
                                        ...newPermissionGroup,
                                        permissions: updatedPermissions,
                                      });
                                    }}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  />
                                  <span className="text-sm text-gray-700 font-medium">
                                    Enable
                                  </span>
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newPermissionGroup.is_active}
                  onChange={(e) =>
                    setNewPermissionGroup({
                      ...newPermissionGroup,
                      is_active: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="is_active"
                  className="text-sm font-medium text-gray-700"
                >
                  Active (available for assignment)
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreatePermissionGroup(false);
                  setEditingPermissionGroup(null);
                  setNewPermissionGroup({
                    name: "",
                    display_name: "",
                    description: "",
                    permissions: [],
                    is_active: true,
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={
                  editingPermissionGroup
                    ? handleUpdatePermissionGroup
                    : handleCreatePermissionGroup
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {editingPermissionGroup ? "Update Group" : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsManagement;