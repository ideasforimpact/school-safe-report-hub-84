
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import BackofficeLayout from '@/components/layout/BackofficeLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import AddModuleDialog from '@/components/backoffice/modules/AddModuleDialog';
import EditModuleDialog from '@/components/backoffice/modules/EditModuleDialog';

interface Module {
  id: string;
  name: string;
  icon: string;
  level: string;
  created_at: string;
  updated_at: string;
}

const ModulesPage = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching modules:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch modules"
        });
        return;
      }

      setModules(data || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch modules"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);

      if (error) {
        console.error('Error deleting module:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete module"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Module deleted successfully"
      });

      fetchModules();
    } catch (error) {
      console.error('Error deleting module:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete module"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getLevelBadgeVariant = (level: string) => {
    return level === 'backoffice' ? 'default' : 'secondary';
  };

  return (
    <BackofficeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Modules Management
            </h1>
            <p className="text-gray-600 mt-1">Manage system modules and their configurations</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Module
          </Button>
        </div>

        {/* Modules Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Modules</CardTitle>
            <CardDescription>
              Configure and manage system modules available for clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading modules...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Icon</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No modules found
                      </TableCell>
                    </TableRow>
                  ) : (
                    modules.map((module) => (
                      <TableRow key={module.id}>
                        <TableCell className="font-medium">{module.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{module.icon}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getLevelBadgeVariant(module.level)}>
                            {module.level}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(module.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingModule(module)}
                              className="gap-1"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteModule(module.id)}
                              className="gap-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Module Dialog */}
      {showAddDialog && (
        <AddModuleDialog
          onClose={() => setShowAddDialog(false)}
          onModuleAdded={fetchModules}
        />
      )}

      {/* Edit Module Dialog */}
      {editingModule && (
        <EditModuleDialog
          module={editingModule}
          onClose={() => setEditingModule(null)}
          onModuleUpdated={fetchModules}
        />
      )}
    </BackofficeLayout>
  );
};

export default ModulesPage;
