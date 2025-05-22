
import { useCallback } from 'react';

interface ModuleAccess {
  is_admin?: boolean;
  [key: string]: any;
}

export const useModuleAccess = () => {
  // Get the current module access level from sessionStorage
  const getCurrentModuleAccess = useCallback((): ModuleAccess => {
    try {
      const accessLevelStr = sessionStorage.getItem('currentModuleAccessLevel');
      return accessLevelStr ? JSON.parse(accessLevelStr) : {};
    } catch (error) {
      console.error('Error parsing module access level:', error);
      return {};
    }
  }, []);

  // Get the current module label from sessionStorage
  const getCurrentModuleName = useCallback((): string => {
    return sessionStorage.getItem('currentModuleLabel') || '';
  }, []);

  // Check if the current user has admin access to the current module
  const isModuleAdmin = useCallback((): boolean => {
    const access = getCurrentModuleAccess();
    return access?.is_admin === true;
  }, [getCurrentModuleAccess]);

  // Check if the current user has a specific permission for the current module
  const hasModulePermission = useCallback((permissionKey: string): boolean => {
    const access = getCurrentModuleAccess();
    return !!access[permissionKey];
  }, [getCurrentModuleAccess]);

  return {
    getCurrentModuleAccess,
    getCurrentModuleName,
    isModuleAdmin,
    hasModulePermission
  };
};
