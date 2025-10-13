
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, Edit, Trash2, Search, Filter, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CreateModuleDialog from '@/components/modules/CreateModuleDialog';

interface Module {
  id: string;
  name: string;
  icon: string;
  level: string;
  url: string | null;
  order: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const ModulesPage = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [filteredModules, setFilteredModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { toast } = useToast();

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [modules, searchTerm, levelFilter, statusFilter]);

  const fetchModules = async () => {
    try {
      setLoading(true);
      // Fetch all modules initially, not just backoffice
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('order', { ascending: true, nullsFirst: false });

      if (error) {
        console.error('Error fetching modules:', error);
        toast({
          title: "Error",
          description: "Failed to fetch modules",
          variant: "destructive",
        });
        return;
      }

      setModules(data || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast({
        title: "Error",
        description: "Failed to fetch modules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...modules];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(module =>
        module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.icon.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (module.url && module.url.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(module => module.level === levelFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(module => module.active === isActive);
    }

    setFilteredModules(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLevelFilter('all');
    setStatusFilter('all');
  };

  const handleEdit = (moduleId: string) => {
    console.log('Edit module:', moduleId);
    // The edit functionality will be handled by the CreateModuleDialog component
  };

  const handleDelete = async (moduleId: string) => {
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
          title: "Error",
          description: "Failed to delete module",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Module deleted successfully",
      });
      
      // Refresh the modules list
      fetchModules();
    } catch (error) {
      console.error('Error deleting module:', error);
      toast({
        title: "Error",
        description: "Failed to delete module",
        variant: "destructive",
      });
    }
  };

  // Get unique levels for filter dropdown
  const uniqueLevels = [...new Set(modules.map(module => module.level))].sort();

  const hasActiveFilters = searchTerm || levelFilter !== 'all' || statusFilter !== 'all';

  return (
    <Layout>
      <div className="space-y-8 p-[50px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Modules Management</h1>
              <p className="text-gray-500 mt-1">Manage system modules and configurations</p>
            </div>
          </div>
          <CreateModuleDialog onSuccess={fetchModules} />
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>System Modules</CardTitle>
                <CardDescription>
                  View and manage all system modules
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filter Section */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-wrap gap-4 items-center">
                {/* Search Filter */}
                <div className="relative flex-1 min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search modules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Level Filter */}
                <div className="w-48">
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All levels</SelectItem>
                      {uniqueLevels.map(level => (
                        <SelectItem key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Results Info */}
              {hasActiveFilters && (
                <div className="text-sm text-muted-foreground">
                  Showing {filteredModules.length} of {modules.length} modules
                </div>
              )}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-500">Loading modules...</p>
              </div>
            ) : filteredModules.length === 0 ? (
              <div className="text-center py-12">
                <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {hasActiveFilters ? 'No Modules Match Your Filters' : 'No Modules Found'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {hasActiveFilters 
                    ? 'Try adjusting your search or filter criteria'
                    : 'No modules are currently configured in the system'
                  }
                </p>
                {!hasActiveFilters && (
                  <CreateModuleDialog 
                    onSuccess={fetchModules}
                    trigger={
                      <Button className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Create First Module
                      </Button>
                    }
                  />
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Icon</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModules.map((module) => (
                    <TableRow key={module.id}>
                      <TableCell className="font-medium">{module.name}</TableCell>
                      <TableCell>{module.icon}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          module.level === 'backoffice' 
                            ? 'bg-blue-100 text-blue-800' 
                            : module.level === 'user'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {module.level}
                        </span>
                      </TableCell>
                      <TableCell>{module.url || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={module.active ? "default" : "secondary"}>
                          {module.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{module.order || '-'}</TableCell>
                      <TableCell>{new Date(module.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <CreateModuleDialog
                            module={module}
                            isEdit={true}
                            onSuccess={fetchModules}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Edit module"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(module.id)}
                            title="Delete module"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ModulesPage;
