
import React from 'react';
import BackofficeLayout from '@/components/layout/BackofficeLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

const ModulesPage = () => {
  return (
    <BackofficeLayout>
      <div className="space-y-8">
        <div className="flex items-center space-x-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Modules Management</h1>
            <p className="text-gray-500 mt-1">Manage system modules and configurations</p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Module Configuration</CardTitle>
            <CardDescription>
              Configure and manage system modules for different user levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Modules Management
              </h3>
              <p className="text-gray-500">
                Module management functionality will be implemented here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </BackofficeLayout>
  );
};

export default ModulesPage;
