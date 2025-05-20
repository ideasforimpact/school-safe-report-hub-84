
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeeType, DepartmentType } from '@/contexts/auth/types';
import { Loader2 } from 'lucide-react';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { ModuleAccessItem } from '@/types/moduleAccess';
import ModuleAccess from './form/ModuleAccess';

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
    clientId?: string;
  };
  setFormData: (data: any) => void;
  onSubmit: () => void;
  resetForm: () => void;
  isLoading: boolean;
  clientId?: string;
}

const EditUserDialog = ({ isOpen, setIsOpen, formData, setFormData, onSubmit, resetForm, isLoading, clientId }: EditUserDialogProps) => {
  const { state } = useEmployeeStore();
  const [selectedModules, setSelectedModules] = useState<ModuleAccessItem[]>([]);

  // When dialog opens, set the selectedModules based on the form data
  useEffect(() => {
    if (isOpen && formData) {
      // Check if moduleAccessPayload exists and is an array
      if (formData.moduleAccessPayload && Array.isArray(formData.moduleAccessPayload)) {
        console.log("Setting selected modules from formData:", formData.moduleAccessPayload);
        setSelectedModules(formData.moduleAccessPayload);
      } else {
        console.log("No moduleAccessPayload found in formData or it's not an array");
        setSelectedModules([]);
      }
      
      // Ensure clientId is set in formData
      if (!formData.clientId && clientId) {
        setFormData({
          ...formData,
          clientId: clientId
        });
      }
    }
  }, [isOpen, formData, setFormData, clientId]);

  // Module change handler that directly updates moduleAccessPayload
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
    setSelectedModules([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure clientId is set before submission
    if (!formData.clientId && clientId) {
      setFormData({
        ...formData,
        clientId: clientId
      });
    }
    
    // Use the selectedModules directly for backend processing
    const moduleAccessPayload = selectedModules.map(module => ({
      ...module,
      employeeId: formData.employeeId || undefined
    }));
    
    console.log("Module access payload for backend:", moduleAccessPayload);
    
    // Update formData with the moduleAccessPayload before submission
    setFormData(prevData => ({
      ...prevData,
      moduleAccessPayload
    }));
    
    onSubmit();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
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
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId || ''}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  disabled={true}  // Disable editing employee ID
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
                    <SelectItem value="intern">Intern</SelectItem>
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
                    <SelectItem value="it">IT</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Hidden input for clientId */}
            <input 
              type="hidden" 
              id="clientId" 
              name="clientId" 
              value={formData.clientId || clientId || ''} 
            />

            {/* Module Access Section */}
            <div className="space-y-4">
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
