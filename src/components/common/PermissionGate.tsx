import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

type UserRole = 'student' | 'moderator' | 'admin';

interface PermissionGateProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  allowedRoles,
  children,
  fallback = null
}) => {
  const { hasAnyRole } = usePermissions();

  if (hasAnyRole(allowedRoles)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};