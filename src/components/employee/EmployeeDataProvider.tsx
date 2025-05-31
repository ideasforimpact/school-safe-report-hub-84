
import React from 'react';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getEmployeeData, isEmployeeAdmin, isEmployeeSuperAdmin } from '@/store/employeeSelectors';

interface EmployeeDataProviderProps {
  children: (props: {
    employeeData: any;
    isLoading: boolean;
    error: string | null;
    isAdmin: boolean;
    isSuperAdmin: boolean;
  }) => React.ReactNode;
}

/**
 * A component that provides employee data from Redux store to its children
 * This avoids using useAuth() for employee data and relies only on Redux
 */
const EmployeeDataProvider: React.FC<EmployeeDataProviderProps> = ({ children }) => {
  const { state } = useEmployeeStore();
  
  // Get all data from Redux only
  const employeeData = getEmployeeData(state);
  const isLoading = state.isLoading;
  const error = state.error;
  const isAdmin = isEmployeeAdmin(state);
  const isSuperAdmin = isEmployeeSuperAdmin(state);
  
  //console.log("EmployeeDataProvider - employeeData:", employeeData);
  //console.log("EmployeeDataProvider - isAdmin:", isAdmin);
  //console.log("EmployeeDataProvider - isSuperAdmin:", isSuperAdmin);
  
  return <>{children({ employeeData, isLoading, error, isAdmin, isSuperAdmin })}</>;
};

export default EmployeeDataProvider;
