
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
    console.log('🔍 Assessment Access Debug - Starting permission check');
    console.log('📊 Employee State:', {
      employeeData: employeeState.employeeData,
      configuredModules: employeeState.configuredModules
    });
    console.log('🔑 Auth Employee Data:', authEmployeeData);
    console.log('👑 Is Super Admin:', isSuperAdmin);
    
    if (isSuperAdmin) {
      console.log('✅ User has super admin access - granting assessment admin');
      return true;
    }
    
    if (!employeeState.configuredModules || employeeState.configuredModules.length === 0) {
      console.log('❌ No configured modules found - denying admin access');
      return false;
    }
    
    console.log('🔍 Looking for assessments module in configured modules:');
    employeeState.configuredModules.forEach((module, index) => {
      console.log(`  Module ${index}:`, {
        name: module.name,
        lowercaseName: module.name?.toLowerCase(),
        accessLevel: module.accessLevel,
        level: module.level,
        is_admin: module.accessLevel?.is_admin || module.level?.is_admin
      });
    });
    
    // Try multiple possible module name variations
    const possibleModuleNames = ['assessments', 'assessment', 'Assessment', 'Assessments'];
    let assessmentsModule = null;
    
    for (const moduleName of possibleModuleNames) {
      assessmentsModule = employeeState.configuredModules.find(
        module => module.name?.toLowerCase() === moduleName.toLowerCase()
      );
      if (assessmentsModule) {
        console.log(`✅ Found assessments module with name "${moduleName}":`, assessmentsModule);
        break;
      }
    }
    
    if (!assessmentsModule) {
      console.log('❌ No assessments module found in configured modules - denying admin access');
      return false;
    }
    
    // Check for admin access in different possible data structures
    const hasAdmin = 
      assessmentsModule.accessLevel?.is_admin === true || 
      assessmentsModule.level?.is_admin === true ||
      assessmentsModule.is_admin === true;
    
    console.log('🎯 Final assessment admin check result:', {
      hasAdmin,
      accessLevel: assessmentsModule.accessLevel,
      level: assessmentsModule.level,
      is_admin: assessmentsModule.is_admin
    });
    
    return hasAdmin;
  }, [isSuperAdmin, employeeState.configuredModules]);

  // Get current user's employee ID
  const currentUserEmployeeId = employeeState.employeeData?.id || authEmployeeData?.id;

  // Get client ID
  const clientId = employeeState.employeeData?.clientId || authEmployeeData?.clientId;

  console.log('📋 Assessment Access Summary:', {
    hasAssessmentAdmin,
    isSuperAdmin,
    currentUserEmployeeId,
    clientId
  });

  return {
    hasAssessmentAdmin,
    isSuperAdmin,
    currentUserEmployeeId,
    clientId
  };
};
