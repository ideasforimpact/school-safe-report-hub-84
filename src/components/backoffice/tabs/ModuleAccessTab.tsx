
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

interface ModuleAccessTabProps {
  formData: {
    moduleAccess: Partial<ModulePermissions>;
  };
  handleModuleAccessChange: (module: keyof ModulePermissions, value: boolean) => void;
}

const ModuleAccessTab = ({ formData, handleModuleAccessChange }: ModuleAccessTabProps) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  // Track admin access separately from module access
  const [adminAccess, setAdminAccess] = useState<Record<string, boolean>>({});
  // Store the module access state locally to avoid unnecessary API calls
  const [moduleAccessState, setModuleAccessState] = useState<Partial<ModulePermissions>>({});

  // Fetch modules only once during initial load
  useEffect(() => {
    const fetchClientModules = async () => {
      if (modules.length > 0) return; // Skip if modules are already loaded
      
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
          
          // Initialize local state based on formData
          setModuleAccessState({...formData.moduleAccess});
          
          // Initialize admin access state
          const initialAdminAccess: Record<string, boolean> = {};
          data.modules.forEach((module: Module) => {
            const accessKey = getAccessKeyFromModuleName(module.name);
            initialAdminAccess[accessKey] = !!formData.moduleAccess[accessKey];
          });
          setAdminAccess(initialAdminAccess);
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
    if (Object.keys(moduleAccessState).length === 0) return;
    
    // Compare with formData to avoid unnecessary updates
    const hasChanges = Object.entries(moduleAccessState).some(
      ([key, value]) => formData.moduleAccess[key as keyof ModulePermissions] !== value
    );
    
    if (hasChanges) {
      Object.entries(moduleAccessState).forEach(([key, value]) => {
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
  const handleModuleCheckboxChange = (accessKey: keyof ModulePermissions, checked: boolean) => {
    // Update only local state for this specific module
    setModuleAccessState(prev => ({
      ...prev,
      [accessKey]: checked
    }));
  };

  // Handle clicking on the admin badge
  const handleAdminBadgeClick = (accessKey: keyof ModulePermissions) => {
    // Toggle the admin access state for this module
    const newState = !adminAccess[accessKey];
    setAdminAccess(prev => ({
      ...prev,
      [accessKey]: newState
    }));
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
                  const accessKey = getAccessKeyFromModuleName(module.name);
                  // Use local state for module status
                  const moduleEnabled = moduleAccessState[accessKey] || false;
                  const isAdminEnabled = adminAccess[accessKey] || false;
                  
                  return (
                    <TableRow key={module.id} className="h-14">
                      <TableCell>
                        <Checkbox 
                          id={`module-${accessKey}`}
                          checked={moduleEnabled}
                          onCheckedChange={(checkedState) => {
                            handleModuleCheckboxChange(accessKey, checkedState === true);
                          }}
                          className="transition-all"
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
                        <Badge
                          variant={isAdminEnabled ? "default" : "outline"}
                          className={cn(
                            "relative pr-7 transition-all duration-200 cursor-pointer",
                            isAdminEnabled 
                              ? "bg-green-500 text-white hover:bg-green-600" 
                              : "text-muted-foreground hover:bg-gray-100"
                          )}
                          onClick={() => handleAdminBadgeClick(accessKey)}
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
