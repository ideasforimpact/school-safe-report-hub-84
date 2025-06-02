
import React, { useState, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
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
  level?: Record<string, any>;
}

export interface ModuleInfo {
  name: string;
  module_id: string;
  is_admin: boolean;
}

interface ModuleAccessTabProps {
  formData: {
    moduleInfoArray?: ModuleInfo[];
  };
  onModuleInfoChange?: (moduleInfoArray: ModuleInfo[]) => void;
  isEdit?: boolean;
  preloadedModules?: ModuleInfo[];
}

const ModuleAccessTab = ({ formData, onModuleInfoChange, isEdit = false, preloadedModules }: ModuleAccessTabProps) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [moduleAccessState, setModuleAccessState] = useState<ModuleAccess[]>([]);
  const [initialized, setInitialized] = useState(false);

  // For new clients, use preloaded modules if available, otherwise fetch
  // For edit clients, always fetch modules from the database
  useEffect(() => {
    const initializeModules = async () => {
      if (isEdit || (!preloadedModules || preloadedModules.length === 0)) {
        // Fetch modules for edit mode or when no preloaded modules
        await fetchClientModules();
      } else {
        // Use preloaded modules for new client creation
        console.log("Using preloaded modules:", preloadedModules);
        // We need to fetch module details to get the full module info
        await fetchModuleDetails(preloadedModules);
      }
    };

    initializeModules();
  }, [isEdit, preloadedModules]);

  const fetchModuleDetails = async (moduleInfoArray: ModuleInfo[]) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-modules', {
        body: { fetchLevel: 'client' }
      });

      if (error) {
        console.error("Error fetching module details:", error);
        toast.error("Failed to load module details");
        return;
      }

      if (data && data.modules) {
        console.log("Module details fetched successfully:", data.modules.length);
        setModules(data.modules);
        
        // Initialize state with preloaded module info
        initializeModuleAccessState(data.modules, moduleInfoArray);
        setInitialized(true);
      }
    } catch (error) {
      console.error("Error in fetchModuleDetails:", error);
      toast.error("Error loading module details");
    } finally {
      setLoading(false);
    }
  };

  // Fetch modules only for edit mode or when no preloaded modules available
  const fetchClientModules = async () => {
    if (modules.length > 0 && !isEdit) return; // Skip if modules are already loaded for new client
    
    console.log("Fetching client modules:", isEdit ? "Edit mode" : "New client fallback");
    setLoading(true);
    try {
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
        
        // Initialize with existing formData or defaults
        initializeModuleAccessState(data.modules, formData.moduleInfoArray);
        setInitialized(true);
      }
    } catch (error) {
      console.error("Error in fetchClientModules:", error);
      toast.error("Error loading modules");
    } finally {
      setLoading(false);
    }
  };
  
  // Initialize module access state based on moduleInfoArray or set defaults
  const initializeModuleAccessState = (availableModules: Module[], existingModuleInfo?: ModuleInfo[]) => {
    console.log("Initializing module access state with:", { 
      existingModuleInfo,
      isEdit: isEdit,
      availableModulesCount: availableModules.length
    });
    
    let initialModuleAccess: ModuleAccess[] = [];
    
    // If moduleInfoArray is available and not empty, use it first (it's more specific)
    if (existingModuleInfo && existingModuleInfo.length > 0) {
      console.log("Using existing moduleInfo to initialize module states");
      
      // Create a map of module info by module_id for quick lookup
      const moduleInfoMap = new Map<string, ModuleInfo>();
      existingModuleInfo.forEach(info => {
        moduleInfoMap.set(info.module_id, info);
      });
      
      initialModuleAccess = availableModules.map(module => {
        const moduleInfo = moduleInfoMap.get(module.id);
        
        // If module is in moduleInfoArray, it's enabled
        const isEnabled = !!moduleInfo;
        const isAdmin = moduleInfo ? moduleInfo.is_admin : false;
        
        return {
          name: module.name,
          module_id: module.id,
          is_admin: isAdmin,
          is_enabled: isEnabled,
          level: {
            isAdmin: isAdmin,
            isEnabled: isEnabled
          }
        };
      });
    }
    // For new client creation without preloaded data, enable all modules with admin access by default
    else if (!isEdit) {
      console.log("No existing moduleInfo provided, enabling all modules with admin access by default");
      initialModuleAccess = availableModules.map((module: Module) => {
        return {
          name: module.name,
          module_id: module.id,
          is_admin: true, // Set all as admin by default
          is_enabled: true, // Enable all modules by default
          level: {
            isAdmin: true,
            isEnabled: true
          }
        };
      });
    }
    // For edit mode without existing data, start with all disabled
    else {
      console.log("Edit mode with no existing module data, starting with all disabled");
      initialModuleAccess = availableModules.map((module: Module) => {
        return {
          name: module.name,
          module_id: module.id,
          is_admin: false,
          is_enabled: false,
          level: {
            isAdmin: false,
            isEnabled: false
          }
        };
      });
    }
    
    setModuleAccessState(initialModuleAccess);
    console.log("Initial module access state:", initialModuleAccess);
    
    // Immediately notify parent component with the initial state
    if (onModuleInfoChange && initialModuleAccess.length > 0) {
      const moduleInfoArray: ModuleInfo[] = initialModuleAccess
        .filter(module => module.is_enabled)
        .map(module => ({
          name: module.name,
          module_id: module.module_id,
          is_admin: module.is_admin
        }));
      
      console.log("Notifying parent with initial module info array:", moduleInfoArray);
      onModuleInfoChange(moduleInfoArray);
    }
  };

  // Sync local state to parent component when moduleAccessState changes
  useEffect(() => {
    // Skip on initial render or when not initialized
    if (moduleAccessState.length === 0 || !initialized) return;
    
    // If onModuleInfoChange callback is provided, use it to update parent
    if (onModuleInfoChange) {
      const moduleInfoArray: ModuleInfo[] = moduleAccessState
        .filter(module => module.is_enabled)
        .map(module => ({
          name: module.name,
          module_id: module.module_id,
          is_admin: module.is_admin
        }));
      console.log("Updating parent with module info array:", moduleInfoArray);
      onModuleInfoChange(moduleInfoArray);
    }
  }, [moduleAccessState, initialized, onModuleInfoChange]);

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
              level: {
                ...m.level,
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
              level: {
                ...m.level,
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
