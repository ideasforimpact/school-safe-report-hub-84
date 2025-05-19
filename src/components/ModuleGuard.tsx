
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';

interface ModuleGuardProps {
  children?: React.ReactNode;
}

const ModuleGuard = ({ children }: ModuleGuardProps) => {
  const { user, isAdmin } = useAuth();
  
  // Check if user has permission - simplified to just check if user is admin
  const hasPermission = isAdmin;

  if (!hasPermission) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
              <p className="text-gray-600">You don't have permission to access this module.</p>
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
