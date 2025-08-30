import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { isEmployeeSuperAdmin } from '@/store/employeeSelectors';

export const useGrievanceAccess = () => {
  const { employeeData: authEmployeeData } = useAuth();
  const { state: employeeState } = useEmployeeStore();

  // Check admin access
  const isSuperAdmin = isEmployeeSuperAdmin(employeeState);
  
  const hasGrievanceAdmin = useMemo(() => {
    console.log('🔍 GRIEVANCE ACCESS DEBUG - Starting permission check');
    console.log('📊 Full Employee State:', employeeState);
    console.log('🔑 Auth Employee Data:', authEmployeeData);
    console.log('👑 Is Super Admin:', isSuperAdmin);
    
    if (isSuperAdmin) {
      console.log('✅ User has super admin access - granting grievance admin');
      return true;
    }
    
    if (!employeeState.configuredModules || employeeState.configuredModules.length === 0) {
      console.log('❌ No configured modules found - denying admin access');
      console.log('🔍 Configured modules array:', employeeState.configuredModules);
      return false;
    }
    
    console.log('🔍 Looking for grievances module in configured modules:');
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
    const possibleModuleNames = ['grievances', 'grievance', 'Grievance', 'Grievances'];
    let grievancesModule = null;
    
    for (const moduleName of possibleModuleNames) {
      grievancesModule = employeeState.configuredModules.find(
        module => module.name?.toLowerCase() === moduleName.toLowerCase()
      );
      if (grievancesModule) {
        console.log(`✅ Found grievances module with name "${moduleName}":`, grievancesModule);
        break;
      }
    }
    
    if (!grievancesModule) {
      console.log('❌ No grievances module found in configured modules - denying admin access');
      console.log('🔍 Available module names:', employeeState.configuredModules.map(m => m.name));
      return false;
    }
    
    // Enhanced admin access detection with multiple strategies
    let hasAdmin = false;
    const adminChecks = [];
    
    // Strategy 1: Check accessLevel.is_admin
    if (grievancesModule.accessLevel && typeof grievancesModule.accessLevel === 'object') {
      hasAdmin = grievancesModule.accessLevel.is_admin === true;
      adminChecks.push({
        strategy: 'accessLevel.is_admin',
        value: grievancesModule.accessLevel.is_admin,
        result: hasAdmin
      });
    }
    
    // Strategy 2: Check level object for is_admin
    if (!hasAdmin && grievancesModule.level && typeof grievancesModule.level === 'object') {
      if (grievancesModule.level.is_admin === true) {
        hasAdmin = true;
        adminChecks.push({
          strategy: 'level.is_admin',
          value: grievancesModule.level.is_admin,
          result: hasAdmin
        });
      }
    }
    
    // Strategy 3: Check level string for admin patterns
    if (!hasAdmin && typeof grievancesModule.level === 'string') {
      const levelStr = grievancesModule.level.toLowerCase();
      if (levelStr.includes('admin') || levelStr === 'full' || levelStr === 'all') {
        hasAdmin = true;
        adminChecks.push({
          strategy: 'level string pattern',
          value: grievancesModule.level,
          result: hasAdmin
        });
      }
    }
    
    // Strategy 4: Check accessLevel string for admin patterns
    if (!hasAdmin && typeof grievancesModule.accessLevel === 'string') {
      const accessStr = grievancesModule.accessLevel.toLowerCase();
      if (accessStr.includes('admin') || accessStr === 'full' || accessStr === 'all') {
        hasAdmin = true;
        adminChecks.push({
          strategy: 'accessLevel string pattern',
          value: grievancesModule.accessLevel,
          result: hasAdmin
        });
      }
    }
    
    console.log('🔍 Admin access checks performed:', adminChecks);
    console.log(`${hasAdmin ? '✅' : '❌'} Final grievance admin access result:`, hasAdmin);
    
    return hasAdmin;
  }, [isSuperAdmin, employeeState.configuredModules]);

  return {
    hasGrievanceAdmin,
    isSuperAdmin
  };
}; 