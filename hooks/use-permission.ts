import { useAuthStore } from "@/stores/auth";

/**
 * Hook to check if the current user has a specific permission.
 * Permissions are derived from the user's roles and include
 * wildcard support (e.g., '*:*' for all permissions).
 */
export function usePermission() {
  const { profile } = useAuthStore();
  
  // Flatten all permissions from all roles
  const permissions = profile?.roles?.flatMap(role => role.permissions || []) || [];
  
  /**
   * Check if user has a specific permission name.
   * Returns true if user has the exact permission or the super admin wildcard.
   */
  const hasPermission = (permissionName: string) => {
    return permissions.some(p => p.name === permissionName || p.name === '*:*');
  };

  /**
   * Check if user has any of the listed permissions.
   */
  const hasAnyPermission = (permissionNames: string[]) => {
    return permissions.some(p => 
      permissionNames.includes(p.name) || p.name === '*:*'
    );
  };

  /**
   * Check if user has all of the listed permissions.
   */
  const hasAllPermissions = (permissionNames: string[]) => {
    const hasWildcard = permissions.some(p => p.name === '*:*');
    if (hasWildcard) return true;
    
    return permissionNames.every(name => 
      permissions.some(p => p.name === name)
    );
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin: hasPermission('*:*'),
  };
}
