import React, { ReactNode } from "react";
import { Permission, PermissionAction, User } from "../../types";

interface PermissionGuardProps {
  children: ReactNode;
  user: User;
  resource: string;
  action: PermissionAction;
  permissions: Permission[];
  fallback?: ReactNode;
  showFallback?: boolean;
}

interface PermissionContextType {
  user: User;
  permissions: Permission[];
  hasPermission: (resource: string, action: PermissionAction) => boolean;
  hasAnyPermission: (
    checks: Array<{ resource: string; action: PermissionAction }>,
  ) => boolean;
  hasAllPermissions: (
    checks: Array<{ resource: string; action: PermissionAction }>,
  ) => boolean;
}

const PermissionContext = React.createContext<PermissionContextType | null>(
  null,
);

// Permission Guard Component
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  user,
  resource,
  action,
  permissions,
  fallback = null,
  showFallback = true,
}) => {
  // avoid no-unused-vars for prop 'user' when not directly referenced
  void user;
  const hasPermission = (
    checkResource: string,
    checkAction: PermissionAction,
  ): boolean => {
    return permissions.some(
      (permission) =>
        permission.resource === checkResource &&
        permission.actions.includes(checkAction),
    );
  };

  const userHasPermission = hasPermission(resource, action);

  if (!userHasPermission) {
    if (showFallback && fallback) {
      return <>{fallback}</>;
    }

    if (showFallback) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg
              className="w-5 h-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Access Restricted
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                You don't have permission to {action} {resource}.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
};

// Permission Provider Component
interface PermissionProviderProps {
  children: ReactNode;
  user: User;
  permissions: Permission[];
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({
  children,
  user,
  permissions,
}) => {
  const hasPermission = (
    resource: string,
    action: PermissionAction,
  ): boolean => {
    return permissions.some(
      (permission) =>
        permission.resource === resource && permission.actions.includes(action),
    );
  };

  const hasAnyPermission = (
    checks: Array<{ resource: string; action: PermissionAction }>,
  ): boolean => {
    return checks.some((check) => hasPermission(check.resource, check.action));
  };

  const hasAllPermissions = (
    checks: Array<{ resource: string; action: PermissionAction }>,
  ): boolean => {
    return checks.every((check) => hasPermission(check.resource, check.action));
  };

  const contextValue: PermissionContextType = {
    user,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
};

// Hook to use permission context (internal only)
const usePermissions = (): PermissionContextType => {
  const context = React.useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
};

// Removed HOC export to comply with react-refresh rules (unused externally)

// Conditional rendering component based on permissions
interface ConditionalRenderProps {
  children: ReactNode;
  condition: (permissions: PermissionContextType) => boolean;
  fallback?: ReactNode;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  children,
  condition,
  fallback = null,
}) => {
  const permissions = usePermissions();

  if (condition(permissions)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

// Permission-based button component
interface PermissionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  resource: string;
  action: PermissionAction;
  children: ReactNode;
  fallbackText?: string;
  showFallback?: boolean;
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  resource,
  action,
  children,
  fallbackText = "No Permission",
  showFallback = true,
  className = "",
  ...props
}) => {
  const { hasPermission } = usePermissions();

  const userHasPermission = hasPermission(resource, action);

  if (!userHasPermission) {
    if (!showFallback) {
      return null;
    }

    return (
      <button
        {...props}
        disabled
        className={`${className} opacity-50 cursor-not-allowed`}
        title="You don't have permission for this action"
      >
        {fallbackText}
      </button>
    );
  }

  return (
    <button {...props} className={className}>
      {children}
    </button>
  );
};

// Permission-based link component
interface PermissionLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  resource: string;
  action: PermissionAction;
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}

export const PermissionLink: React.FC<PermissionLinkProps> = ({
  resource,
  action,
  children,
  fallback = null,
  showFallback = true,
  className = "",
  ...props
}) => {
  const { hasPermission } = usePermissions();

  const userHasPermission = hasPermission(resource, action);

  if (!userHasPermission) {
    if (!showFallback) {
      return null;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <span
        className={`${className} opacity-50 cursor-not-allowed`}
        title="You don't have permission to access this link"
      >
        {children}
      </span>
    );
  }

  return (
    <a {...props} className={className}>
      {children}
    </a>
  );
};

export default PermissionGuard;
