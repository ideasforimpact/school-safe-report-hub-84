
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
    console.log('🔍 ASSESSMENT ACCESS DEBUG - Starting permission check');
    console.log('📊 Full Employee State:', employeeState);
    console.log('🔑 Auth Employee Data:', authEmployeeData);
    console.log('👑 Is Super Admin:', isSuperAdmin);
    
    if (isSuperAdmin) {
      console.log('✅ User has super admin access - granting assessment admin');
      return true;
    }
    
    if (!employeeState.configuredModules || employeeState.configuredModules.length === 0) {
      console.log('❌ No configured modules found - denying admin access');
      console.log('🔍 Configured modules array:', employeeState.configuredModules);
      return false;
    }
    
    console.log('🔍 Looking for assessments module in configured modules:');
    console.log('📋 Total configured modules:', employeeState.configuredModules.length);
    
    employeeState.configuredModules.forEach((module, index) => {
      console.log(`  Module ${index}:`, {
        name: module.name,
        key: module.key,
        lowercaseName: module.name?.toLowerCase(),
        accessLevel: module.accessLevel,
        level: module.level,
        levelType: typeof module.level,
        accessLevelType: typeof module.accessLevel,
        fullModule: module
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
      console.log('🔍 Available module names:', employeeState.configuredModules.map(m => m.name));
      return false;
    }
    
    // Check for admin access in different possible data structures
    // Handle both object and string types for level property
    let hasAdmin = false;
    
    // Check accessLevel first (if it's an object)
    if (assessmentsModule.accessLevel && typeof assessmentsModule.accessLevel === 'object') {
      hasAdmin = assessmentsModule.accessLevel.is_admin === true;
      console.log('🔍 Checking accessLevel object:', {
        accessLevel: assessmentsModule.accessLevel,
        is_admin: assessmentsModule.accessLevel.is_admin,
        hasAdmin
      });
    }
    
    // Check level property (handle both string and object types)
    if (!hasAdmin && assessmentsModule.level) {
      if (typeof assessmentsModule.level === 'object' && assessmentsModule.level.is_admin) {
        hasAdmin = assessmentsModule.level.is_admin === true;
        console.log('🔍 Checking level object:', {
          level: assessmentsModule.level,
          is_admin: assessmentsModule.level.is_admin,
          hasAdmin
        });
      } else if (typeof assessmentsModule.level === 'string') {
        // If level is a string, check if it indicates admin access
        hasAdmin = assessmentsModule.level.toLowerCase().includes('admin');
        console.log('🔍 Checking level string:', {
          level: assessmentsModule.level,
          levelLower: assessmentsModule.level.toLowerCase(),
          includesAdmin: assessmentsModule.level.toLowerCase().includes('admin'),
          hasAdmin
        });
      }
    }
    
    // Check direct is_admin property
    if (!hasAdmin && assessmentsModule.is_admin === true) {
      hasAdmin = true;
      console.log('🔍 Found direct is_admin property:', assessmentsModule.is_admin);
    }
    
    console.log('🎯 Final assessment admin check result:', {
      hasAdmin,
      moduleFound: !!assessmentsModule,
      moduleName: assessmentsModule?.name,
      accessLevel: assessmentsModule?.accessLevel,
      level: assessmentsModule?.level,
      levelType: typeof assessmentsModule?.level,
      is_admin: assessmentsModule?.is_admin
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
    clientId,
    employeeDataId: employeeState.employeeData?.id,
    authEmployeeDataId: authEmployeeData?.id
  });

  return {
    hasAssessmentAdmin,
    isSuperAdmin,
    currentUserEmployeeId,
    clientId
  };
};
