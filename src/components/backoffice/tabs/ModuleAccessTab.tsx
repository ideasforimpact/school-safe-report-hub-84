
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  const debouncedUpdate = useDebounce((moduleInfoArray: ModuleInfo[]) => {
    if (onModuleInfoChange && !isUpdatingRef.current && mountedRef.current) {
      isUpdatingRef.current = true;
      onModuleInfoChange(moduleInfoArray);
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

  // Initialize module access state
  const initializeModuleAccessState = useCallback((availableModules: Module[], existingModuleInfo?: ModuleInfo[]) => {
    if (!mountedRef.current || initializedRef.current) return;

    let initialModuleAccess: ModuleAccess[] = [];
    
    if (existingModuleInfo && existingModuleInfo.length > 0) {
      // Use existing module info for edit mode or preloaded data
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
      initialModuleAccess = availableModules.map((module: Module) => ({
        name: module.name,
        module_id: module.id,
        is_admin: true,
        is_enabled: true,
        level: { isAdmin: true, isEnabled: true }
      }));
    } else {
      // For edit mode without existing data, start with all disabled
      initialModuleAccess = availableModules.map((module: Module) => ({
        name: module.name,
        module_id: module.id,
        is_admin: false,
        is_enabled: false,
        level: { isAdmin: false, isEnabled: false }
      }));
    }
    
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
      
      debouncedUpdate(moduleInfoArray);
    }
  }, [isEdit, debouncedUpdate]);

  // Fetch modules function
  const fetchModules = useCallback(async () => {
    if (loading || !mountedRef.current) return;
    
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

      if (data && data.modules && mountedRef.current) {
        setModules(data.modules);
        
        // Determine which module info to use for initialization
        const moduleInfoToUse = preloadedModules || formData.moduleInfoArray;
        initializeModuleAccessState(data.modules, moduleInfoToUse);
      }
    } catch (error) {
      console.error("Error in fetchModules:", error);
      toast.error("Error loading modules");
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [preloadedModules, formData.moduleInfoArray, initializeModuleAccessState, loading]);

  // Main initialization effect
  useEffect(() => {
    if (!initializedRef.current && modules.length === 0) {
      fetchModules();
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchModules]);

  // Sync state changes to parent (with debouncing)
  useEffect(() => {
    if (initializedRef.current && moduleAccessState.length > 0 && !isUpdatingRef.current) {
      debouncedUpdate(currentModuleInfoArray);
    }
  }, [currentModuleInfoArray, debouncedUpdate]);

  // Handle module checkbox changes
  const handleModuleCheckboxChange = useCallback((moduleId: string, checked: boolean) => {
    if (!mountedRef.current) return;
    
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

  // Handle admin badge clicks
  const handleAdminBadgeClick = useCallback((moduleId: string) => {
    if (!mountedRef.current) return;
    
    setModuleAccessState(prev => 
      prev.map(m => 
        m.module_id === moduleId 
          ? { 
              ...m, 
              is_admin: !m.is_admin,
              level: { ...m.level, isAdmin: !m.is_admin }
            } 
          : m
      )
    );
  }, []);

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
