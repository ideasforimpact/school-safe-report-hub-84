
import { useCallback, useMemo } from 'react';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { isEmployeeSuperAdmin, isModuleAdmin } from '@/store/employeeSelectors';

// Whether the logged-in employee has a given module enabled at all (by name,
// case-insensitive) — a module missing from configuredModules means no access.
// Super admins always have access to every module.
export const useModuleEnabled = () => {
  const { state } = useEmployeeStore();

  return useCallback((moduleName: string) => {
    if (isEmployeeSuperAdmin(state)) return true;
    return state.configuredModules?.some(
      (module) => module.name?.toLowerCase() === moduleName.toLowerCase()
    ) ?? false;
  }, [state]);
};

// The modules the Dashboard's stat cards/gauges/charts are each tied to.
const DASHBOARD_DATA_MODULES = [
  'incidents',
  'assessments',
  'employee verification',
  'transport safety',
  'grievances',
];

// Whether the employee has been assigned any module the Dashboard actually shows
// data for. False for an employee who only has the Dashboard module itself (or
// nothing at all) — that's the one case where every dashboard section should show
// its empty/N/A placeholder instead of disappearing, so the page isn't blank.
export const useHasAnyDashboardModule = () => {
  const isModuleEnabled = useModuleEnabled();
  return DASHBOARD_DATA_MODULES.some((name) => isModuleEnabled(name));
};

// Admin access for Transport Safety = see every vehicle for the client.
// Non-admin = see only vehicles assigned to this employee (vehicles.employee_id).
export const useTransportSafetyAccess = () => {
  const { state } = useEmployeeStore();

  const isSuperAdmin = isEmployeeSuperAdmin(state);

  const hasTransportSafetyAdmin = useMemo(
    () => isModuleAdmin(state, 'transport safety'),
    [state.configuredModules, state.employeeData?.isSuperAdmin],
  );

  return {
    isSuperAdmin,
    hasTransportSafetyAdmin,
    currentEmployeeId: state.employeeData?.id,
  };
};

// Admin access for Employee Verification = see/manage every employee's verification
// status. Non-admin = see only this employee's own profile/verification status.
export const useEmployeeVerificationAccess = () => {
  const { state } = useEmployeeStore();

  const isSuperAdmin = isEmployeeSuperAdmin(state);

  const hasEmployeeVerificationAdmin = useMemo(
    () => isModuleAdmin(state, 'employee verification'),
    [state.configuredModules, state.employeeData?.isSuperAdmin],
  );

  return {
    isSuperAdmin,
    hasEmployeeVerificationAdmin,
    currentEmployeeId: state.employeeData?.id,
  };
};
