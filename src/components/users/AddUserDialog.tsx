
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeeType, DepartmentType } from '@/contexts/auth/types';
import { Loader2, Check, X } from 'lucide-react';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { ModuleAccessItem } from '@/types/moduleAccess';
import ModuleAccess from './form/ModuleAccess';
import { checkEmployeeIdExists } from '@/services/employee/employeeValidationService';
import { useDebounce } from '@/hooks/useDebounce';

interface AddUserDialogProps {
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
    clientId?: string;
  };
  setFormData: (data: any) => void;
  onSubmit: () => void;
  resetForm: () => void;
  isLoading: boolean;
  clientId?: string;
}

type EmployeeIdValidationStatus = 'idle' | 'checking' | 'available' | 'exists' | 'error';

const AddUserDialog = ({ isOpen, setIsOpen, formData, setFormData, onSubmit, resetForm, isLoading, clientId }: AddUserDialogProps) => {
  const { state } = useEmployeeStore();
  const [selectedModules, setSelectedModules] = useState<ModuleAccessItem[]>([]);
  const [employeeIdValidation, setEmployeeIdValidation] = useState<EmployeeIdValidationStatus>('idle');
  
  // Debounce the employee ID to avoid excessive API calls
  const debouncedEmployeeId = useDebounce(formData.employeeId || '', 500);

  // Log clientId for debugging
  console.log("AddUserDialog - ClientId from props:", clientId);
  console.log("AddUserDialog - ClientId in formData:", formData.clientId);
  console.log("AddUserDialog - Available configured modules:", state.configuredModules);

  // Validate Employee ID when it changes
  useEffect(() => {
    const validateEmployeeId = async () => {
      if (!debouncedEmployeeId || !clientId) {
        setEmployeeIdValidation('idle');
        return;
      }

      setEmployeeIdValidation('checking');
      
      try {
        const exists = await checkEmployeeIdExists(debouncedEmployeeId, clientId);
        setEmployeeIdValidation(exists ? 'exists' : 'available');
      } catch (error) {
        console.error('Error validating employee ID:', error);
        setEmployeeIdValidation('error');
      }
    };

    validateEmployeeId();
  }, [debouncedEmployeeId, clientId]);

  // Module change handler that directly updates moduleAccessPayload
  const handleModuleChange = (moduleAccessItems: ModuleAccessItem[]) => {
    console.log("Module access items changed:", moduleAccessItems);
    
    // Update local state for UI rendering
    setSelectedModules(moduleAccessItems);
    
    // Update formData with ONLY the moduleAccessPayload
    setFormData({
      ...formData,
      moduleAccessPayload: moduleAccessItems
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
    setSelectedModules([]);
    setEmployeeIdValidation('idle');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if employee ID already exists
    if (employeeIdValidation === 'exists') {
      return;
    }
    
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
    
    // Update the formData with the moduleAccessPayload before submission
    setFormData(prevData => ({
      ...prevData,
      moduleAccessPayload
    }));
    
    // Submit the form after a short delay to ensure state is updated
    setTimeout(() => {
      onSubmit();
    }, 0);
  };

  // Helper function to get validation icon
  const getEmployeeIdValidationIcon = () => {
    switch (employeeIdValidation) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'available':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'exists':
        return <X className="h-4 w-4 text-red-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Helper function to get validation message
  const getEmployeeIdValidationMessage = () => {
    switch (employeeIdValidation) {
      case 'checking':
        return 'Checking availability...';
      case 'available':
        return 'Employee ID is available';
      case 'exists':
        return 'Employee ID already exists for this client';
      case 'error':
        return 'Error checking Employee ID';
      default:
        return '';
    }
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

  // Phone validation (E.164 basic or 10-15 digits allowing +, space, hyphen)
  // Phone validation (digits only, exactly 10 digits)
  const isValidPhone = (phone: string) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  // Name validation function (letters and spaces only, no special characters)
  const isValidName = (name: string) => {
    const nameRegex = /^[a-zA-Z\s]{1,25}$/;
    return nameRegex.test(name);
  };

  const isValidDesignation = (name: string) => {
    const nameRegex = /^[a-zA-Z\s]{0,25}$/;
    return nameRegex.test(name);
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    const hasValidEmail = !formData.email || isValidEmail(formData.email);
    return (
      formData.firstName &&
      formData.firstName.length <= 25 &&
      isValidName(formData.firstName) &&
      formData.lastName &&
      formData.lastName.length <= 25 &&
      isValidName(formData.lastName) &&
      hasValidEmail &&
      (!formData.phone || isValidPhone(formData.phone)) &&
      (!formData.designation || isValidDesignation(formData.designation)) &&
      formData.employeeId &&
      isValidEmployeeId(formData.employeeId) &&
      employeeIdValidation === 'available' &&
      !isLoading
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
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
                placeholder="10-digit mobile number"
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
                placeholder="e.g. Admin Officer"
                maxLength={25}
              />
              {formData.designation && !isValidDesignation(formData.designation) && (
                <p className="text-xs text-red-500">Only letters and spaces, max 25 characters</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    id="employeeId"
                    value={formData.employeeId || ''}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    maxLength={15}
                    className={`pr-10 ${
                      employeeIdValidation === 'exists' ? 'border-red-500 focus:border-red-500' :
                      employeeIdValidation === 'available' ? 'border-green-500 focus:border-green-500' : ''
                    }`}
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getEmployeeIdValidationIcon()}
                  </div>
                </div>
                {employeeIdValidation !== 'idle' && (
                  <p className={`text-xs ${
                    employeeIdValidation === 'exists' || employeeIdValidation === 'error' ? 'text-red-500' :
                    employeeIdValidation === 'available' ? 'text-green-500' : 'text-blue-500'
                  }`}>
                    {getEmployeeIdValidationMessage()}
                  </p>
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

            {/* Hidden input for clientId */}
            <input 
              type="hidden" 
              id="clientId" 
              name="clientId" 
              value={formData.clientId || clientId || ''} 
            />

            {/* Module Access Section - only when email provided */}
            {formData.email && (
              <div className="space-y-2">
                <Label>Module Access</Label>
                <ModuleAccess
                  selectedModules={selectedModules}
                  onModuleChange={handleModuleChange}
                  employeeId={formData.employeeId}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isFormValid() || employeeIdValidation === 'checking'}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;
