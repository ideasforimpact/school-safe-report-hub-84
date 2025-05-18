
import React, { useState, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { ModulePermissions } from '@/contexts/auth/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface Module {
  id: string;
  name: string;
  key?: string;
  level: string;
  icon: string;
}

interface ModuleAccessTabProps {
  formData: {
    moduleAccess: Partial<ModulePermissions>;
  };
  handleModuleAccessChange: (module: keyof ModulePermissions, value: boolean) => void;
}

const ModuleAccessTab = ({ formData, handleModuleAccessChange }: ModuleAccessTabProps) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClientModules = async () => {
      setLoading(true);
      try {
        // Fetch modules that are not backoffice level
        const { data, error } = await supabase.functions.invoke('fetch-modules', {
          body: { fetchLevel: 'client' }
        });

        if (error) {
          console.error("Error fetching modules:", error);
          toast.error("Failed to load modules");
          return;
        }

        if (data && data.modules) {
          setModules(data.modules);
        }
      } catch (error) {
        console.error("Error in fetchClientModules:", error);
        toast.error("Error loading modules");
      } finally {
        setLoading(false);
      }
    };

    fetchClientModules();
  }, []);

  // Helper function to format module name for display
  const formatModuleName = (name: string): string => {
    return name.replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  // Map module names to formData.moduleAccess keys
  const getAccessKeyFromModuleName = (moduleName: string): keyof ModulePermissions => {
    // Convert module name to camelCase for matching with ModulePermissions keys
    const key = moduleName.toLowerCase()
      .replace(/\s(.)/g, ($1) => $1.toUpperCase())
      .replace(/\s/g, '')
      .replace(/^(.)/, ($1) => $1.toLowerCase()) as keyof ModulePermissions;

    // Check if there's an admin version of this key
    const adminKey = `${key}Admin` as keyof ModulePermissions;
    
    // If adminKey exists in formData.moduleAccess, return that, otherwise return the regular key
    if (adminKey in formData.moduleAccess) {
      return adminKey;
    }
    return key;
  };

  // Check if a module key represents admin access
  const isAdminKey = (key: string): boolean => {
    return key.toLowerCase().includes('admin');
  };

  // Determine access types available for a module
  const getAvailableAccessTypes = (moduleName: string) => {
    // Convert module name to base key (without Admin suffix)
    const baseKey = moduleName.toLowerCase()
      .replace(/\s(.)/g, ($1) => $1.toUpperCase())
      .replace(/\s/g, '')
      .replace(/^(.)/, ($1) => $1.toLowerCase());
    
    const adminKey = `${baseKey}Admin` as keyof ModulePermissions;
    const userKey = baseKey as keyof ModulePermissions;
    
    const result = [];
    
    // Check if these keys exist in the ModulePermissions type by testing if they exist 
    // in the current formData or any predefined access keys list
    // Instead of checking ModulePermissions.prototype which doesn't exist
    
    // Check for potential user access type
    if (formData.moduleAccess.hasOwnProperty(userKey) || moduleAccessKeys.includes(userKey)) {
      result.push({ key: userKey, type: 'User' });
    }
    
    // Check for potential admin access type
    if (formData.moduleAccess.hasOwnProperty(adminKey) || moduleAccessKeys.includes(adminKey)) {
      result.push({ key: adminKey, type: 'Admin' });
    }
    
    return result;
  };

  // Define a list of known module access keys
  const moduleAccessKeys: (keyof ModulePermissions)[] = [
    'superAdmin',
    'incidentReporting',
    'incidentAdmin',
    'assessmentUser',
    'assessmentsAdmin',
    'employeeVerificationAdmin',
    'grievancesAdmin',
    'transportSafetyAdmin',
    'eduSafeResourceAccess',
    'clientManagement',
    'assessmentTemplateAdmin',
    'eduSafeResourceAdmin',
    'analyticsAdmin'
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="font-medium text-lg">Module Access</label>
        
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 text-primary animate-spin mr-2" />
            <p className="text-muted-foreground">Loading modules...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Select</TableHead>
                  <TableHead>Module Name</TableHead>
                  <TableHead className="w-[120px]">Access Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module) => {
                  const accessTypes = getAvailableAccessTypes(module.name);
                  
                  return accessTypes.map(({ key, type }) => {
                    const accessKey = key as keyof ModulePermissions;
                    const checked = formData.moduleAccess[accessKey] || false;
                    
                    return (
                      <TableRow key={`${module.id}-${key}`} className="h-14">
                        <TableCell>
                          <Checkbox 
                            id={`module-${accessKey}`}
                            checked={checked}
                            onCheckedChange={(checked) => 
                              handleModuleAccessChange(accessKey, checked === true)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <label 
                            htmlFor={`module-${accessKey}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {module.name}
                          </label>
                        </TableCell>
                        <TableCell>
                          {type === 'Admin' ? (
                            <Badge variant="success" className="text-xs">Admin</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">User</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  });
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleAccessTab;
