
import React, { useState, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { ModulePermissions } from '@/contexts/auth/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Module {
  id: string;
  name: string;
  key?: string;
  level: string;
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
          setModules(data.modules.filter((module: Module) => module.level !== 'backoffice'));
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

  // Group modules into rows of 3 for better display
  const getGroupedModules = () => {
    const result = [];
    const modulesArray = Object.entries(formData.moduleAccess);
    
    for (let i = 0; i < modulesArray.length; i += 3) {
      result.push(modulesArray.slice(i, i + 3));
    }
    
    return result;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="font-medium text-lg">Module Access</label>
        
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Loading modules...</p>
          </div>
        ) : (
          <>
            {/* Traditional checkboxes layout */}
            <div className="hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Select</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Admin Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(formData.moduleAccess).map(([key, checked]) => (
                    <TableRow key={key}>
                      <TableCell>
                        <Checkbox 
                          id={`module-${key}`}
                          checked={checked}
                          onCheckedChange={(checked) => 
                            handleModuleAccessChange(key as keyof ModulePermissions, checked === true)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </TableCell>
                      <TableCell>
                        <Checkbox 
                          id={`admin-${key}`}
                          checked={key.includes('Admin') && checked}
                          disabled={!checked}
                          onCheckedChange={(adminChecked) => {
                            // Logic for admin privilege can be added here
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Grid layout for better visualization */}
            <div className="grid grid-cols-1 gap-4 mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Select</TableHead>
                    <TableHead>Module Name</TableHead>
                    <TableHead className="w-[120px]">Admin Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(formData.moduleAccess).map(([key, checked]) => {
                    const formattedName = key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, str => str.toUpperCase())
                      .replace(/Admin$/, '');
                    
                    const isAdmin = key.toLowerCase().includes('admin');
                    
                    return (
                      <TableRow key={key} className="h-14">
                        <TableCell>
                          <Checkbox 
                            id={`module-${key}`}
                            checked={checked}
                            onCheckedChange={(checked) => 
                              handleModuleAccessChange(key as keyof ModulePermissions, checked === true)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <label 
                            htmlFor={`module-${key}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {formattedName}
                          </label>
                        </TableCell>
                        <TableCell>
                          {isAdmin ? (
                            <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-1">Admin</span>
                          ) : (
                            <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-1">User</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ModuleAccessTab;
