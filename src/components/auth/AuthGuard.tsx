import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: string;
  redirectTo?: string;
  fallbackComponent?: React.ComponentType;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = true, 
  requiredRole,
  redirectTo = '/login',
  fallbackComponent: FallbackComponent
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while auth is being determined
  if (isLoading) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requireAuth && user && requiredRole && user.role !== requiredRole) {
    // Redirect to dashboard or show unauthorized message
    return <Navigate to="/dashboard" state={{ error: 'Insufficient permissions' }} replace />;
  }

  // If user is authenticated but trying to access auth pages (login/register)
  if (!requireAuth && user && (location.pathname === '/login' || location.pathname === '/register')) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;