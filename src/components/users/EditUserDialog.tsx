
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeeType, DepartmentType } from '@/contexts/auth/types';
import { Check, Loader2, X } from 'lucide-react';
import { ModuleAccessItem } from '@/types/moduleAccess';
import ModuleAccess from './form/ModuleAccess';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEmployeeData } from '@/hooks/useEmployeeData';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { NAME_MAX_LENGTH } from '@/services/employee/utils/excelValidationUtils';
import { EMPLOYEE_ID_CONSTANTS, isValidEmployeeId as validateEmployeeId, getEmployeeIdErrorMessage } from '@/constant/employeeConstant';
import { EmailValidationStatus, EmployeeIdValidationStatus } from './AddUserDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { checkEmployeeEmailExists, checkEmployeeIdExists } from '@/services/employee/employeeValidationService';

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
  const [employeeIdValidation, setEmployeeIdValidation] = useState<EmployeeIdValidationStatus>('idle');
  const [emailValidation, setEmailValidation] = useState<EmailValidationStatus>('idle');
  const originalEmployeeIdRef = useRef<string | undefined>(undefined);
  const originalEmployeeEmailRef = useRef<string | undefined>(undefined);
  const debouncedEmployeeId = useDebounce(formData.employeeId || '', 500);
  const debouncedEmployeeEmail = useDebounce(formData.email || '', 500);

  // Determine super admin flag based on the TARGET user being edited, not the current operator
  const targetIsSuperAdmin = currentUser?.isSuperAdmin === true;
  
  // Initialize selected modules from formData when dialog opens
  useEffect(() => {
    if (isOpen && formData.moduleAccessPayload) {
      setSelectedModules(formData.moduleAccessPayload);
    }
    
    // Ensure joiningDate is properly formatted when dialog opens (only once when dialog opens)
    if (isOpen && formData.joiningDate && currentUser) {
      try {
        const date = new Date(formData.joiningDate);
        if (!isNaN(date.getTime())) {
          const formattedDate = date.toISOString().split('T')[0];
          // Only update if the format is different to avoid infinite loops
          if (formattedDate !== formData.joiningDate) {
            setFormData(prev => ({
              ...prev,
              joiningDate: formattedDate
            }));
          }
        }
      } catch (e) {
        console.warn("Error formatting joining date in EditUserDialog:", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentUser?.id]);

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
 

  useEffect(() => {
    const validateEmployeeIdAsync = async () => {
      if (!debouncedEmployeeId || !clientId) {
        setEmployeeIdValidation('idle');
        return;
      }

      if (debouncedEmployeeId === originalEmployeeIdRef.current) {
        setEmployeeIdValidation('available');
        return;
      }

      if (!validateEmployeeId(debouncedEmployeeId)) {
        setEmployeeIdValidation('error');
        return;
      }

      setEmployeeIdValidation('checking');

      try {
        const exists = await checkEmployeeIdExists(debouncedEmployeeId, clientId);
        setEmployeeIdValidation(exists ? 'exists' : 'available');
      } catch (err) {
        console.error('Employee ID validation failed:', err);
        setEmployeeIdValidation('error');
      }
    };

    validateEmployeeIdAsync();
  }, [debouncedEmployeeId, clientId]);

  useEffect(() => {
    const validateEmployeeEmail = async () => {
      if (!debouncedEmployeeEmail || !clientId) {
        setEmailValidation('idle');
        return;
      }

      if (debouncedEmployeeEmail === originalEmployeeEmailRef.current) {
        setEmailValidation('available');
        return;
      }

      if (!isValidEmail(debouncedEmployeeEmail)) {
        setEmailValidation('error');
        return;
      }

      setEmailValidation('checking');

      try {
        const exists = await checkEmployeeEmailExists(debouncedEmployeeEmail, clientId);
        setEmailValidation(exists ? 'exists' : 'available');
      } catch (error) {
        console.error('Error validating employee email:', error);
        setEmailValidation('error');
      }
    };

    validateEmployeeEmail();
  }, [debouncedEmployeeEmail, clientId]);


  useEffect(() => {
    if (isOpen && currentUser?.employeeId) {
      originalEmployeeIdRef.current = currentUser.employeeId;
      originalEmployeeEmailRef.current = currentUser.email;
      setEmployeeIdValidation('idle'); 
      setEmailValidation('idle');
    }
  }, [isOpen, currentUser?.employeeId,currentUser?.email]);

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
    const getEmployeeEmailValidationMessage = () => {
    switch (emailValidation) {
      case 'checking':
        return 'Checking email availability...';
      case 'available':
        return 'Email is available';
      case 'exists':
        return 'Email already exists for this client';
      case 'error':
        return 'Error checking email';
      default:
        return '';
    }
  };


  // Email validation function
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Employee ID validation function - uses constants from employeeConstant.ts
  const isValidEmployeeId = (employeeId: string) => {
    return validateEmployeeId(employeeId);
  };

  // Name validation function (letters and spaces only, no special characters)
  const isValidName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
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
  const isFormValid = () => {
    // Email is REQUIRED - must be present and valid
    const hasValidEmail = formData.email && formData.email.trim() !== '' && isValidEmail(formData.email);

    // If email is filled, modules are required
    const requiresModules = !!formData.email;
    const hasSelectedModules = !requiresModules || selectedModules.length > 0;

    return (
      formData.firstName &&
      formData.firstName.length <= 25 &&
      isValidName(formData.firstName) &&
      formData.lastName &&
      formData.lastName.length <= 25 &&
      isValidName(formData.lastName) &&
      hasValidEmail && // Email is required and must be valid
      (!formData.phone || isValidPhone(formData.phone)) &&
      (!formData.designation || isValidDesignation(formData.designation)) &&
      formData.employeeId &&
      isValidEmployeeId(formData.employeeId) &&
      employeeIdValidation !== 'exists' &&
      emailValidation !== 'exists' &&
      employeeIdValidation !== 'checking' && 
      emailValidation !== 'checking' && 
      hasSelectedModules &&
      !isUpdating &&
      !isLoading
    );
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !clientId) {
      toast.error("Missing user or client information");
      return;
    }
    if (formData.email && selectedModules.length === 0) {
      toast.error("Please select at least one module for this user");
      return;
    }
    if (!isFormValid()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }
    
    setIsUpdating(true);
      const moduleAccessPayload = selectedModules.map(module => ({
        ...module,
        module_id: module.module_id, 
        enabled: module.enabled !== false
      }));
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
        joiningDate: formData.joiningDate, // Include joining date in update
        moduleAccessPayload: moduleAccessPayload,
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
                  maxLength={NAME_MAX_LENGTH}
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
                  maxLength={NAME_MAX_LENGTH}
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
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className={!formData.email || (formData.email && !isValidEmail(formData.email)) ? 'border-red-500' : ''}
              />
                {!formData.email && (
                  <p className="text-xs text-red-500">Email is required</p>
                )}
                {formData.email && !isValidEmail(formData.email) && (
                  <p className="text-xs text-red-500">Please enter a valid email address</p>
                )}
                {formData.email && emailValidation !== 'idle' && isValidEmail(formData.email) && (
                  <p
                    className={`text-xs ${
                      emailValidation === 'exists' || emailValidation === 'error'
                        ? 'text-red-500'
                        : emailValidation === 'available'
                        ? 'text-green-500'
                        : 'text-blue-500'
                    }`}
                  >
                    {getEmployeeEmailValidationMessage()}
                  </p>
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
                <div className="relative">
                  <Input
                    id="employeeId"
                    value={formData.employeeId || ''}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    maxLength={EMPLOYEE_ID_CONSTANTS.MAX_LENGTH}
                    minLength={EMPLOYEE_ID_CONSTANTS.MIN_LENGTH}
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
                {formData.employeeId && formData.employeeId.length < EMPLOYEE_ID_CONSTANTS.MIN_LENGTH && (
                  <p className="text-xs text-red-500">Employee ID must be at least {EMPLOYEE_ID_CONSTANTS.MIN_LENGTH} characters</p>
                )}
                {formData.employeeId && formData.employeeId.length > EMPLOYEE_ID_CONSTANTS.MAX_LENGTH && (
                  <p className="text-xs text-red-500">Employee ID cannot exceed {EMPLOYEE_ID_CONSTANTS.MAX_LENGTH} characters</p>
                )}
                {formData.employeeId && formData.employeeId.length >= EMPLOYEE_ID_CONSTANTS.MIN_LENGTH && formData.employeeId.length <= EMPLOYEE_ID_CONSTANTS.MAX_LENGTH && !isValidEmployeeId(formData.employeeId) && (
                  <p className="text-xs text-red-500">{getEmployeeIdErrorMessage()}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="joiningDate">Joining Date</Label>
                <Input
                  id="joiningDate"
                  type="date"
                  value={formData.joiningDate || ''}
                  onChange={(e) => {
                      const selected = e.target.value;
                      const today = new Date().toISOString().split("T")[0];
                      if (selected < today) {
                        toast.error("Joining date must be a current date or future date");
                        return;
                      }
                      setFormData({ ...formData, joiningDate: selected });
                    }}
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
                  {selectedModules.length === 0 && (
                    <p className="text-xs text-red-500">
                      Please select at least one module.
                    </p>
                  )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isUpdating || isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating || isLoading || !isFormValid()}>
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
