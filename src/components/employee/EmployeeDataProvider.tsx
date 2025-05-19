
import React from 'react';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getEmployeeData, isEmployeeSuperAdmin } from '@/store/employeeSelectors';

interface EmployeeDataProviderProps {
  children: (props: {
    employeeData: any;
    isLoading: boolean;
    error: string | null;
    isSuperAdmin: boolean;
  }) => React.ReactNode;
}

/**
 * A component that provides employee data from Redux store to its children
 * This avoids using useAuth() for employee data and relies only on Redux
 */
const EmployeeDataProvider: React.FC<EmployeeDataProviderProps> = ({ children }) => {
  const { state } = useEmployeeStore();
  
  const employeeData = getEmployeeData(state);
  const isLoading = state.isLoading;
  const error = state.error;
  const isSuperAdmin = isEmployeeSuperAdmin(state);
  
  return <>{children({ employeeData, isLoading, error, isSuperAdmin })}</>;
};

export default EmployeeDataProvider;
