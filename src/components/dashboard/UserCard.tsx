import React, { useState } from 'react';
import { Phone, Shield, Edit3, Trash2, MoreVertical, Mail, Calendar, Camera, X } from 'lucide-react';
import { User } from '../../types';
import ImageUploader from '../common/ImageUploader';

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onToggleStatus: (userId: string) => void;
  onUpdateAvatar?: (userId: string, avatarUrl: string) => void;
  permissionCount: number;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  onToggleStatus,
  onUpdateAvatar,
  permissionCount
}) => {
  const [showImageUploader, setShowImageUploader] = useState(false);
  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      admin: "Admin",
      project_manager: "Project Manager",
      team_member: "Team Member",
      client: "Client",
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colorMap: { [key: string]: string } = {
      admin: "bg-gradient-to-r from-red-500 to-red-600 text-white",
      project_manager: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
      team_member: "bg-gradient-to-r from-green-500 to-green-600 text-white",
      client: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
    };
    return colorMap[role] || "bg-gradient-to-r from-gray-500 to-gray-600 text-white";
  };

  const getStatusColor = (status: string) => {
    const statusMap: { [key: string]: string } = {
      available: "bg-green-100 text-green-800 border-green-200",
      busy: "bg-yellow-100 text-yellow-800 border-yellow-200",
      away: "bg-red-100 text-red-800 border-red-200",
      inactive: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return statusMap[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="group relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
      {/* Header with Avatar and Actions */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4">
          <div className="relative flex-shrink-0 group/avatar">
            {user.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.name || user.full_name || 'User'}
                className="w-16 h-16 rounded-full object-cover shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {(user.name || user.full_name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            
            {/* Avatar Upload Overlay */}
            {onUpdateAvatar && (
              <button
                onClick={() => setShowImageUploader(true)}
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            )}
            
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
              user.status === 'available' ? 'bg-green-500' : 
              user.status === 'busy' ? 'bg-yellow-500' : 
              user.status === 'away' ? 'bg-red-500' : 'bg-gray-500'
            }`}></div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white mb-1 truncate">
              {user.name || user.full_name || 'Unknown User'}
            </h3>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
              <Shield className="w-3 h-3 mr-1" />
              {getRoleDisplayName(user.role)}
            </span>
          </div>
        </div>
        
        {/* Actions Menu */}
        <div className="relative group/menu">
          <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100">
            <MoreVertical className="w-4 h-4 text-white" />
          </button>
          <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-white/20 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-10">
            <button
              onClick={() => onEdit(user)}
              className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
            >
              <Edit3 className="w-4 h-4 mr-3 text-blue-500" />
              Edit User
            </button>
            <button
              onClick={() => onToggleStatus(user.id.toString())}
              className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-yellow-50 transition-colors"
            >
              <Shield className="w-4 h-4 mr-3 text-yellow-500" />
              {user.status === 'available' ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={() => onDelete(user.id.toString())}
              className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
            >
              <Trash2 className="w-4 h-4 mr-3" />
              Delete User
            </button>
          </div>
        </div>
      </div>

      {/* User Details */}
      <div className="space-y-3">
        <div className="flex items-center text-white/80">
          <Mail className="w-4 h-4 mr-3 text-blue-400" />
          <span className="text-sm">{user.email || 'No email address'}</span>
        </div>
        
        {user.phone && (
          <div className="flex items-center text-white/80">
            <Phone className="w-4 h-4 mr-3 text-green-400" />
            <span className="text-sm">{user.phone}</span>
          </div>
        )}
        
        <div className="flex items-center text-white/80">
          <Calendar className="w-4 h-4 mr-3 text-purple-400" />
          <span className="text-sm">Joined: {formatDate(user.created_at)}</span>
        </div>
      </div>

      {/* Status and Permissions */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status || 'inactive')}`}>
            {user.status || 'inactive'}
          </span>
          <div className="text-right">
            <div className="text-xs text-white/60">Permissions</div>
            <div className="text-sm font-semibold text-white">{permissionCount}</div>
          </div>
        </div>
      </div>

      {/* Department and Position */}
      {(user.department || user.position) && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {user.department && (
              <div>
                <span className="text-white/60">Department:</span>
                <div className="text-white font-medium">{user.department}</div>
              </div>
            )}
            {user.position && (
              <div>
                <span className="text-white/60">Position:</span>
                <div className="text-white font-medium">{user.position}</div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Image Uploader Modal */}
      {showImageUploader && onUpdateAvatar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4">
            {/* Modal Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Update Profile Picture</h3>
              <p className="text-gray-600">Choose a new image from your device or from Unsplash library</p>
            </div>

            {/* Image Uploader Container */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <ImageUploader
                  currentImageUrl={user.avatar_url || ''}
                  onImageUpload={async (result) => {
                    if (result.success && result.url && onUpdateAvatar) {
                      await onUpdateAvatar(user.id.toString(), result.url);
                    }
                    setShowImageUploader(false);
                  }}
                  userId={user.id.toString()}
                  size="lg"
                  shape="circle"
                  className="mx-auto"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowImageUploader(false)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 hover:shadow-md"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCard;