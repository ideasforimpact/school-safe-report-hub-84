import React, { useState, useEffect, useMemo } from 'react';
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ClientModule, AvailableModule } from '@/services/client/clientService';
import { useToast } from "@/hooks/use-toast"
import { updateClientModule } from '@/services/client/clientService';

interface ModuleAccessTabProps {
  client: any;
  modules: ClientModule[];
  availableModules: AvailableModule[];
  onModulesUpdate: () => void;
}

const ModuleAccessTab = ({ client, modules, availableModules, onModulesUpdate }: ModuleAccessTabProps) => {
  const [moduleStates, setModuleStates] = useState<{ [moduleId: string]: boolean }>({});
  const { toast } = useToast();

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
        // Update the client module
        await updateClientModule(clientModule.id, { enabled: newModuleState });

        toast({
          title: "Success",
          description: `Module ${newModuleState ? 'enabled' : 'disabled'} successfully.`,
        });

        // Refresh modules
        onModulesUpdate();
      } else {
        throw new Error("Client module not found");
      }
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

  const sortedAvailableModules = useMemo(() => {
    return [...availableModules].sort((a, b) => {
      const orderA = a.order || 999;
      const orderB = b.order || 999;
      return orderA - orderB;
    });
  }, [availableModules]);

  const sortedClientModules = useMemo(() => {
    return [...modules].sort((a, b) => {
      const orderA = a.modules?.order || 999;
      const orderB = b.modules?.order || 999;
      return orderA - orderB;
    });
  }, [modules]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Module Access</h2>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {sortedAvailableModules.map((module) => {
          const isModuleEnabled = moduleStates[module.id] ?? false;
          return (
            <div key={module.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-md shadow-sm">
              <Label htmlFor={`module-${module.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {module.name}
              </Label>
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
