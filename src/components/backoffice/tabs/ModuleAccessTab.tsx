
import React, { useState, useEffect, useMemo } from 'react';
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ClientModule, AvailableModule, updateClientModule } from '@/services/client/clientService';
import { useToast } from "@/hooks/use-toast"
import { supabase } from '@/integrations/supabase/client';

interface ModuleAccessTabProps {
  client: any;
  modules: ClientModule[];
  availableModules: AvailableModule[];
  onModulesUpdate: () => void;
}

const ModuleAccessTab = ({ client, modules, availableModules, onModulesUpdate }: ModuleAccessTabProps) => {
  const [moduleStates, setModuleStates] = useState<{ [moduleId: string]: boolean }>({});
  const [allModules, setAllModules] = useState<AvailableModule[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch all available modules if not provided
  useEffect(() => {
    const fetchAllModules = async () => {
      if (availableModules && availableModules.length > 0) {
        setAllModules(availableModules);
        return;
      }

      setLoading(true);
      try {
        const { data: modulesData, error } = await supabase
          .from('modules')
          .select('id, name, icon, level, url, order')
          .order('order', { ascending: true, nullsFirst: false });

        if (error) {
          console.error('Error fetching modules:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load modules",
          });
          return;
        }

        setAllModules(modulesData || []);
      } catch (error) {
        console.error('Error fetching modules:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load modules",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAllModules();
  }, [availableModules, toast]);

  useEffect(() => {
    // Initialize module states based on the 'modules' prop
    const initialModuleStates: { [moduleId: string]: boolean } = {};
    modules.forEach(module => {
      initialModuleStates[module.module_id] = module.enabled;
    });
    setModuleStates(initialModuleStates);
  }, [modules]);

  const handleModuleToggle = async (moduleId: string) => {
    const newModuleState = !moduleStates[moduleId];
    setModuleStates({ ...moduleStates, [moduleId]: newModuleState });

    try {
      // Find the client module to update
      const clientModule = modules.find(module => module.module_id === moduleId);

      if (clientModule) {
        // Update the existing client module
        await updateClientModule(clientModule.id, { enabled: newModuleState });
      } else {
        // Create a new client module entry
        const { error } = await supabase
          .from('client_modules')
          .insert({
            client_id: client.id,
            module_id: moduleId,
            enabled: newModuleState,
            access_level: {}
          });

        if (error) {
          throw new Error(error.message);
        }
      }

      toast({
        title: "Success",
        description: `Module ${newModuleState ? 'enabled' : 'disabled'} successfully.`,
      });

      // Refresh modules
      onModulesUpdate();
    } catch (error: any) {
      console.error("Error updating module:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update module: ${error.message}`,
      });
      // Revert the toggle on error
      setModuleStates({ ...moduleStates, [moduleId]: !newModuleState });
    }
  };

  const sortedModules = useMemo(() => {
    return [...allModules].sort((a, b) => {
      const orderA = a.order || 999;
      const orderB = b.order || 999;
      return orderA - orderB;
    });
  }, [allModules]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading modules...</p>
        </div>
      </div>
    );
  }

  if (sortedModules.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No modules available</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Module Access</h2>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {sortedModules.map((module) => {
          const isModuleEnabled = moduleStates[module.id] ?? false;
          return (
            <div key={module.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-md shadow-sm">
              <div className="flex-1">
                <Label htmlFor={`module-${module.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {module.name}
                </Label>
                {module.level && (
                  <p className="text-xs text-gray-500 mt-1">Level: {module.level}</p>
                )}
              </div>
              <Switch
                id={`module-${module.id}`}
                checked={isModuleEnabled}
                onCheckedChange={() => handleModuleToggle(module.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ModuleAccessTab;
