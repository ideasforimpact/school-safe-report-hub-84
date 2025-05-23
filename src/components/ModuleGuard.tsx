
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ModulePermissions } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { hasModulePermission } from '@/store/employeeSelectors';

interface ModuleGuardProps {
  moduleType: keyof ModulePermissions;
  children?: React.ReactNode;
}

const ModuleGuard = ({ moduleType, children }: ModuleGuardProps) => {
  const { state } = useEmployeeStore();
  
  // Only check the Redux store for permissions, no fallback to auth context
  const hasPermission = hasModulePermission(state, moduleType);

  if (!hasPermission) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
              <p className="text-gray-600">You don't have permission to access the {moduleType} module.</p>
              <p className="text-gray-600 mt-2">Please contact your administrator if you require access.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Return children if provided, otherwise return Outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
};

export default ModuleGuard;
