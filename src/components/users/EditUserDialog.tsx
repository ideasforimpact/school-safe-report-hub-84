
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeeType, DepartmentType } from '@/contexts/auth/types';
import { Loader2 } from 'lucide-react';
import { ModuleAccessItem } from '@/types/moduleAccess';
import ModuleAccess from './form/ModuleAccess';
import { supabase } from '@/integrations/supabase/client';

interface EditUserDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    employeeId?: string;
    employeeType?: EmployeeType;
    department?: DepartmentType;
    joiningDate?: string;
    moduleAccessPayload?: ModuleAccessItem[];
  };
  setFormData: (data: any) => void;
  onSubmit: () => void;
  resetForm: () => void;
  isLoading: boolean;
  clientId?: string;
}

const EditUserDialog = ({ isOpen, setIsOpen, formData, setFormData, onSubmit, resetForm, isLoading, clientId }: EditUserDialogProps) => {
  const [selectedModules, setSelectedModules] = useState<ModuleAccessItem[]>([]);
  
  // Initialize selected modules from formData when dialog opens
  useEffect(() => {
    if (isOpen && formData.moduleAccessPayload) {
      // Transform moduleAccessPayload to ensure it has proper format
      const formattedModules = formData.moduleAccessPayload.map(module => {
        // Make a deep copy to avoid mutating the original object
        const moduleCopy = { ...module };
        
        // If module doesn't have access_level, check if we need to fetch it from the database
        if (!moduleCopy.access_level && formData.employeeId && moduleCopy.module_id) {
          // We will handle this in the ModuleAccess component by fetching from DB
        } else if (!moduleCopy.access_level) {
          // If no employeeId or still no access_level, provide a default
          moduleCopy.access_level = {
            is_admin: false,
            isAdmin: false,
            isEnabled: true
          };
        }
        
        return moduleCopy;
      });
      
      console.log("Setting selected modules with formatted data:", formattedModules);
      setSelectedModules(formattedModules);
    }
  }, [isOpen, formData.moduleAccessPayload]);

  // Module change handler that updates selectedModules state and formData
  const handleModuleChange = (moduleAccessItems: ModuleAccessItem[]) => {
    console.log("Module access items changed:", moduleAccessItems);
    
    // Update local state for UI rendering
    setSelectedModules(moduleAccessItems);
    
    // Update formData with the moduleAccessPayload
    setFormData({
      ...formData,
      moduleAccessPayload: moduleAccessItems
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure proper formatting of module access data before submission
    const moduleAccessPayload = selectedModules.map(module => {
      // Preserve the existing module structure, including module_id, name, key, etc.
      // Only ensure employeeId is set
      return {
        ...module,
        employeeId: formData.employeeId || undefined
      };
    });
    
    setFormData(prevData => ({
      ...prevData,
      moduleAccessPayload,
      clientId: clientId // Ensure clientId is included
    }));
    
    // Submit the form after a short delay to ensure state is updated
    setTimeout(() => {
      onSubmit();
    }, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                readOnly
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId || ''}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joiningDate">Joining Date</Label>
                <Input
                  id="joiningDate"
                  type="date"
                  value={formData.joiningDate || ''}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeType">Employee Type</Label>
                <Select
                  value={formData.employeeType}
                  onValueChange={(value) => setFormData({ ...formData, employeeType: value as EmployeeType })}
                >
                  <SelectTrigger id="employeeType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="consultant">Consultant</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value as DepartmentType })}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="teaching">Teaching</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Hidden input for clientId */}
            <input 
              type="hidden" 
              id="clientId" 
              name="clientId" 
              value={clientId || ''} 
            />

            {/* Module Access Section */}
            <div className="space-y-2">
              <Label>Module Access</Label>
              <ModuleAccess
                selectedModules={selectedModules}
                onModuleChange={handleModuleChange}
                employeeId={formData.employeeId}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
