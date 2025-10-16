import React from 'react';
import { UserMinus } from 'lucide-react';
import { User as UserType } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from "../../hooks/useNotifications";
import { supabaseService } from '../../services/supabaseService';

interface EditUserButtonsProps {
  editingUser: UserType;
  setEditingUser: (user: UserType | null) => void;
  setUsers: React.Dispatch<React.SetStateAction<UserType[]>>;
  showConfirmation: (config: {
    type: string;
    userId: string;
    userName: string;
    newRole?: string;
    newStatus?: boolean;
    callback: () => void;
  }) => void;
}

const EditUserButtons: React.FC<EditUserButtonsProps> = ({
  editingUser,
  setEditingUser,
  setUsers,
  showConfirmation
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const handleSaveUser = async () => {
    try {
      const updateData: Record<string, unknown> = {
        name: editingUser.name || '',
        full_name: editingUser.name || '',
        email: editingUser.email || '',
        role: editingUser.role,
        department: editingUser.department || '',
        position: editingUser.position || '',
        phone: editingUser.phone || '',
        additionalPermissions: editingUser.additionalPermissions || []
      };

      await supabaseService.updateUser(editingUser.id, updateData);
      
      const response = await supabaseService.getUsers();
      setUsers(prev => Array.isArray(response?.data) ? (response.data as UserType[]) : prev);

      addNotification({
        type: 'success',
        title: 'User Updated',
        message: `User ${editingUser.name} has been updated successfully`,
        userId: user?.id || '',
        priority: 'medium'
      });

      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update user. Please try again.',
        userId: user?.id || '',
        priority: 'high'
      });
    }
  };

  const handleDeleteUser = async () => {
    try {
      await supabaseService.deleteUser(editingUser.id);
      
      const response = await supabaseService.getUsers();
      setUsers(prev => Array.isArray(response?.data) ? (response.data as UserType[]) : prev.filter(u => u.id !== editingUser.id));

      addNotification({
        type: 'warning',
        title: 'User Deleted',
        message: `User ${editingUser.name} has been deleted successfully`,
        userId: user?.id || '',
        priority: 'high'
      });

      setEditingUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete user. Please try again.',
        userId: user?.id || '',
        priority: 'high'
      });
    }
  };

  return (
    <div className="flex justify-between items-center pt-4">
      <button
        onClick={() => {
          showConfirmation({
            type: 'delete',
            userId: editingUser.id,
            userName: editingUser.name || 'Unknown User',
            callback: handleDeleteUser
          });
        }}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
      >
        <UserMinus className="w-4 h-4" />
        Delete User
      </button>
      <div className="flex space-x-3">
        <button
          onClick={() => setEditingUser(null)}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveUser}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default EditUserButtons;