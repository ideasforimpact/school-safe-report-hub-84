
import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { isEmployeeSuperAdmin } from '@/store/employeeSelectors';

export const useAssessmentAccess = () => {
  const { employeeData: authEmployeeData } = useAuth();
  const { state: employeeState } = useEmployeeStore();

  // Check admin access
  const isSuperAdmin = isEmployeeSuperAdmin(employeeState);
  
  const hasAssessmentAdmin = useMemo(() => {
    // Super admins have access to everything
    if (isSuperAdmin) {
      return true;
    }
    
    if (!employeeState.configuredModules || employeeState.configuredModules.length === 0) {
      return false;
    }
    
    // Try multiple possible module name variations
    const possibleModuleNames = ['assessments', 'assessment', 'Assessment', 'Assessments'];
    let assessmentsModule = null;
    
    for (const moduleName of possibleModuleNames) {
      assessmentsModule = employeeState.configuredModules.find(
        module => module.name?.toLowerCase() === moduleName.toLowerCase()
      );
      if (assessmentsModule) {
        break;
      }
    }
    
    if (!assessmentsModule) {
      return false;
    }
    
    // Check for admin access in different possible data structures
    let hasAdmin = false;
    
    // Check accessLevel first (if it's an object)
    if (assessmentsModule.accessLevel && typeof assessmentsModule.accessLevel === 'object') {
      hasAdmin = assessmentsModule.accessLevel.is_admin === true;
    }
    
    // Check level property (handle both string and object types)
    if (!hasAdmin && assessmentsModule.level) {
      if (typeof assessmentsModule.level === 'object' && assessmentsModule.level.is_admin) {
        hasAdmin = assessmentsModule.level.is_admin === true;
      } else if (typeof assessmentsModule.level === 'string') {
        hasAdmin = assessmentsModule.level.toLowerCase().includes('admin');
      }
    }
    
    // Check direct is_admin property
    if (!hasAdmin && assessmentsModule.is_admin === true) {
      hasAdmin = true;
    }
    
    return hasAdmin;
  }, [isSuperAdmin, employeeState.configuredModules]);

  // Get current user's employee ID
  const currentUserEmployeeId = employeeState.employeeData?.id || authEmployeeData?.id;

  // Get client ID
  const clientId = employeeState.employeeData?.clientId || authEmployeeData?.clientId;

  return {
    hasAssessmentAdmin,
    isSuperAdmin,
    currentUserEmployeeId,
    clientId
  };
};
