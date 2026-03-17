import React from "react";
import { usePermission } from "@/hooks/use-permission";
import { Text } from "@/components/ui/text";
import { Center } from "@/components/ui/center";
import { SolarIconBoldDuotone } from "./ui/solar-icon-wrapper";

interface PermissionGuardProps {
  children: React.ReactNode;
  permissions?: string | string[];
  all?: boolean; // If true, requires all permissions; otherwise any of them
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  children,
  permissions,
  all = false,
  fallback,
}: PermissionGuardProps) {
  const { hasAnyPermission, hasAllPermissions } = usePermission();

  if (!permissions) return <>{children}</>;

  const permissionList = Array.isArray(permissions)
    ? permissions
    : [permissions];

  let hasAccess = false;

  if (all) {
    hasAccess = hasAllPermissions(permissionList);
  } else {
    hasAccess = hasAnyPermission(permissionList);
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  return (
    <Center className="flex-1 p-6">
      <SolarIconBoldDuotone
        name="ShieldCross"
        size={64}
        className="text-red-500 mb-4"
      />
      <Text className="text-xl font-bold text-gray-800 mb-2 text-center">
        Akses Ditolak
      </Text>
      <Text className="text-gray-500 text-center">
        Anda tidak memiliki izin untuk mengakses halaman ini.
      </Text>
    </Center>
  );
}
