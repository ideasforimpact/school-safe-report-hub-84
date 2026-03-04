
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeeType, DepartmentType } from '@/contexts/auth/types';
import { Check, Loader2, X, Tag } from 'lucide-react';
import { ModuleAccessItem } from '@/types/moduleAccess';
import ModuleAccess from './form/ModuleAccess';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEmployeeData } from '@/hooks/useEmployeeData';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { EMPLOYEE_ID_CONSTANTS, isValidEmployeeId as validateEmployeeId, getEmployeeIdErrorMessage, EMPLOYEE_NAME_CONSTANTS, EMPLOYEE_LAST_NAME_CONSTANTS } from '@/constant/employeeConstant';
import { EmailValidationStatus, EmployeeIdValidationStatus } from './AddUserDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { checkEmployeeEmailExists, checkEmployeeIdExists } from '@/services/employee/employeeValidationService';
import { useEmployeeTypes } from '@/hooks/useEmployeeTypes';
import { useEmployeeDepartments } from '@/hooks/useEmployeeDepartments';

interface EditUserDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    designation?: string;
    tags?: string[];
    employeeId?: string;
    employeeType?: EmployeeType;
    department?: DepartmentType;
    joiningDate?: string;
    moduleAccessPayload?: ModuleAccessItem[];
    is_cpd_involved?: boolean;
  };
  setFormData: (data: any) => void;
  onSubmit: () => void;
  resetForm: () => void;
  isLoading: boolean;
  currentUser?: any;
  /** Latest list of employees so dialog can show fresh data when reopened after save */
  employeeUsers?: any[];
}

const EditUserDialog = ({
  isOpen,
  setIsOpen,
  formData,
  setFormData,
  onSubmit,
  resetForm,
  isLoading,
  currentUser,
  employeeUsers = [],
}: EditUserDialogProps) => {
  const MAX_TAGS = 2;
  const MAX_TAG_LENGTH = 25;
  const [selectedModules, setSelectedModules] = useState<ModuleAccessItem[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const { clientId } = useEmployeeData();
  const { state: employeeState } = useEmployeeStore();
  const { employeeTypes, loading: employeeTypesLoading } = useEmployeeTypes();
  const { employeeDepartments, loading: employeeDepartmentsLoading } = useEmployeeDepartments();
  const [employeeIdValidation, setEmployeeIdValidation] = useState<EmployeeIdValidationStatus>('idle');
  const [emailValidation, setEmailValidation] = useState<EmailValidationStatus>('idle');
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState('');
  const originalEmployeeIdRef = useRef<string | undefined>(undefined);
  const originalEmployeeEmailRef = useRef<string | undefined>(undefined);
  const debouncedEmployeeId = useDebounce(formData.employeeId || '', 500);
  const debouncedEmployeeEmail = useDebounce(formData.email || '', 500);

  // Determine super admin flag based on the TARGET user being edited, not the current operator
  const targetIsSuperAdmin = currentUser?.isSuperAdmin === true;
  
  // Resolve latest user from list so we always show fresh data (e.g. after save + reopen)
  const latestUser = (isOpen && currentUser && employeeUsers?.length)
    ? (employeeUsers.find((u: any) => u.id === currentUser.id) ?? currentUser)
    : currentUser;

  // Log what the popup is showing when it opens (for debugging CPD / edit values)
  useEffect(() => {
    if (isOpen && currentUser) {
      const fromLatest = (latestUser as any).isCpdInvolved ?? (latestUser as any).is_cpd_involved ?? false;
    }
  }, [isOpen, currentUser?.id]);

  // Initialize selected modules and form from latest user when dialog opens
  useEffect(() => {
    if (isOpen && formData.moduleAccessPayload) {
      setSelectedModules(formData.moduleAccessPayload);
    }
    // Sync from latest user so toggle shows saved value
    if (isOpen && latestUser) {
      const cpdValue = (latestUser as any).isCpdInvolved ?? (latestUser as any).is_cpd_involved ?? false;
      setFormData(prev => (prev.is_cpd_involved === cpdValue ? prev : { ...prev, is_cpd_involved: cpdValue }));
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
    if (isOpen) {
      const existingTags =
        (Array.isArray(formData.tags) && formData.tags.length > 0
          ? formData.tags
          : (formData.designation || '')
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
              .slice(0, MAX_TAGS));
      setFormData(prev => ({
        ...prev,
        tags: existingTags,
        designation: existingTags.join(', ')
      }));
      setTagInput('');
      setTagError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentUser?.id, employeeUsers]);

  // Map employee_type name to ID when employee types are loaded and formData has a name
  useEffect(() => {
    if (isOpen && !employeeTypesLoading && employeeTypes.length > 0 && formData.employeeType) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      // If employeeType is not a UUID, it's likely a name - map it to ID
      if (!uuidRegex.test(formData.employeeType)) {
        const matchingType = employeeTypes.find(
          type => type.type_name.toLowerCase() === formData.employeeType?.toLowerCase()
        );
        if (matchingType) {
          setFormData(prev => ({
            ...prev,
            employeeType: matchingType.id as any
          }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, employeeTypesLoading, employeeTypes, formData.employeeType]);

  // Map department name to ID when employee departments are loaded and formData has a name
  useEffect(() => {
    if (isOpen && !employeeDepartmentsLoading && employeeDepartments.length > 0 && formData.department) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      // If department is not a UUID, it's likely a name - map it to ID
      if (!uuidRegex.test(formData.department)) {
        const matchingDept = employeeDepartments.find(
          dept => dept.department_name.toLowerCase() === formData.department?.toLowerCase()
        );
        if (matchingDept) {
          setFormData(prev => ({
            ...prev,
            department: matchingDept.id as any
          }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, employeeDepartmentsLoading, employeeDepartments, formData.department]);

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

      if (debouncedEmployeeId.length < EMPLOYEE_ID_CONSTANTS.MIN_LENGTH) {
        setEmployeeIdValidation('idle');
        return;
      }

      if (!isValidEmployeeId(debouncedEmployeeId)) {
        setEmployeeIdValidation('error');
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
    return /^[6-9]\d{9}$/.test(phone);
  };

  const sanitizeTag = (value: string) => value.replace(/,/g, '').trim().slice(0, MAX_TAG_LENGTH);
  const currentTags = Array.isArray(formData.tags) ? formData.tags : [];

  const updateTags = (nextTags: string[]) => {
    setFormData({
      ...formData,
      tags: nextTags,
      // Keep designation in sync for backend compatibility.
      designation: nextTags.join(', ')
    });
  };

  const addTag = () => {
    const normalized = sanitizeTag(tagInput);
    if (!normalized) return;
    if (currentTags.length >= MAX_TAGS) {
      setTagError(`Maximum ${MAX_TAGS} tags allowed`);
      return;
    }
    if (currentTags.some((tag) => tag.toLowerCase() === normalized.toLowerCase())) {
      setTagError('Tag already added');
      return;
    }
    updateTags([...currentTags, normalized]);
    setTagInput('');
    setTagError('');
  };

  const removeTag = (tagToRemove: string) => {
    const nextTags = currentTags.filter((tag) => tag !== tagToRemove);
    updateTags(nextTags);
    setTagError('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setTagInput('');
    setTagError('');
    resetForm();
  };
  const isFormValid = () => {
    // Email is optional; if provided must be valid and unique
    const hasValidEmail = !formData.email || (formData.email.trim() !== '' && isValidEmail(formData.email));
    const isEmailUnique = !formData.email || emailValidation === 'available' || emailValidation === 'idle';

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
      hasValidEmail &&
      isEmailUnique &&
      (!formData.phone || isValidPhone(formData.phone)) &&
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
      const normalizedEmail =
        formData.email && formData.email.trim() !== '' ? formData.email.trim() : null;

      const originalEmail = (currentUser.email as string | null) ?? null;
      const emailChanged = normalizedEmail !== originalEmail;

      const updateData: any = {
        id: currentUser.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        employeeId: formData.employeeId,
        phone: formData.phone,
        designation: currentTags.join(', '),
        employeeType: formData.employeeType ?? undefined,
        department: formData.department ?? undefined,
        joiningDate: formData.joiningDate,
        moduleAccessPayload: moduleAccessPayload,
        clientId: clientId,
        is_cpd_involved: formData.is_cpd_involved === true,
      };

      // Only send email through when it actually changed (including clearing it)
      if (emailChanged) {
        // When cleared, normalizedEmail will be null - backend treats this as "no duplicate check"
        updateData.email = normalizedEmail;
      }
      
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
      // Refresh list first so when dialog closes, list has latest data (e.g. is_cpd_involved)
      if (typeof onSubmit === 'function') {
        await Promise.resolve(onSubmit());
      }
      handleClose();
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
                  maxLength={EMPLOYEE_NAME_CONSTANTS.MAX_LENGTH}
                  minLength={EMPLOYEE_NAME_CONSTANTS.MIN_LENGTH}
                  required
                  className={formData.firstName && !isValidName(formData.firstName) ? 'border-red-500' : ''}
                />
              {formData.firstName &&
                formData.firstName.length < EMPLOYEE_NAME_CONSTANTS.MIN_LENGTH && (
                  <p className="text-xs text-red-500">
                    First name must be at least {EMPLOYEE_NAME_CONSTANTS.MIN_LENGTH} characters
                  </p>
              )}

              {formData.firstName &&
                formData.firstName.length > EMPLOYEE_NAME_CONSTANTS.MAX_LENGTH && (
                  <p className="text-xs text-red-500">
                    First name cannot exceed {EMPLOYEE_NAME_CONSTANTS.MAX_LENGTH} characters
                  </p>
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
                  maxLength={EMPLOYEE_LAST_NAME_CONSTANTS.MAX_LENGTH}
                  minLength={EMPLOYEE_LAST_NAME_CONSTANTS.MIN_LENGTH}
                  required
                  className={formData.lastName && !isValidName(formData.lastName) ? 'border-red-500' : ''}
                />
                {formData.lastName &&
                  formData.lastName.length < EMPLOYEE_LAST_NAME_CONSTANTS.MIN_LENGTH && (
                    <p className="text-xs text-red-500">
                      Last name must be at least {EMPLOYEE_LAST_NAME_CONSTANTS.MIN_LENGTH} character
                    </p>
                )}

                {formData.lastName &&
                  formData.lastName.length > EMPLOYEE_LAST_NAME_CONSTANTS.MAX_LENGTH && (
                    <p className="text-xs text-red-500">
                      Last name cannot exceed {EMPLOYEE_LAST_NAME_CONSTANTS.MAX_LENGTH} characters
                    </p>
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
                className={formData.email && !isValidEmail(formData.email) ? 'border-red-500' : ''}
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
                maxLength={10}
              />
              {formData.phone && formData.phone.length < 10 && (
                <p className="text-xs text-red-500">
                  Mobile number must be 10 digits
                </p>
              )}

              {formData.phone?.length === 10 && !isValidPhone(formData.phone) && (
                <p className="text-xs text-red-500">
                  Mobile number must be valid 
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="employee-tags" className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  Tags
                </Label>
                <span className="text-xs text-gray-400">{currentTags.length}/{MAX_TAGS} tags</span>
              </div>
              <div className="min-h-14 w-full rounded-md border bg-gray-50 px-2 py-2 flex flex-wrap items-center gap-2">
                {currentTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-md bg-blue-600 text-white text-sm px-2 py-1"
                  >
                    {tag}
                    <button
                      type="button"
                      className="text-white/90 hover:text-white"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove ${tag}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
                <Input
                  id="employee-tags"
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(sanitizeTag(e.target.value));
                    if (tagError) setTagError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  onBlur={addTag}
                  placeholder={currentTags.length >= MAX_TAGS ? 'Maximum tags added' : 'Add one more...'}
                  className="border-0 shadow-none bg-transparent focus-visible:ring-0 h-8 flex-1 min-w-[140px]"
                  maxLength={MAX_TAG_LENGTH}
                  disabled={currentTags.length >= MAX_TAGS}
                />
              </div>
              <p className="text-xs text-gray-500">
                Maximum {MAX_TAGS} tags, {MAX_TAG_LENGTH} characters each
              </p>
              {tagError && <p className="text-xs text-red-500">{tagError}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    id="employeeId"
                    value={formData.employeeId || ''}
                    onChange={(e) => {
                      const upperValue = e.target.value.toUpperCase();
                      setFormData({ ...formData, employeeId: upperValue });
                    }}
                    maxLength={EMPLOYEE_ID_CONSTANTS.MAX_LENGTH}
                    minLength={EMPLOYEE_ID_CONSTANTS.MIN_LENGTH}
                    className={`pr-10 uppercase ${
                      employeeIdValidation === 'exists' ? 'border-red-500 focus:border-red-500' :
                      employeeIdValidation === 'available' ? 'border-green-500 focus:border-green-500' : ''
                    }`}
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getEmployeeIdValidationIcon()}
                  </div>
                </div>
                {formData.employeeId && formData.employeeId.length < EMPLOYEE_ID_CONSTANTS.MIN_LENGTH && (
                  <p className="text-xs text-red-500">Employee ID must be at least {EMPLOYEE_ID_CONSTANTS.MIN_LENGTH} characters</p>
                )}
                {formData.employeeId && formData.employeeId.length > EMPLOYEE_ID_CONSTANTS.MAX_LENGTH && (
                  <p className="text-xs text-red-500">Employee ID cannot exceed {EMPLOYEE_ID_CONSTANTS.MAX_LENGTH} characters</p>
                )}
                {formData.employeeId && formData.employeeId.length >= EMPLOYEE_ID_CONSTANTS.MIN_LENGTH && formData.employeeId.length <= EMPLOYEE_ID_CONSTANTS.MAX_LENGTH && !isValidEmployeeId(formData.employeeId) && (
                  <p className="text-xs text-red-500">{getEmployeeIdErrorMessage()}</p>
                )}
                {employeeIdValidation !== 'idle' && (
                  <p className={`text-xs ${
                    employeeIdValidation === 'exists' || employeeIdValidation === 'error' ? 'text-red-500' :
                    employeeIdValidation === 'available' ? 'text-green-500' : 'text-blue-500'
                  }`}>
                    {getEmployeeIdValidationMessage()}
                  </p>
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
                  onValueChange={(value) => setFormData({ ...formData, employeeType: value as any })}
                  disabled={employeeTypesLoading}
                >
                  <SelectTrigger id="employeeType">
                    <SelectValue placeholder={employeeTypesLoading ? "Loading..." : "Select type"} />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.type_name.charAt(0).toUpperCase() + type.type_name.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value as any })}
                  disabled={employeeDepartmentsLoading}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder={employeeDepartmentsLoading ? "Loading..." : "Select department"} />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.department_name.charAt(0).toUpperCase() + dept.department_name.slice(1)}
                      </SelectItem>
                    ))}
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

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <Label htmlFor="cpd-toggle-edit">CPD Involved</Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="cpd-toggle-edit"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      is_cpd_involved: !formData.is_cpd_involved,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.is_cpd_involved ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.is_cpd_involved ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-600">
                  {formData.is_cpd_involved ? 'Included in CPD tracking' : 'Not included in CPD tracking'}
                </span>
              </div>
            </div>
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
