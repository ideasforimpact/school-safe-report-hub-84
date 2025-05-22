
import { useState, useEffect } from 'react';

/**
 * Hook to access the current module's access level and name
 * This provides an easy way for any component to get and check module permissions
 */
export const useModuleAccess = () => {
  const [moduleAccessLevel, setModuleAccessLevel] = useState<Record<string, any>>({});
  const [moduleName, setModuleName] = useState<string>("");
  
  useEffect(() => {
    try {
      // Get the current module access level from session storage
      const accessLevelString = sessionStorage.getItem('currentModuleAccessLevel');
      const currentModule = sessionStorage.getItem('currentModule');
      
      if (accessLevelString) {
        const accessLevel = JSON.parse(accessLevelString);
        console.log("Retrieved module access level from session storage:", accessLevel);
        setModuleAccessLevel(accessLevel);
      } else {
        console.log("No module access level found in session storage");
      }
      
      if (currentModule) {
        console.log("Retrieved current module name:", currentModule);
        setModuleName(currentModule);
      } else {
        console.log("No current module name found in session storage");
      }
    } catch (error) {
      console.error("Error retrieving module access level from session storage:", error);
    }
  }, []);
  
  /**
   * Check if the current user has admin access for this module
   */
  const isAdmin = (): boolean => {
    // Check specifically for the is_admin property in the access level
    return Boolean(moduleAccessLevel?.is_admin);
  };
  
  /**
   * Check if the current user has a specific permission within this module
   */
  const hasPermission = (permissionKey: string): boolean => {
    return Boolean(moduleAccessLevel?.[permissionKey]);
  };
  
  return {
    moduleAccessLevel,
    moduleName,
    isAdmin,
    hasPermission
  };
};

export default useModuleAccess;
