
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Check } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { updateEmployeeModulePermissions, forceRefreshEmployeeModules } from '@/services/employee/employeeModuleService';

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
    id?: string;
    moduleInfoArray?: ModuleInfo[];
  };
  onModuleInfoChange?: (moduleInfoArray: ModuleInfo[]) => void;
  isEdit?: boolean;
  preloadedModules?: ModuleInfo[];
}

// Debounce utility function
const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};

const ModuleAccessTab = ({ formData, onModuleInfoChange, isEdit = false, preloadedModules }: ModuleAccessTabProps) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [moduleAccessState, setModuleAccessState] = useState<ModuleAccess[]>([]);
  
  // Refs to prevent infinite loops
  const initializedRef = useRef(false);
  const isUpdatingRef = useRef(false);
  const mountedRef = useRef(true);

  // Debounced update function
  const debouncedUpdate = useDebounce(async (moduleInfoArray: ModuleInfo[]) => {
    if (onModuleInfoChange && !isUpdatingRef.current && mountedRef.current) {
      isUpdatingRef.current = true;
      onModuleInfoChange(moduleInfoArray);
      
      // Force refresh modules for the employee to update their session
      if (formData?.id) {
        await forceRefreshEmployeeModules(formData.id);
      }
      
      // Reset the flag after a short delay
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  }, 300);

  // Memoized module info array to prevent unnecessary updates
  const currentModuleInfoArray = useMemo(() => {
    return moduleAccessState
      .filter(module => module.is_enabled)
      .map(module => ({
        name: module.name,
        module_id: module.module_id,
        is_admin: module.is_admin
      }));
  }, [moduleAccessState]);

  // Fetch modules function - simplified and isolated
  const fetchModules = useCallback(async () => {
    if (loading) return;
    
    console.log("Fetching modules...");
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

      // Support multiple response shapes from edge function
      // Either { modules: [...] } or direct array [...]
      console.log(mountedRef.current,"mountedRef.current");
      
      const fetchedModules: Module[] = (data && (data.modules || data)) || [];
      console.log("Modules fetched successfully (count):", fetchedModules.length);
      setModules(Array.isArray(fetchedModules) ? fetchedModules : []);
    } catch (error) {
      console.error("Error in fetchModules:", error);
      toast.error("Error loading modules");
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Initialize module access state - called after modules are set
  const initializeModuleAccessState = useCallback((availableModules: Module[], existingModuleInfo?: ModuleInfo[]) => {
    if (!mountedRef.current || initializedRef.current || availableModules.length === 0) return;

    console.log("Initializing module access state with modules:", availableModules.length);
    
    let initialModuleAccess: ModuleAccess[] = [];
    
    if (existingModuleInfo && existingModuleInfo.length > 0) {
      // Use existing module info for edit mode or preloaded data
      console.log("Using existing module info:", existingModuleInfo);
      const moduleInfoMap = new Map<string, ModuleInfo>();
      existingModuleInfo.forEach(info => {
        moduleInfoMap.set(info.module_id, info);
      });
      
      initialModuleAccess = availableModules.map(module => {
        const moduleInfo = moduleInfoMap.get(module.id);
        const isEnabled = !!moduleInfo;
        const isAdmin = moduleInfo ? moduleInfo.is_admin : false;
        
        return {
          name: module.name,
          module_id: module.id,
          is_admin: isAdmin,
          is_enabled: isEnabled,
          level: { isAdmin, isEnabled }
        };
      });
    } else if (!isEdit) {
      // For new clients, enable all modules with admin access by default
      console.log("Setting up default modules for new client");
      initialModuleAccess = availableModules.map((module: Module) => ({
        name: module.name,
        module_id: module.id,
        is_admin: true,
        is_enabled: true,
        level: { isAdmin: true, isEnabled: true }
      }));
    } else {
      // For edit mode without existing data, start with all disabled
      console.log("Setting up empty modules for edit mode");
      initialModuleAccess = availableModules.map((module: Module) => ({
        name: module.name,
        module_id: module.id,
        is_admin: false,
        is_enabled: false,
        level: { isAdmin: false, isEnabled: false }
      }));
    }
    
    console.log("Setting module access state:", initialModuleAccess);
    setModuleAccessState(initialModuleAccess);
    initializedRef.current = true;

    // Notify parent with initial state
    if (initialModuleAccess.length > 0) {
      const moduleInfoArray = initialModuleAccess
        .filter(module => module.is_enabled)
        .map(module => ({
          name: module.name,
          module_id: module.module_id,
          is_admin: module.is_admin
        }));
      
      console.log("Notifying parent with initial module info:", moduleInfoArray);
      debouncedUpdate(moduleInfoArray);
    }
  }, [isEdit, debouncedUpdate]);

  // Effect to fetch modules on mount
  useEffect(() => {
    console.log("Mount effect - fetching modules");
    mountedRef.current = true;
    fetchModules();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Effect to initialize state when modules are available
  useEffect(() => {
    if (!mountedRef.current) return;
    if (modules.length > 0 && !initializedRef.current) {
      console.log("Modules available, initializing state...");
      const moduleInfoToUse = preloadedModules || formData.moduleInfoArray;
      initializeModuleAccessState(modules, moduleInfoToUse);
    }
  }, [modules, preloadedModules, formData.moduleInfoArray, initializeModuleAccessState]);

  // Effect to sync state changes to parent (with debouncing)
  useEffect(() => {
    if (initializedRef.current && moduleAccessState.length > 0 && !isUpdatingRef.current) {
      console.log("Syncing state changes to parent:", currentModuleInfoArray);
      debouncedUpdate(currentModuleInfoArray);
    }
  }, [currentModuleInfoArray, debouncedUpdate]);

  // Handle module checkbox changes
  const handleModuleCheckboxChange = useCallback((moduleId: string, checked: boolean) => {
    if (!mountedRef.current) return;
    
    console.log("Module checkbox changed:", moduleId, checked);
    setModuleAccessState(prev => 
      prev.map(m => 
        m.module_id === moduleId 
          ? { 
              ...m, 
              is_enabled: checked,
              level: { ...m.level, isEnabled: checked }
            } 
          : m
      )
    );
  }, []);


  console.log("Render state:", { 
    loading, 
    modulesCount: modules.length, 
    moduleAccessCount: moduleAccessState.length,
    initialized: initializedRef.current
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="font-medium text-lg">Module Access</label>
        
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 text-primary animate-spin mr-2" />
            <p className="text-muted-foreground">Loading modules...</p>
          </div>
        ) : modules.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">No modules available</p>
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
                            "relative pr-7 transition-all duration-200 cursor-not-allowed opacity-60",
                            isAdminEnabled 
                              ? "bg-green-500 text-white" 
                              : "text-muted-foreground"
                          )}
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
