
import React, { useState, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { ModulePermissions } from '@/contexts/auth/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Check } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';

interface Module {
  id: string;
  name: string;
  key?: string;
  level: string;
  icon: string;
}

interface ModuleAccess {
  name: string;
  module_id: string;
  is_admin: boolean;
  is_enabled: boolean;
  access_level?: Record<string, any>;
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
  const [moduleAccessState, setModuleAccessState] = useState<ModuleAccess[]>([]);

  // Fetch modules only once during initial load
  useEffect(() => {
    const fetchClientModules = async () => {
      if (modules.length > 0) return; // Skip if modules are already loaded
      
      console.log("Fetching client modules: Initial load");
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
          console.log("Modules fetched successfully:", data.modules.length);
          setModules(data.modules);
          
          // Initialize module access state based on formData
          const initialModuleAccess: ModuleAccess[] = data.modules.map((module: Module) => {
            const accessKey = getAccessKeyFromModuleName(module.name);
            const isEnabled = !!formData.moduleAccess[accessKey];
            const isAdmin = isEnabled && accessKey.includes('Admin'); // Check if it's an admin module
            
            console.log(`Initializing module: ${module.name}, ID: ${module.id}, Enabled: ${isEnabled}, Admin: ${isAdmin}`);
            
            return {
              name: module.name,
              module_id: module.id,
              is_admin: isAdmin,
              is_enabled: isEnabled,
              access_level: {
                isAdmin: isAdmin
              }
            };
          });
          
          setModuleAccessState(initialModuleAccess);
          console.log("Initial module access state:", initialModuleAccess);
        }
      } catch (error) {
        console.error("Error in fetchClientModules:", error);
        toast.error("Error loading modules");
      } finally {
        setLoading(false);
      }
    };

    fetchClientModules();
  }, []); // Only run on initial mount

  // Sync local state to parent component when moduleAccessState changes
  useEffect(() => {
    // Skip on initial render
    if (moduleAccessState.length === 0) return;
    
    // Convert moduleAccessState to ModulePermissions format for parent
    const updatedPermissions: Partial<ModulePermissions> = {};
    
    moduleAccessState.forEach(module => {
      const accessKey = getAccessKeyFromModuleName(module.name);
      updatedPermissions[accessKey as keyof ModulePermissions] = module.is_enabled;
      
      // If this is an admin module and it's enabled, set the corresponding admin permission
      if (module.is_admin) {
        const adminKey = accessKey.endsWith('Admin') ? 
          accessKey : 
          (accessKey + 'Admin') as keyof ModulePermissions;
          
        if (Object.keys(formData.moduleAccess).includes(adminKey)) {
          updatedPermissions[adminKey as keyof ModulePermissions] = true;
        }
      }
    });
    
    // Compare with formData to avoid unnecessary updates
    const hasChanges = Object.entries(updatedPermissions).some(
      ([key, value]) => formData.moduleAccess[key as keyof ModulePermissions] !== value
    );
    
    if (hasChanges) {
      console.log("Module access state changed, updating parent:", updatedPermissions);
      Object.entries(updatedPermissions).forEach(([key, value]) => {
        handleModuleAccessChange(key as keyof ModulePermissions, !!value);
      });
    }
  }, [moduleAccessState]);

  // Known module access keys from the ModulePermissions type
  const knownAccessKeys = [
    'superAdmin', 
    'incidentReporting', 
    'incidentAdmin', 
    'assessmentUser', 
    'assessmentsAdmin', 
    'employeeVerificationAdmin', 
    'grievancesAdmin', 
    'transportSafetyAdmin', 
    'eduSafeResourceAccess'
  ];

  // Helper function to map module names to formData.moduleAccess keys
  const getAccessKeyFromModuleName = (moduleName: string): keyof ModulePermissions => {
    // Convert module name to camelCase for matching with ModulePermissions keys
    const key = moduleName.toLowerCase()
      .replace(/\s(.)/g, ($1) => $1.toUpperCase())
      .replace(/\s/g, '')
      .replace(/^(.)/, ($1) => $1.toLowerCase());
      
    // Find if there's an admin version of this key
    const adminKey = `${key}Admin`;
    
    // Check if these keys exist in the known access keys list
    if (knownAccessKeys.includes(adminKey as string)) {
      return adminKey as keyof ModulePermissions;
    }
    
    if (knownAccessKeys.includes(key as string)) {
      return key as keyof ModulePermissions;
    }
    
    // Default fallback - should be avoided in production
    return 'superAdmin';
  };

  // Handle clicking on the module checkbox
  const handleModuleCheckboxChange = (moduleId: string, checked: boolean) => {
    const moduleToUpdate = moduleAccessState.find(m => m.module_id === moduleId);
    if (!moduleToUpdate) return;
    
    console.log(`Module checkbox change - Name: ${moduleToUpdate.name}, ID: ${moduleId}, Checked: ${checked}`);
    
    // Update only the is_enabled state for this specific module
    setModuleAccessState(prev => 
      prev.map(m => 
        m.module_id === moduleId 
          ? { 
              ...m, 
              is_enabled: checked,
              access_level: {
                ...m.access_level,
                isEnabled: checked
              }
            } 
          : m
      )
    );
    
    console.log(`Updated module ${moduleToUpdate.name} (${moduleId}) enabled state to ${checked}`);
  };

  // Handle clicking on the admin badge
  const handleAdminBadgeClick = (moduleId: string) => {
    const moduleToUpdate = moduleAccessState.find(m => m.module_id === moduleId);
    if (!moduleToUpdate) return;
    
    console.log(`Admin badge click - Name: ${moduleToUpdate.name}, ID: ${moduleId}, Current admin: ${moduleToUpdate.is_admin}`);
    
    // Toggle the admin access state for this module
    setModuleAccessState(prev => 
      prev.map(m => 
        m.module_id === moduleId 
          ? { 
              ...m, 
              is_admin: !m.is_admin,
              access_level: {
                ...m.access_level,
                isAdmin: !m.is_admin
              }
            } 
          : m
      )
    );
    
    console.log(`Toggled admin status for module ${moduleToUpdate.name} (${moduleId}) to ${!moduleToUpdate.is_admin}`);
  };

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
                  <TableHead className="w-[100px]">Enable</TableHead>
                  <TableHead>Module Name</TableHead>
                  <TableHead className="w-[120px]">Access Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map((module) => {
                  const moduleAccess = moduleAccessState.find(m => m.module_id === module.id);
                  const moduleEnabled = moduleAccess?.is_enabled || false;
                  const isAdminEnabled = moduleAccess?.is_admin || false;
                  
                  return (
                    <TableRow key={module.id} className="h-14">
                      <TableCell>
                        <Checkbox 
                          id={`module-${module.id}`}
                          checked={moduleEnabled}
                          onCheckedChange={(checkedState) => {
                            handleModuleCheckboxChange(module.id, checkedState === true);
                          }}
                          className="transition-all"
                        />
                      </TableCell>
                      <TableCell>
                        <label 
                          htmlFor={`module-${module.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {module.name}
                        </label>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isAdminEnabled ? "default" : "outline"}
                          className={cn(
                            "relative pr-7 transition-all duration-200 cursor-pointer",
                            isAdminEnabled 
                              ? "bg-green-500 text-white hover:bg-green-600" 
                              : "text-muted-foreground hover:bg-gray-100"
                          )}
                          onClick={() => handleAdminBadgeClick(module.id)}
                        >
                          Admin
                          {isAdminEnabled && (
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
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
