import { useMemo } from 'react';

type UserRole = 'student' | 'moderator' | 'admin';

export const usePermissions = () => {
  // Mock current user role - in real app this would come from auth context
  const currentUserRole: UserRole = 'admin';

  const hasRole = (role: UserRole): boolean => {
    return currentUserRole === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.includes(currentUserRole);
  };

  const canManageCourses = useMemo(() => {
    return hasAnyRole(['admin', 'moderator']);
  }, [currentUserRole]);

  const canEditContent = useMemo(() => {
    return hasAnyRole(['admin', 'moderator']);
  }, [currentUserRole]);

  const canViewAnalytics = useMemo(() => {
    return hasRole('admin');
  }, [currentUserRole]);

  return {
    currentUserRole,
    hasRole,
    hasAnyRole,
    canManageCourses,
    canEditContent,
    canViewAnalytics
  };
};