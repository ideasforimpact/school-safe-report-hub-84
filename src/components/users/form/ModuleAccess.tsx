
import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { ModuleAccessItem } from '@/types/moduleAccess';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ModuleAccessProps {
  selectedModules: ModuleAccessItem[];
  onModuleChange: (modules: ModuleAccessItem[]) => void;
  employeeId?: string;
}

const ModuleAccess: React.FC<ModuleAccessProps> = ({ 
  selectedModules, 
  onModuleChange,
  employeeId 
}) => {
  const [availableModules, setAvailableModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [moduleAccessLevels, setModuleAccessLevels] = useState<Record<string, any>>({});

  // Fetch available modules on component mount
  useEffect(() => {
    const fetchAvailableModules = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('fetch-modules', {
          body: { fetchLevel: 'client' }
        });

        if (error) {
          console.error('Error fetching modules:', error);
          return;
        }

        if (data && data.modules) {
          console.log('Available modules:', data.modules);
          setAvailableModules(data.modules);
        }
      } catch (error) {
        console.error('Failed to fetch modules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableModules();
  }, []);

  // Fetch employee module access levels if an employeeId is provided
  useEffect(() => {
    const fetchEmployeeModuleAccess = async () => {
      if (!employeeId) return;
      
      try {
        const { data, error } = await supabase
          .from('employee_modules')
          .select('module_id, access_level')
          .eq('employee_id', employeeId);
          
        if (error) {
          console.error('Error fetching employee module access:', error);
          return;
        }
        
        // Create a map of module_id to access_level
        const accessLevelMap: Record<string, any> = {};
        if (data) {
          data.forEach(item => {
            accessLevelMap[item.module_id] = item.access_level || { isAdmin: false, is_admin: false, isEnabled: true };
          });
          setModuleAccessLevels(accessLevelMap);
          console.log('Fetched module access levels:', accessLevelMap);
        }
      } catch (error) {
        console.error('Error in fetchEmployeeModuleAccess:', error);
      }
    };
    
    fetchEmployeeModuleAccess();
  }, [employeeId]);

  // Check if a module is selected
  const isModuleSelected = (moduleId: string): boolean => {
    return selectedModules.some(module => module.module_id === moduleId);
  };

  // Check if a module has admin access
  const hasAdminAccess = (moduleId: string): boolean => {
    // First check if the module exists in selected modules
    const module = selectedModules.find(module => module.module_id === moduleId);
    
    if (module) {
      // If the module exists in selected modules, check its access_level
      if (module.access_level) {
        return !!(module.access_level.is_admin || module.access_level.isAdmin);
      }
    }
    
    // If module not found in selectedModules or no access_level, check moduleAccessLevels from DB
    if (moduleAccessLevels[moduleId]) {
      return !!(moduleAccessLevels[moduleId].is_admin || moduleAccessLevels[moduleId].isAdmin);
    }
    
    // Default to false if no admin access found
    return false;
  };

  // Toggle module selection
  const handleModuleToggle = (checked: boolean, module: any) => {
    if (checked) {
      // Add module to selected modules if it doesn't exist
      if (!isModuleSelected(module.id)) {
        // Use existing access_level from the database if available
        const existingAccessLevel = moduleAccessLevels[module.id] || { is_admin: false, isAdmin: false, isEnabled: true };
        
        const newModule: ModuleAccessItem = {
          name: module.name,
          key: module.key || module.id,
          module_id: module.id,
          employeeId,
          access_level: existingAccessLevel
        };
        onModuleChange([...selectedModules, newModule]);
      }
    } else {
      // Remove module from selected modules
      onModuleChange(selectedModules.filter(m => m.module_id !== module.id));
    }
  };

  // Toggle admin access for a module
  const handleAdminToggle = (moduleId: string) => {
    const updatedModules = selectedModules.map(module => {
      if (module.module_id === moduleId) {
        // Get existing access_level or create default
        const existingAccessLevel = module.access_level || 
                                  moduleAccessLevels[moduleId] || 
                                  { is_admin: false, isAdmin: false, isEnabled: true };
        
        // Toggle the admin status
        const isAdmin = !(existingAccessLevel.is_admin || existingAccessLevel.isAdmin);
        
        return {
          ...module,
          access_level: {
            ...existingAccessLevel,
            is_admin: isAdmin,
            isAdmin: isAdmin
          }
        };
      }
      return module;
    });

    onModuleChange(updatedModules);
  };

  if (loading) {
    return <div>Loading modules...</div>;
  }

  return (
    <div className="space-y-4">
      {availableModules.map((module) => (
        <div key={module.id} className="flex items-center justify-between border p-3 rounded-md">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`module-${module.id}`}
              checked={isModuleSelected(module.id)}
              onCheckedChange={(checked) => handleModuleToggle(!!checked, module)}
            />
            <Label htmlFor={`module-${module.id}`} className="cursor-pointer">
              {module.name}
            </Label>
          </div>
          
          {isModuleSelected(module.id) && (
            <Badge
              variant={hasAdminAccess(module.id) ? "default" : "outline"}
              className={cn(
                "relative pr-7 transition-all duration-200 cursor-pointer",
                hasAdminAccess(module.id) 
                  ? "bg-green-500 text-white hover:bg-green-600" 
                  : "text-muted-foreground hover:bg-gray-100"
              )}
              onClick={() => handleAdminToggle(module.id)}
            >
              Admin
              {hasAdminAccess(module.id) && (
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </Badge>
          )}
        </div>
      ))}
      
      {availableModules.length === 0 && (
        <div className="text-center p-4 text-muted-foreground">
          No modules available
        </div>
      )}
    </div>
  );
};

export default ModuleAccess;
