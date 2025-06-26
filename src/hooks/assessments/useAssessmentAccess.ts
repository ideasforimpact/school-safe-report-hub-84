
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
    if (isSuperAdmin) return true;
    
    const assessmentsModule = employeeState.configuredModules?.find(
      module => module.name.toLowerCase() === 'assessments'
    );
    return assessmentsModule?.accessLevel?.is_admin === true;
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
