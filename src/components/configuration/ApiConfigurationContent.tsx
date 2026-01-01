import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Trash2, Key, Loader2 } from 'lucide-react';
import { StatusSwitch } from '@/components/ui/status-switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface ApiConfiguration {
  id: string;
  api_key: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const ApiConfigurationContent = () => {
  const { employeeData } = useAuth();
  const [apiConfigs, setApiConfigs] = useState<ApiConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ApiConfiguration | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const clientId = employeeData?.clientId;
  const employeeId = employeeData?.id;

  // Fetch API configurations
  const fetchApiConfigs = async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/api-configuration?client_id=${clientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch API configurations');
      }

      const result = await response.json();
      setApiConfigs(result.data || []);
    } catch (error: any) {
      console.error('Error fetching API configurations:', error);
      toast.error(error?.message || 'Failed to fetch API configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiConfigs();
  }, [clientId]);

  // Handle create API configuration
  const handleCreate = async () => {
    if (!clientId) {
      toast.error('Client ID is required');
      return;
    }

    if (!employeeId) {
      toast.error('Employee ID is required');
      return;
    }

    try {
      setCreating(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/api-configuration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          client_id: clientId,
          employee_id: employeeId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create API configuration');
      }

      const result = await response.json();
      toast.success(result.message || 'API configuration created successfully');
      setShowCreateDialog(false);
      await fetchApiConfigs();
    } catch (error: any) {
      console.error('Error creating API configuration:', error);
      toast.error(error?.message || 'Failed to create API configuration');
    } finally {
      setCreating(false);
    }
  };

  // Handle view API configuration
  const handleView = async (configId: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/api-configuration?id=${configId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch API configuration');
      }

      const result = await response.json();
      setSelectedConfig(result.data);
      setShowViewDialog(true);
    } catch (error: any) {
      console.error('Error fetching API configuration:', error);
      toast.error(error?.message || 'Failed to fetch API configuration');
    }
  };

  // Handle toggle active status
  const handleToggleStatus = async (config: ApiConfiguration) => {
    if (!employeeId) {
      toast.error('Employee ID is required');
      return;
    }

    try {
      setToggling(config.id);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/api-configuration`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: config.id,
          active: !config.active,
          employee_id: employeeId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update API configuration status');
      }

      toast.success(`API configuration ${!config.active ? 'activated' : 'deactivated'} successfully`);
      await fetchApiConfigs();
    } catch (error: any) {
      console.error('Error toggling API configuration status:', error);
      toast.error(error?.message || 'Failed to update API configuration status');
    } finally {
      setToggling(null);
    }
  };

  // Handle delete API configuration
  const handleDelete = async () => {
    if (!selectedConfig) return;

    try {
      setDeleting(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/api-configuration`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: selectedConfig.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete API configuration');
      }

      toast.success('API configuration deleted successfully');
      setShowDeleteDialog(false);
      setSelectedConfig(null);
      await fetchApiConfigs();
    } catch (error: any) {
      console.error('Error deleting API configuration:', error);
      toast.error(error?.message || 'Failed to delete API configuration');
    } finally {
      setDeleting(false);
    }
  };

  const hasActiveConfig = apiConfigs.length > 0;

  return (
    <div className="space-y-4">
      {/* Create Button - Only show if no active config exists */}
      {!hasActiveConfig && (
        <div className="flex justify-end">
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create API
          </Button>
        </div>
      )}

      {/* API Configurations List */}
      {hasActiveConfig && (
        <div className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>API Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : apiConfigs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      No API configurations found
                    </TableCell>
                  </TableRow>
                ) : (
                  apiConfigs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-mono text-sm">
                        {config.api_key.substring(0, 20)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.active ? 'success' : 'destructive'}>
                          {config.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(config.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          <StatusSwitch
                            variant="status"
                            checked={config.active}
                            onCheckedChange={() => handleToggleStatus(config)}
                            disabled={toggling === config.id}
                            aria-label={`${config.active ? 'Deactivate' : 'Activate'} API configuration`}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(config.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedConfig(config);
                              setShowDeleteDialog(true);
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Create Confirmation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Create API Configuration
            </DialogTitle>
            <DialogDescription>
              This will create a new API key and SECRET KEY for your client.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create API
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              API Configuration Details
            </DialogTitle>
          </DialogHeader>
          {selectedConfig && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">API Key</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md font-mono text-sm break-all">
                  {selectedConfig.api_key}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <Badge variant={selectedConfig.active ? 'default' : 'secondary'}>
                    {selectedConfig.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Created At</label>
                <div className="mt-1 text-sm text-gray-600">
                  {new Date(selectedConfig.created_at).toLocaleString()}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Last Updated</label>
                <div className="mt-1 text-sm text-gray-600">
                  {new Date(selectedConfig.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this API configuration? This action cannot be undone. 
              Any external systems using this API key will no longer be able to access your data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ApiConfigurationContent;

