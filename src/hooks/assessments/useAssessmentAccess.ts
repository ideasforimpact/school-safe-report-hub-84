
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
    
    // Enhanced admin access detection with multiple strategies
    let hasAdmin = false;
    const adminChecks = [];
    
    // Strategy 1: Check accessLevel.is_admin
    if (assessmentsModule.accessLevel && typeof assessmentsModule.accessLevel === 'object') {
      hasAdmin = assessmentsModule.accessLevel.is_admin === true;
      adminChecks.push({
        strategy: 'accessLevel.is_admin',
        value: assessmentsModule.accessLevel.is_admin,
        result: hasAdmin
      });
    }
    
    // Strategy 2: Check level object for is_admin
    if (!hasAdmin && assessmentsModule.level && typeof assessmentsModule.level === 'object') {
      if (assessmentsModule.level.is_admin === true) {
        hasAdmin = true;
        adminChecks.push({
          strategy: 'level.is_admin',
          value: assessmentsModule.level.is_admin,
          result: hasAdmin
        });
      }
    }
    
    // Strategy 3: Check level string for admin patterns
    if (!hasAdmin && assessmentsModule.level && typeof assessmentsModule.level === 'string') {
      const levelStr = assessmentsModule.level.toLowerCase();
      const adminPatterns = ['admin', 'administrator', 'admin (admin)'];
      
      for (const pattern of adminPatterns) {
        if (levelStr.includes(pattern.toLowerCase())) {
          hasAdmin = true;
          adminChecks.push({
            strategy: 'level string pattern',
            pattern: pattern,
            levelValue: assessmentsModule.level,
            result: hasAdmin
          });
          break;
        }
      }
    }
    
    // Strategy 4: Check accessLevel string for admin patterns
    if (!hasAdmin && assessmentsModule.accessLevel && typeof assessmentsModule.accessLevel === 'string') {
      const accessLevelStr = assessmentsModule.accessLevel.toLowerCase();
      const adminPatterns = ['admin', 'administrator', 'admin (admin)'];
      
      for (const pattern of adminPatterns) {
        if (accessLevelStr.includes(pattern.toLowerCase())) {
          hasAdmin = true;
          adminChecks.push({
            strategy: 'accessLevel string pattern',
            pattern: pattern,
            accessLevelValue: assessmentsModule.accessLevel,
            result: hasAdmin
          });
          break;
        }
      }
    }
    
    // Strategy 5: Check direct is_admin property
    if (!hasAdmin && assessmentsModule.is_admin === true) {
      hasAdmin = true;
      adminChecks.push({
        strategy: 'direct is_admin',
        value: assessmentsModule.is_admin,
        result: hasAdmin
      });
    }
    
    // Strategy 6: Check for any property containing admin info
    if (!hasAdmin) {
      const moduleKeys = Object.keys(assessmentsModule);
      for (const key of moduleKeys) {
        const value = assessmentsModule[key];
        if (typeof value === 'string' && value.toLowerCase().includes('admin')) {
          hasAdmin = true;
          adminChecks.push({
            strategy: 'property scan',
            key: key,
            value: value,
            result: hasAdmin
          });
          break;
        }
      }
    }
    
    console.log('🔍 Admin access detection strategies used:', adminChecks);
    console.log('🎯 Final assessment admin check result:', {
      hasAdmin,
      moduleFound: !!assessmentsModule,
      moduleName: assessmentsModule?.name,
      accessLevel: assessmentsModule?.accessLevel,
      level: assessmentsModule?.level,
      levelType: typeof assessmentsModule?.level,
      accessLevelType: typeof assessmentsModule?.accessLevel,
      is_admin: assessmentsModule?.is_admin,
      strategiesUsed: adminChecks.length,
      successfulStrategy: adminChecks.find(check => check.result)?.strategy || 'none'
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
