
import { useState, useEffect, useRef } from 'react';
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
import { checkEmployeeIdExists,checkEmployeeEmailExists } from '@/services/employee/employeeValidationService';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import { NAME_MAX_LENGTH } from '@/services/employee/utils/excelValidationUtils';
import defaultModules from "@/utils/default-modules.json";
import { applyDefaultModules, DefaultModule } from "@/utils/moduleDefault";

import { EMPLOYEE_ID_CONSTANTS, isValidEmployeeId as validateEmployeeId, getEmployeeIdErrorMessage } from '@/constant/employeeConstant';



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
  onSubmit: (formData?: any) => void;
  resetForm: () => void;
  isLoading: boolean;
  clientId?: string;
}

type EmployeeIdValidationStatus = 'idle' | 'checking' | 'available' | 'exists' | 'error';
type EmailValidationStatus = 'idle' | 'checking' | 'available' | 'exists' | 'error';

const AddUserDialog = ({ isOpen, setIsOpen, formData, setFormData, onSubmit, resetForm, isLoading, clientId }: AddUserDialogProps) => {
  const { state } = useEmployeeStore();
  const [selectedModules, setSelectedModules] = useState<ModuleAccessItem[]>([]);
  const [employeeIdValidation, setEmployeeIdValidation] = useState<EmployeeIdValidationStatus>('idle');
  const [emailValidation, setEmailValidation] = useState<EmailValidationStatus>('idle');

  const formDataRef = useRef(formData);
  const mapModulesWithConfigured = (
    importedModules,
    configuredModules
      ) => {
        return importedModules.map(module => {
          const match = configuredModules.find(
            (cm) => cm.name.toLowerCase() === module.name.toLowerCase()
          );

          return {
            ...module,
            module_id: match ? match.id : null, 
            enabled: !!match
          };
        });
      };
  // Keep formDataRef in sync with formData
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
  
  // Debounce the employee ID to avoid excessive API calls
  const debouncedEmployeeId = useDebounce(formData.employeeId || '', 500);
  const debouncedEmployeeEmail = useDebounce(formData.email || '', 500);
  
  // Reset selectedModules when dialog opens to ensure clean state
  useEffect(() => {
  if (isOpen) {
      // Clear selectedModules when dialog opens
    const initialDefaultModules = applyDefaultModules(
      state.configuredModules || [],
      defaultModules,
      formData.employeeId
    );
    const mappedModules = mapModulesWithConfigured(
      initialDefaultModules,
      state.configuredModules
    );

    setSelectedModules(mappedModules);
    setFormData(prev => ({
      ...prev,
      moduleAccessPayload: mappedModules
    }));
  }
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isOpen, state.configuredModules, formData.employeeId]);


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

  useEffect(() => {
    const validateEmployeeEmail = async () => {
      if (!debouncedEmployeeEmail || !clientId) {
        setEmailValidation('idle');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if employee ID already exists
    if (employeeIdValidation === 'exists') {
      console.warn("Cannot submit: Employee ID already exists");
      toast.error("Employee ID already exists. Please use a different ID.");
      return;
    }
    if (formData.email && emailValidation === 'exists') {
      toast.error("Email already exists. Please use a different email address.");
      return;
    }
    
    // Prevent submission if form is not valid
    if (!isFormValid()) {
      console.warn("Form validation failed, cannot submit");
      console.log("Form validation details:", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        employeeId: formData.employeeId,
        employeeIdValidation,
        isValidEmployeeId: formData.employeeId ? isValidEmployeeId(formData.employeeId) : false,
        isLoading
      });
      toast.error("Please fill in all required fields correctly");
      return;
    }
    
    // Prevent submission if already loading
    if (isLoading) {
      console.warn("Already submitting, please wait");
      return;
    }
    
    // Use the selectedModules directly for backend processing
    const moduleAccessPayload = selectedModules.map(module => ({
      ...module,
      employeeId: formData.employeeId || undefined
    }));
    
    console.log("Module access payload for backend:", moduleAccessPayload);
    console.log("Form data before update:", formData);
    
    // Prepare the complete form data with moduleAccessPayload
    const completeFormData = {
      ...formData,
      clientId: formData.clientId || clientId,
      moduleAccessPayload
    };
    
    console.log("Complete form data for submission:", completeFormData);
    
    // Update the formData with the complete data
    setFormData(completeFormData);
    formDataRef.current = completeFormData;
    
    // Call onSubmit with the complete formData directly to avoid timing issues
    console.log("Calling onSubmit with formData:", completeFormData);
    onSubmit(completeFormData);
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

  // Phone validation (E.164 basic or 10-15 digits allowing +, space, hyphen)
  // Phone validation (digits only, exactly 10 digits)
  const isValidPhone = (phone: string) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  // Name validation function (letters and spaces only, no special characters)
  const isValidName = (name: string) => {
     const trimmed = name.trim();
    if (!trimmed) return false;
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
    const isEmailUnique =
      !formData.email ||
      emailValidation === 'available' ||
      emailValidation === 'idle';

    return (
      formData.firstName &&
      formData.firstName.length <= 25 &&
      isValidName(formData.firstName) &&
      formData.lastName &&
      formData.lastName.length <= 25 &&
      isValidName(formData.lastName) &&
      hasValidEmail &&
      formData.email&&
      isEmailUnique &&
      (!formData.phone || isValidPhone(formData.phone)) &&
      (!formData.designation || isValidDesignation(formData.designation)) &&
      formData.employeeId &&
      formData.employeeId.length >= EMPLOYEE_ID_CONSTANTS.MIN_LENGTH &&
      formData.employeeId.length <= EMPLOYEE_ID_CONSTANTS.MAX_LENGTH &&
      isValidEmployeeId(formData.employeeId) &&
      employeeIdValidation === 'available' &&
      !isLoading
    );
  };

  const handleDialogOpenChange = (open: boolean) => {
    // Prevent closing if form is being submitted
    if (!open && isLoading) {
      console.log("Preventing dialog close during submission");
      return;
    }
    if (!open) {
      handleClose();
    } else {
      setIsOpen(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
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
              />
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
                  min={new Date().toISOString().split("T")[0]}
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
                 {selectedModules.length === 0 && (
                  <p className="text-xs text-red-500">
                    Please select at least one module.
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isFormValid() || employeeIdValidation === 'checking' || emailValidation === 'checking'}
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
