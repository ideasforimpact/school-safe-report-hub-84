
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
import { toast } from 'sonner';
import { useEmployeeData } from '@/hooks/useEmployeeData';
import { useEmployeeStore } from '@/store/EmployeeContext';

interface EditUserDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    designation?: string;
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
  currentUser?: any;
}

const EditUserDialog = ({ 
  isOpen, 
  setIsOpen, 
  formData, 
  setFormData, 
  onSubmit, 
  resetForm, 
  isLoading,
  currentUser 
}: EditUserDialogProps) => {
  const [selectedModules, setSelectedModules] = useState<ModuleAccessItem[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const { clientId } = useEmployeeData();
  const { state: employeeState } = useEmployeeStore();
  // Determine super admin flag based on the TARGET user being edited, not the current operator
  const targetIsSuperAdmin = currentUser?.isSuperAdmin === true;
  
  // Initialize selected modules from formData when dialog opens
  useEffect(() => {
    if (isOpen && formData.moduleAccessPayload) {
      setSelectedModules(formData.moduleAccessPayload);
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

  // Email validation function
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Employee ID validation function (alphanumeric, max 15 characters)
  const isValidEmployeeId = (employeeId: string) => {
    const employeeIdRegex = /^[a-zA-Z0-9]{1,15}$/;
    return employeeIdRegex.test(employeeId);
  };

  // Name validation function (letters and spaces only, no special characters)
  const isValidName = (name: string) => {
    const nameRegex = /^[a-zA-Z\s]{1,25}$/;
    return nameRegex.test(name);
  };

  const isValidPhone = (phone: string) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const isValidDesignation = (name: string) => {
    const nameRegex = /^[a-zA-Z\s]{0,25}$/;
    return nameRegex.test(name);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !clientId) {
      toast.error("Missing user or client information");
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const updateData = {
        id: currentUser.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        employeeId: formData.employeeId,
        phone: formData.phone,
        designation: formData.designation,
        employeeType: formData.employeeType,
        department: formData.department,
        moduleAccessPayload: selectedModules,
        clientId: clientId // Ensure clientId is always included
      };
      
      console.log("Updating user with data:", updateData);
      
      // Single API call to update employee with all data including modules
      const { data, error } = await supabase.functions.invoke('employee-management', {
        body: JSON.stringify({
          operation: 'update',
          employee: updateData
        })
      });
      
      if (error) {
        console.error("Edge function error:", error);
        toast.error("Failed to update user");
        return;
      }
      
      if (data && data.error) {
        console.error("Error response from edge function:", data.error);
        toast.error(data.error || "Failed to update user");
        return;
      }
      
      toast.success("User updated successfully");
      handleClose();
      
      // Call the parent's onSubmit for any additional cleanup/refresh
      onSubmit();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 px-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  maxLength={25}
                  required
                  className={formData.firstName && !isValidName(formData.firstName) ? 'border-red-500' : ''}
                />
                {formData.firstName && formData.firstName.length > 25 && (
                  <p className="text-xs text-red-500">First name cannot exceed 25 characters</p>
                )}
                {formData.firstName && !isValidName(formData.firstName) && (
                  <p className="text-xs text-red-500">First name can only contain letters and spaces</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  maxLength={25}
                  required
                  className={formData.lastName && !isValidName(formData.lastName) ? 'border-red-500' : ''}
                />
                {formData.lastName && formData.lastName.length > 25 && (
                  <p className="text-xs text-red-500">Last name cannot exceed 25 characters</p>
                )}
                {formData.lastName && !isValidName(formData.lastName) && (
                  <p className="text-xs text-red-500">Last name can only contain letters and spaces</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                readOnly
              />
              {formData.email && !isValidEmail(formData.email) && (
                <p className="text-xs text-red-500">Please enter a valid email address</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                inputMode="numeric"
                value={formData.phone || ''}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, phone: digitsOnly });
                }}
                maxLength={10}
              />
              {formData.phone && !isValidPhone(formData.phone) && (
                <p className="text-xs text-red-500">Enter a valid 10-digit mobile number</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={formData.designation || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 25);
                  setFormData({ ...formData, designation: value });
                }}
                maxLength={25}
              />
              {formData.designation && !isValidDesignation(formData.designation) && (
                <p className="text-xs text-red-500">Only letters and spaces, max 25 characters</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID <span className="text-red-500">*</span></Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId || ''}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  maxLength={15}
                  required
                  className={formData.employeeId && !isValidEmployeeId(formData.employeeId) ? 'border-red-500' : ''}
                />
                {formData.employeeId && formData.employeeId.length > 15 && (
                  <p className="text-xs text-red-500">Employee ID cannot exceed 15 characters</p>
                )}
                {formData.employeeId && !isValidEmployeeId(formData.employeeId) && (
                  <p className="text-xs text-red-500">Employee ID must be alphanumeric and maximum 15 characters</p>
                )}
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

            {/* Module Access Section - only when email provided */}
            {formData.email && (
              <div className="space-y-2">
                <Label>Module Access</Label>
                <ModuleAccess
                  selectedModules={selectedModules}
                  onModuleChange={handleModuleChange}
                  employeeId={formData.employeeId}
                  isSuperAdmin={targetIsSuperAdmin}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isUpdating || isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating || isLoading}>
              {(isUpdating || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
