import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRealtimeModuleSync } from '@/hooks/useRealtimeModuleSync';
import { RefreshCw } from 'lucide-react';
import ModulePermissionsStatus from './ModulePermissionsStatus';

/**
 * Demo component to showcase real-time module synchronization
 * This component allows manual refresh of modules and displays current permissions
 */
const RealtimeModuleSyncDemo: React.FC = () => {
  const { refreshModules } = useRealtimeModuleSync();

  const handleManualRefresh = async () => {
    await refreshModules();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Real-time Module Sync</CardTitle>
          <CardDescription>
            This page demonstrates real-time module synchronization. When a Super Admin modifies your module access, 
            the changes will appear here automatically without needing to refresh the page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Button onClick={handleManualRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Manual Refresh
            </Button>
            <span className="text-sm text-muted-foreground">
              Or wait for automatic updates when permissions change
            </span>
          </div>
        </CardContent>
      </Card>
      
      <ModulePermissionsStatus />
    </div>
  );
};

export default RealtimeModuleSyncDemo;