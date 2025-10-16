import { Permission, PermissionAction } from "../../types";

// Utility function to check multiple permissions
export const checkPermissions = (
  permissions: Permission[],
  checks: Array<{
    resource: string;
    action: PermissionAction;
    operator?: "AND" | "OR";
  }>,
): boolean => {
  const hasPermission = (
    resource: string,
    action: PermissionAction,
  ): boolean => {
    return permissions.some(
      (permission) =>
        permission.resource === resource && permission.actions.includes(action),
    );
  };

  // Default to AND operator if not specified
  const operator = checks[0]?.operator || "AND";

  if (operator === "OR") {
    return checks.some((check) => hasPermission(check.resource, check.action));
  }

  return checks.every((check) => hasPermission(check.resource, check.action));
};

// Permission level checker
export const hasMinimumPermissionLevel = (
  permissions: Permission[],
  resource: string,
  minimumLevel: "read" | "write" | "admin",
): boolean => {
  const resourcePermissions = permissions.filter(
    (p) => p.resource === resource,
  );

  if (resourcePermissions.length === 0) return false;

  const levelHierarchy = { none: 0, read: 1, write: 2, admin: 3 };
  const requiredLevel = levelHierarchy[minimumLevel];

  return resourcePermissions.some(
    (p) => levelHierarchy[p.level] >= requiredLevel,
  );
};