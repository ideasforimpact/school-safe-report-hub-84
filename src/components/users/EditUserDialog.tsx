
import { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeeType, DepartmentType } from '@/contexts/auth/types';
import { Check, Eye, Loader2, X, Tag, Upload, ChevronRight, ChevronLeft, ChevronDown, FileText } from 'lucide-react';
import { ModuleAccessItem } from '@/types/moduleAccess';
import ModuleAccess from './form/ModuleAccess';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEmployeeData } from '@/hooks/useEmployeeData';
import { EMPLOYEE_ID_CONSTANTS, isValidEmployeeId as validateEmployeeId, getEmployeeIdErrorMessage, EMPLOYEE_NAME_CONSTANTS, EMPLOYEE_LAST_NAME_CONSTANTS, EMPLOYEE_PERSONAL_INFO_CONSTANTS, STAFF_ID_CONSTANTS, BIOMETRIC_USER_ID_CONSTANTS, EXPERIENCE_CONSTANTS } from '@/constant/employeeConstant';
import { EmailValidationStatus, EmployeeIdValidationStatus } from './AddUserDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { checkEmployeeEmailExists, checkEmployeeIdExists } from '@/services/employee/employeeValidationService';
import { useEmployeeTypes } from '@/hooks/useEmployeeTypes';
import { useEmployeeDepartments } from '@/hooks/useEmployeeDepartments';
import WizardProgress from '@/components/ui/wizard-progress';
import { EMPLOYEE_COMPLIANCE_DOCUMENTS } from '@/constants/employeeComplianceDocuments';
import { getProfileDocumentSignedUrl } from '@/services/employee/employeeProfileDocumentService';
import { fileToBase64 } from '@/utils/fileToBase64';

interface EditUserDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  formData: {
    firstName: string;
    lastName: string;
    personalDetails?: {
      middleName?: string;
      fatherName?: string;
      staffId?: string;
      experience?: string;
      qualification?: string;
      gender?: string;
      dob?: string;
      religion?: string;
      nationality?: string;
      bloodGroup?: string;
      residenceAddress?: string;
    };
    email: string;
  
    phone?: string;
    designation?: string;
    tags?: string[];
    employeeId?: string;
    employeeType?: EmployeeType;
    department?: DepartmentType;
    joiningDate?: string;
    professionalOtherDetails?: {
      aadharNo?: string;
      panNo?: string;
      esiNo?: string;
      pfNo?: string;
      exitDate?: string;
      biometricUserId?: string;
    };
    moduleAccessPayload?: ModuleAccessItem[];
    documents?: Array<{
      key?: string;
      fileName: string;
      filePath?: string;
      uploadedAt: string;
      fileData?: string;
      contentType?: string;
    }>;
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
  const hasEmail = Boolean(formData.email?.trim());
  const steps = useMemo(
    () =>
      hasEmail
        ? ([
            'Basic Information',
            'Personal Details',
            'Professional Details',
            'Module Access',
            'Documents & Compliance'
          ] as const)
        : ([
            'Basic Information',
            'Personal Details',
            'Professional Details',
            'Documents & Compliance'
          ] as const),
    [hasEmail]
  );
  const personalDetailsStepIndex = 1;
  const professionalDetailsStepIndex = 2;
  const moduleAccessStepIndex = hasEmail ? 3 : -1;
  const documentsStepIndex = hasEmail ? 4 : 3;
  const [currentStep, setCurrentStep] = useState(0);
  const completedSteps = useMemo(
    () => Array.from({ length: currentStep }, (_, index) => index),
    [currentStep]
  );
  const [selectedModules, setSelectedModules] = useState<ModuleAccessItem[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, string>>({});
  const [uploadedDocumentFiles, setUploadedDocumentFiles] = useState<Record<string, File>>({});
  const [documentMetaByKey, setDocumentMetaByKey] = useState<Record<string, { bucket?: string; storagePath?: string; source: 'profile' | 'verification' | 'new' }>>({});
  const [removedProfilePaths, setRemovedProfilePaths] = useState<string[]>([]);
  const documentInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const { clientId } = useEmployeeData();
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
  const joiningDateRef = useRef<HTMLInputElement>(null);
  const [joiningDateError, setJoiningDateError] = useState('');
  const [showOtherDetails, setShowOtherDetails] = useState(false);
  const personalDetails = formData.personalDetails || {};
  const professionalOtherDetails = formData.professionalOtherDetails || {};
  // Determine super admin flag based on the TARGET user being edited, not the current operator
  const targetIsSuperAdmin = currentUser?.isSuperAdmin === true;
  
  // Resolve latest user from list so we always show fresh data (e.g. after save + reopen)
  const latestUser = (isOpen && currentUser && employeeUsers?.length)
    ? (employeeUsers.find((u: any) => u.id === currentUser.id) ?? currentUser)
    : currentUser;

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
          : (formData.designation || '').includes(',')
              ? (formData.designation || '')
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean)
                  .slice(0, MAX_TAGS)
              : []);
      setFormData(prev => ({
        ...prev,
        tags: existingTags,
      }));
      setTagInput('');
      setTagError('');
      setUploadedDocumentFiles({});
      setRemovedProfilePaths([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentUser?.id, employeeUsers]);

  useEffect(() => {
    const loadDocumentsFromFunction = async () => {
      if (!isOpen || !currentUser?.id) return;
      const profileRes = await supabase.functions.invoke('fetch-employee-profile-documents', {
        body: {
          employeeId: currentUser.id,
          clientId: clientId || undefined,
        },
      });

      const hasError = profileRes.error || profileRes.data?.success !== true;
      if (hasError) return;

      const profileDocs = Array.isArray(profileRes.data?.profileDocuments) ? profileRes.data.profileDocuments : [];
      const mergedDocs = Array.isArray(profileRes.data?.mergedDocuments) ? profileRes.data.mergedDocuments : [];

      const mergedNames: Record<string, string> = {};
      const mergedMeta: Record<string, { bucket?: string; storagePath?: string; source: 'profile' | 'verification' | 'new' }> = {};

      mergedDocs.forEach((doc: any) => {
        const docKey = doc?.docKey;
        if (!docKey) return;
        mergedNames[docKey] = doc.fileName || `Upload ${doc.label || 'Document'}`;
        mergedMeta[docKey] = {
          bucket: doc.bucket,
          storagePath: doc.storagePath,
          source: doc.source === 'verification' ? 'verification' : 'profile',
        };
      });

      setUploadedDocuments(mergedNames);
      setDocumentMetaByKey(mergedMeta);
      setFormData((prev) => ({ ...prev, documents: profileDocs }));
    };

    loadDocumentsFromFunction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentUser?.id]);

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

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setUploadedDocuments({});
      const details = formData.professionalOtherDetails || {};
      const hasExistingOtherDetails = Boolean(
        details.aadharNo ||
        details.panNo ||
        details.esiNo ||
        details.pfNo ||
        details.exitDate ||
        details.biometricUserId
      );
      setShowOtherDetails(hasExistingOtherDetails);
    }
  }, [isOpen, currentUser?.id]);

  useEffect(() => {
    if (currentStep > steps.length - 1) {
      setCurrentStep(steps.length - 1);
    }
  }, [currentStep, steps.length]);

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
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
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

  const isValidLettersAndSpaces = (value: string) => /^[a-zA-Z\s]+$/.test(value);

  const getPersonalDetailsErrors = () => {
    const minLength = 3;
    const validateOptionalTextField = (value: string, label: string) => {
      const trimmed = (value || '').trim();
      if (!trimmed) return '';
      if (trimmed.length < EMPLOYEE_PERSONAL_INFO_CONSTANTS.MIN_LENGTH) return `${label} must be at least ${EMPLOYEE_PERSONAL_INFO_CONSTANTS.MIN_LENGTH} characters`;
      if (trimmed.length > EMPLOYEE_PERSONAL_INFO_CONSTANTS.MAX_LENGTH) return `${label} cannot exceed ${EMPLOYEE_PERSONAL_INFO_CONSTANTS.MAX_LENGTH} characters`;
      if (!isValidLettersAndSpaces(trimmed)) return `${label} can only contain letters and spaces`;
      return '';
    };

    return {
      middleName: validateOptionalTextField(personalDetails.middleName || '', 'Middle name'),
      fatherName: validateOptionalTextField(personalDetails.fatherName || '', "Father's name"),
      experience:
        (personalDetails.experience || '').trim() &&
        ((personalDetails.experience || '').trim().length < EXPERIENCE_CONSTANTS.MIN_LENGTH || (personalDetails.experience || '').trim().length > EXPERIENCE_CONSTANTS.MAX_LENGTH)
          ? `Experience must be between ${EXPERIENCE_CONSTANTS.MIN_LENGTH} and ${EXPERIENCE_CONSTANTS.MAX_LENGTH} characters`
          : (personalDetails.experience || '').trim() &&
            !/^\d+$/.test((personalDetails.experience || '').trim())
          ? 'Experience must contain numbers only'
          : '',

      qualification:
        (personalDetails.qualification || '').trim() &&
        ((personalDetails.qualification || '').trim().length < EMPLOYEE_PERSONAL_INFO_CONSTANTS.MIN_LENGTH ||
        (personalDetails.qualification || '').trim().length > EMPLOYEE_PERSONAL_INFO_CONSTANTS.MAX_LENGTH)
        ? `Qualification must be between ${EMPLOYEE_PERSONAL_INFO_CONSTANTS.MIN_LENGTH} and ${EMPLOYEE_PERSONAL_INFO_CONSTANTS.MAX_LENGTH} characters`
        : (personalDetails.qualification || '').trim() &&
          !/^[a-zA-Z\s.-]+$/.test((personalDetails.qualification || '').trim())
        ? 'Qualification can only contain letters, spaces, dots, and hyphens'
        : '',
      religion: validateOptionalTextField(personalDetails.religion || '', 'Religion'),
      nationality: validateOptionalTextField(personalDetails.nationality || '', 'Nationality'),
      bloodGroup:
        (personalDetails.bloodGroup || '').trim() &&
        !/^(A|A1|A2|B|AB|A1B|A2B|O)(\+|-|POSITIVE|NEGATIVE)$/i.test((personalDetails.bloodGroup || '').trim())
          ? 'Blood group must be in format A+, O-, AB+, B-'
          : '',
      dob:
        personalDetails.dob && new Date(personalDetails.dob) > new Date()
          ? 'Date of birth cannot be in the future'
          : '',
    };
  };

  const personalDetailsErrors = getPersonalDetailsErrors();
  const hasPersonalDetailsErrors = Object.values(personalDetailsErrors).some(Boolean);

  const isValidPhone = (phone: string) => {
    return /^[6-9]\d{9}$/.test(phone);
  };

  const formatAadhaarNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const getProfessionalOtherDetailsErrors = () => {
    const aadharNo = (professionalOtherDetails.aadharNo || '').trim();
    const panNo = (professionalOtherDetails.panNo || '').trim().toUpperCase();
    const esiNo = (professionalOtherDetails.esiNo || '').trim();
    const pfNo = (professionalOtherDetails.pfNo || '').trim();
    const biometricUserId = (professionalOtherDetails.biometricUserId || '').trim();

    return {
      aadharNo:
        aadharNo && !/^\d{12}$/.test(aadharNo)
          ? 'Aadhaar number must be exactly 12 digits'
          : '',
      panNo:
        panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNo)
          ? 'PAN must be in format FTEPB4343S'
          : '',
      esiNo:
        esiNo && !/^\d{10}$/.test(esiNo)
          ? 'ESI number must be exactly 10 digits'
          : '',
      pfNo:
        pfNo && !/^\d{12}$/.test(pfNo)
          ? 'PF number must be exactly 12 digits'
          : '',
      biometricUserId:
        biometricUserId && (biometricUserId.length < BIOMETRIC_USER_ID_CONSTANTS.MIN_LENGTH || biometricUserId.length > BIOMETRIC_USER_ID_CONSTANTS.MAX_LENGTH)
          ? `Biometric User ID must be between ${BIOMETRIC_USER_ID_CONSTANTS.MIN_LENGTH} and ${BIOMETRIC_USER_ID_CONSTANTS.MAX_LENGTH} characters`
          : '',
      exitDate:
        professionalOtherDetails.exitDate && new Date(professionalOtherDetails.exitDate) > new Date()
          ? 'Resigning date cannot be in the future'
          : '',
    };
  };

  const professionalOtherDetailsErrors = getProfessionalOtherDetailsErrors();
  const hasProfessionalOtherDetailsErrors = Object.values(professionalOtherDetailsErrors).some(Boolean);

  const sanitizeTag = (value: string) => value.replace(/,/g, '').trim().slice(0, MAX_TAG_LENGTH);
  const currentTags = Array.isArray(formData.tags) ? formData.tags : [];

  const updateTags = (nextTags: string[]) => {
    setFormData({
      ...formData,
      tags: nextTags,
      // Keep designation in sync so clearing tags removes old stored value.
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
    setUploadedDocuments({});
    setUploadedDocumentFiles({});
    setDocumentMetaByKey({});
    setRemovedProfilePaths([]);
    setJoiningDateError(''); 
    setShowOtherDetails(false);
    resetForm();    
  };

  const isValidJoiningDate = (dateStr: string) => {
    if (!dateStr) return true; // empty is allowed

    const parts = dateStr.split('-');
    if (parts.length !== 3) return false;

    const [year, month, day] = parts.map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(year, month - 1, day);

    return (
      year >= 1940 &&
      inputDate <= today && // optional: prevent future dates
      inputDate.getFullYear() === year &&
      inputDate.getMonth() === month - 1 &&
      inputDate.getDate() === day
    );
  };

  const handleJoiningDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const value = input.value;
    setFormData({ ...formData, joiningDate: value });

    if (!input.validity.valid) {
      setJoiningDateError('Please enter a valid joining date');
    } else if (value && !isValidJoiningDate(value)) {
      setJoiningDateError('Please enter a valid joining date');
    } else {
      setJoiningDateError('');
    }
  };

  const handleJoiningDateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target;
    if (!input.validity.valid) {
      setJoiningDateError('Please enter a valid joining date');
    } else if (input.value && !isValidJoiningDate(input.value)) {
      setJoiningDateError('Please enter a valid joining date');
    } else {
      setJoiningDateError('');
    }
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
      (!formData.joiningDate || isValidJoiningDate(formData.joiningDate)) &&
      !joiningDateError &&
      !hasPersonalDetailsErrors &&
      !hasProfessionalOtherDetailsErrors &&
      employeeIdValidation !== 'exists' &&
      emailValidation !== 'exists' &&
      employeeIdValidation !== 'checking' &&
      emailValidation !== 'checking' &&
      hasSelectedModules &&
      !isUpdating &&
      !isLoading
    );
  };
  const isBasicStepValid = () => {
    const hasValidEmail = !formData.email || (formData.email.trim() !== '' && isValidEmail(formData.email));
    const isEmailUnique = !formData.email || emailValidation === 'available' || emailValidation === 'idle';
    return (
      !!formData.firstName &&
      formData.firstName.length <= 25 &&
      isValidName(formData.firstName) &&
      !!formData.lastName &&
      formData.lastName.length <= 25 &&
      isValidName(formData.lastName) &&
      hasValidEmail &&
      isEmailUnique &&
      (!formData.phone || isValidPhone(formData.phone))
    );
  };

  const isProfessionalStepValid = () => {
    return (
      !!formData.employeeId &&
      isValidEmployeeId(formData.employeeId) &&
      (!formData.joiningDate || isValidJoiningDate(formData.joiningDate)) &&
      !joiningDateError &&
      !hasProfessionalOtherDetailsErrors &&
      employeeIdValidation !== 'exists' &&
      employeeIdValidation !== 'checking'
    );
  };

  const isPersonalDetailsStepValid = () => {
    // Personal detail fields are optional, but if present must be valid.
    return !hasPersonalDetailsErrors;
  };

  const canProceedToNextStep = () => {
    if (currentStep === 0) {
      return isBasicStepValid() && emailValidation !== 'checking';
    }

    if (currentStep === personalDetailsStepIndex) {
      return isPersonalDetailsStepValid();
    }

    if (currentStep === professionalDetailsStepIndex) {
      return (
        isProfessionalStepValid() &&
        employeeIdValidation !== 'checking'
      );
    }

    if (currentStep === moduleAccessStepIndex) {
      const hasSelectedModules =
        selectedModules.filter((module) => module.enabled).length > 0;

      if (!hasSelectedModules) {
        return false;
      }

      return true;
    }

    return true;
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex === currentStep) return;
    if (stepIndex > currentStep && !canProceedToNextStep()) {
      toast.error('Please fill in all required fields correctly before continuing');
      return;
    }
    setCurrentStep(stepIndex);
  };

  const openDocumentPicker = (documentKey: string) => {
    documentInputRefs.current[documentKey]?.click();
  };

  const handleDocumentChange = (documentKey: string, file: File | null) => {
    if (!file) {
      setUploadedDocuments((prev) => {
        const next = { ...prev };
        delete next[documentKey];
        return next;
      });
      return;
    }

    const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'];

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      toast.error('Only PDF, PNG, JPG, JPEG, DOC, and DOCX files are allowed');
      return;
    }

    setUploadedDocuments((prev) => ({
      ...prev,
      [documentKey]: file.name
    }));

    setUploadedDocumentFiles((prev) => {
      const next = { ...prev };
      next[documentKey] = file;
      return next;
    });

    setDocumentMetaByKey((prev) => ({
      ...prev,
      [documentKey]: { source: 'new' }
    }));
  };

  const handleViewDocument = async (documentKey: string) => {
    const meta = documentMetaByKey[documentKey];
    if (!meta?.bucket || !meta?.storagePath) return;
    const { data, error } = await supabase.storage.from(meta.bucket).createSignedUrl(meta.storagePath, 300);
    if (error || !data?.signedUrl) {
      toast.error('Unable to open document');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const handleRemoveDocument = (documentKey: string) => {
    const meta = documentMetaByKey[documentKey];
    if (meta?.source === 'profile' && meta.storagePath) {
      setRemovedProfilePaths((prev) => (prev.includes(meta.storagePath!) ? prev : [...prev, meta.storagePath!]));
    }

    setUploadedDocuments((prev) => {
      const next = { ...prev };
      delete next[documentKey];
      return next;
    });
    setUploadedDocumentFiles((prev) => {
      const next = { ...prev };
      delete next[documentKey];
      return next;
    });
    setDocumentMetaByKey((prev) => {
      const next = { ...prev };
      delete next[documentKey];
      return next;
    });

    const input = documentInputRefs.current[documentKey];
    if (input) input.value = '';
  };

  const persistUserChanges = async (closeAfterSave: boolean) => {
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
      const existingDocuments = Array.isArray(formData.documents) ? formData.documents : [];
      const filteredExistingDocuments = existingDocuments.filter(
        (doc) => !removedProfilePaths.includes((doc as any).storagePath || (doc as any).storage_path || (doc as any).filePath || (doc as any).file_path)
      );
      const documentsPayload: Array<{
        key: string;
        fileName: string;
        uploadedAt: string;
        fileData: string;
        contentType: string;
      }> = [];

      for (const doc of EMPLOYEE_COMPLIANCE_DOCUMENTS) {
        const file = uploadedDocumentFiles[doc.key];
        if (!file) continue;

        let fileData = '';
        try {
          fileData = await fileToBase64(file);
        } catch {
          toast.error(`Failed to process ${doc.label}`);
          setIsUpdating(false);
          return;
        }

        documentsPayload.push({
          key: doc.key,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          fileData,
          contentType: file.type || 'application/octet-stream'
        });
      }

      const mergedDocuments = [...filteredExistingDocuments];
      documentsPayload.forEach((doc) => {
        const existingIndex = mergedDocuments.findIndex(
          (item) =>
            (item as any).key === doc.key
        );
        if (existingIndex === -1) mergedDocuments.push(doc);
        else mergedDocuments[existingIndex] = doc;
      });

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
        designation: formData.designation || currentTags.join(', '),
        personalDetails: {
          ...personalDetails,
        },
        professionalOtherDetails: {
          ...professionalOtherDetails,
        },
        employeeType: formData.employeeType ?? undefined,
        department: formData.department ?? undefined,
        joiningDate: formData.joiningDate,
        moduleAccessPayload: moduleAccessPayload,
        clientId: clientId,
        is_cpd_involved: formData.is_cpd_involved === true,
        documents: mergedDocuments,
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
      if (closeAfterSave) {
        handleClose();
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmit = async () => {
    if (currentStep !== steps.length - 1) return;
    await persistUserChanges(true);
  };

  const handleStepSave = async () => {
    if (currentStep === 0) {
      if (!isBasicStepValid() || emailValidation === 'checking') {
        toast.error('Please fill in all required fields correctly before saving');
        return;
      }
      await persistUserChanges(true);
      return;
    }

    if (currentStep === 1 || currentStep === professionalDetailsStepIndex) {
      if (!isProfessionalStepValid()) {
        toast.error('Please fill in all required fields correctly before saving');
        return;
      }
      await persistUserChanges(true);
      return;
    }

    await persistUserChanges(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <WizardProgress
          steps={[...steps]}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />
        <form
          onSubmit={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (
              e.key === 'Enter' &&
              (e.target as HTMLElement).id !== 'employee-tags'
            ) {
              e.preventDefault();
            }
          }}
          noValidate
          className="space-y-4 overflow-y-auto pr-1 px-4"
        >
          <div className="grid gap-4">
            {currentStep === 0 && (
              <div className="min-h-[420px]">
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

            <div className="space-y-2 mb-3">
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
              <Label>Address</Label>

              <textarea
                value={personalDetails.residenceAddress || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personalDetails: {
                      ...personalDetails,
                      residenceAddress: e.target.value
                    }
                  })
                }
                placeholder="Enter residence address"
                className="min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
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
              </div>
            )}

              {currentStep === personalDetailsStepIndex && (  
                <div className="max-h-[500px] overflow-y-auto ps-1 pe-1 no-scrollbar">

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Middle Name</Label>
                        <Input
                          value={personalDetails.middleName || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              personalDetails: {
                                ...personalDetails,
                                middleName: e.target.value
                              }
                            })
                          }
                          placeholder="Enter middle name"
                          className={personalDetailsErrors.middleName ? 'border-red-500' : ''}
                        />
                        {personalDetailsErrors.middleName && (
                          <p className="text-xs text-red-500">{personalDetailsErrors.middleName}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Father's Name</Label>
                        <Input
                          value={personalDetails.fatherName || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              personalDetails: {
                                ...personalDetails,
                                fatherName: e.target.value
                              }
                            })
                          }
                          placeholder="Enter father's name"
                          maxLength={EMPLOYEE_PERSONAL_INFO_CONSTANTS.MAX_LENGTH}
                          className={personalDetailsErrors.fatherName ? 'border-red-500' : ''}
                        />
                        {personalDetailsErrors.fatherName && (
                          <p className="text-xs text-red-500">{personalDetailsErrors.fatherName}</p>
                        )}
                      </div>
                    </div>                                               

                  <div className="space-y-2 mt-2">
                    <Label>Experience</Label>
                    <Input
                      value={personalDetails.experience || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          personalDetails: {
                            ...personalDetails,
                            experience: e.target.value.replace(/\D/g, '').slice(0, EXPERIENCE_CONSTANTS.MAX_LENGTH)
                          }
                        })
                      }
                      maxLength={EXPERIENCE_CONSTANTS.MAX_LENGTH}
                      placeholder="Enter Experience"
                    />
                    {personalDetailsErrors.experience && (
                      <p className="text-xs text-red-500">
                        {personalDetailsErrors.experience}
                      </p>
                    )}
                  </div>                

                <div className="space-y-2 mt-2">
                  <Label>Qualification</Label>
                  <Input
                    value={personalDetails.qualification || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personalDetails: {
                          ...personalDetails,
                          qualification: e.target.value.replace(/[^a-zA-Z\s.-]/g, '')
                        }
                      })
                    }
                    placeholder="Enter Qualification"
                    maxLength={EMPLOYEE_PERSONAL_INFO_CONSTANTS.MAX_LENGTH}
                  />
                  {personalDetailsErrors.qualification && (
                    <p className="text-xs text-red-500">
                      {personalDetailsErrors.qualification}
                    </p>
                  )}
                </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2 mt-2">
                        <Label>Gender</Label>
                        <Select
                          value={personalDetails.gender || ''}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              personalDetails: {
                                ...personalDetails,
                                gender: value
                              }
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>DOB</Label>
                        <Input                      type="date"
                      value={personalDetails.dob || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          personalDetails: {
                            ...personalDetails,
                            dob: e.target.value
                          }
                        })
                      }
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {personalDetailsErrors.dob && (
                      <p className="text-xs text-red-500">{personalDetailsErrors.dob}</p>
                    )}
                  </div>

                      <div className="space-y-2">
                        <Label>Religion</Label>
                        <Input
                          value={personalDetails.religion || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              personalDetails: {
                                ...personalDetails,
                                religion: e.target.value
                              }
                            })
                          }
                          placeholder="Enter religion"
                          maxLength={EMPLOYEE_PERSONAL_INFO_CONSTANTS.MAX_LENGTH}
                          className={personalDetailsErrors.religion ? 'border-red-500' : ''}
                        />
                        {personalDetailsErrors.religion && (
                          <p className="text-xs text-red-500">{personalDetailsErrors.religion}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Nationality</Label>
                        <Input
                          value={personalDetails.nationality || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              personalDetails: {
                                ...personalDetails,
                                nationality: e.target.value
                              }
                            })
                          }
                          placeholder="Enter nationality"
                          maxLength={EMPLOYEE_PERSONAL_INFO_CONSTANTS.MAX_LENGTH}
                          className={personalDetailsErrors.nationality ? 'border-red-500' : ''}
                        />
                        {personalDetailsErrors.nationality && (
                          <p className="text-xs text-red-500">{personalDetailsErrors.nationality}</p>
                        )}
                      </div>

                      <div className="space-y-2 mb-3">
                        <Label>Blood Group</Label>
                        <Input
                          value={personalDetails.bloodGroup || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              personalDetails: {
                                ...personalDetails,
                                bloodGroup: e.target.value.replace(/[^a-zA-Z0-9+\-\s]/g, '').toUpperCase().slice(0, 12)
                              }
                            })
                          }
                          placeholder="Enter blood group"
                          className={personalDetailsErrors.bloodGroup ? 'border-red-500' : ''}
                        />
                        {personalDetailsErrors.bloodGroup && (
                          <p className="text-xs text-red-500">{personalDetailsErrors.bloodGroup}</p>
                        )}
                      </div>
                    </div>
                </div>
              )}

            {currentStep === professionalDetailsStepIndex && (
              <div className="h-[420px] overflow-y-auto no-scrollbar ps-1 pe-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 pr-2">
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
                        ref={joiningDateRef}
                        value={formData.joiningDate || ''}
                        onChange={handleJoiningDateChange}
                        onBlur={handleJoiningDateBlur}
                        className={joiningDateError ? 'border-red-500' : ''}
                      />
                      {joiningDateError && (
                        <p className="text-xs text-red-500">{joiningDateError}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2 mt-3">
                      <Label htmlFor="employeeType">Employee Type</Label>
                      <Select
                        value={formData.employeeType}
                        onValueChange={(value) => setFormData({ ...formData, employeeType: value as EmployeeType })}
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
                        onValueChange={(value) => setFormData({ ...formData, department: value as DepartmentType })}
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

                  <div className="space-y-2 pt-1 relative">
                    <button
                      type="button"
                      onClick={() => setShowOtherDetails((prev) => !prev)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background mt-3 px-3 py-2 text-sm"
                      aria-expanded={showOtherDetails}
                      aria-label="Toggle other details"
                    >
                    <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Other Details
                    </Label>

                    <ChevronDown
                      className={`h-4 w-4 shrink-0 opacity-50 transition-transform duration-200 ${
                        showOtherDetails ? "rotate-180" : ""
                      }`}
                    />
                    </button>

                    {showOtherDetails && (
                      <div className="mt-2 p-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label>Aadhaar No</Label>
                            <Input
                              value={formatAadhaarNumber(professionalOtherDetails.aadharNo || '')}
                              onChange={(e) => setFormData({
                                ...formData,
                                professionalOtherDetails: {
                                  ...professionalOtherDetails,
                                  aadharNo: e.target.value.replace(/\D/g, '').slice(0, 12)
                                }
                              })}
                              inputMode="numeric"
                              placeholder="Enter Aadhaar number"
                            />
                            {professionalOtherDetailsErrors.aadharNo && (
                              <p className="text-xs text-red-500">{professionalOtherDetailsErrors.aadharNo}</p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label>PAN No</Label>
                            <Input
                              value={professionalOtherDetails.panNo || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                professionalOtherDetails: {
                                  ...professionalOtherDetails,
                                  panNo: e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10)
                                }
                              })}
                              placeholder="Enter PAN number"
                            />
                            {professionalOtherDetailsErrors.panNo && (
                              <p className="text-xs text-red-500">{professionalOtherDetailsErrors.panNo}</p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label>ESI No</Label>
                            <Input
                              value={professionalOtherDetails.esiNo || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                professionalOtherDetails: {
                                  ...professionalOtherDetails,
                                  esiNo: e.target.value.replace(/\D/g, '').slice(0, 10)
                                }
                              })}
                              placeholder="Enter ESI number"
                            />
                            {professionalOtherDetailsErrors.esiNo && (
                              <p className="text-xs text-red-500">{professionalOtherDetailsErrors.esiNo}</p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label>PF No</Label>
                            <Input
                              value={professionalOtherDetails.pfNo || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                professionalOtherDetails: {
                                  ...professionalOtherDetails,
                                  pfNo: e.target.value.replace(/\D/g, '').slice(0, 12)
                                }
                              })}
                              placeholder="Enter PF number"
                            />
                            {professionalOtherDetailsErrors.pfNo && (
                              <p className="text-xs text-red-500">{professionalOtherDetailsErrors.pfNo}</p>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label>Resigning / Termination Date</Label>
                            <Input
                              type="date"
                              value={professionalOtherDetails.exitDate || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                professionalOtherDetails: {
                                  ...professionalOtherDetails,
                                exitDate: e.target.value
                              }
                            })}
                            max={new Date().toISOString().split('T')[0]}
                          />
                          {professionalOtherDetailsErrors.exitDate && (
                            <p className="text-xs text-red-500">{professionalOtherDetailsErrors.exitDate}</p>
                          )}
                        </div>
                          <div className="space-y-1.5">
                            <Label>Biometric User ID</Label>
                            <Input
                              value={professionalOtherDetails.biometricUserId || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                professionalOtherDetails: {
                                  ...professionalOtherDetails,
                                biometricUserId: e.target.value
                              }
                            })}
                            maxLength={BIOMETRIC_USER_ID_CONSTANTS.MAX_LENGTH}
                              placeholder="Enter biometric user ID"
                            />
                            {professionalOtherDetailsErrors.biometricUserId && (
                              <p className="text-xs text-red-500">{professionalOtherDetailsErrors.biometricUserId}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-100 mt-3 mb-4">
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
            )}

            {moduleAccessStepIndex !== -1 && currentStep === moduleAccessStepIndex && (
              <>
                <div className="h-[420px] overflow-y-auto no-scrollbar">
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Module Access
                    </Label>
                    <ModuleAccess
                      selectedModules={selectedModules}
                      onModuleChange={handleModuleChange}
                      employeeId={formData.employeeId}
                      isSuperAdmin={targetIsSuperAdmin}
                    />
                    {!(selectedModules?.some((module) => module.enabled) ?? false) && (
                      <p className="text-xs text-red-500">
                        Please select at least one module.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {currentStep === documentsStepIndex && (
              <>
                <div className="h-[420px] overflow-y-auto mb-5 pr-1 pb-2">
                  <div className="space-y-4">
                    {EMPLOYEE_COMPLIANCE_DOCUMENTS.map((document) => {
                      const fileName = uploadedDocuments[document.key];
                      const fileMeta = documentMetaByKey[document.key];
                      return (
                        <div key={document.key} className="space-y-2">
                          <Label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            {document.label}
                          </Label>
                          <div
                            onClick={() => openDocumentPicker(document.key)}
                            className="group flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 transition-colors hover:border-blue-400 hover:shadow-sm"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-2.5">
                              <FileText
                                className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-blue-600"
                                aria-hidden
                              />
                              <span className="truncate text-sm text-slate-600 transition-colors group-hover:text-slate-900">
                                {fileName || `Upload ${document.label}`}
                              </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {fileName && fileMeta?.bucket && fileMeta?.storagePath && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleViewDocument(document.key);
                                  }}
                                  className="text-blue-600 hover:text-blue-700"
                                  aria-label={`View ${document.label}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              )}
                              {fileName && fileMeta?.source !== 'verification' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveDocument(document.key);
                                  }}
                                  className="text-red-500 hover:text-red-600"
                                  aria-label={`Remove ${document.label}`}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDocumentPicker(document.key);
                                }}
                                className="text-blue-600 hover:text-blue-700"
                                aria-label={`Upload ${document.label}`}
                              >
                                <Upload className="h-4 w-4" />
                              </button>
                            </div>
                            <input
                              ref={(element) => {
                                documentInputRefs.current[document.key] = element;
                              }}
                              type="file"
                              className="hidden"
                              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                              onChange={(e) => handleDocumentChange(document.key, e.target.files?.[0] ?? null)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </>
            )}
          </div>
          <DialogFooter>
            {currentStep < steps.length - 1 ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleStepSave}
                  disabled={isUpdating || isLoading || !canProceedToNextStep()}
                  className="h-10 px-6 text-base"
                >
                  {(isUpdating || isLoading) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save
                </Button>

              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
                  disabled={isUpdating || isLoading}
                >                  
                  <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                </Button>
              )}
            
                <Button
                  type="button"
                  onClick={() => {
                    if (!canProceedToNextStep()) {
                      toast.error('Please fill in all required fields correctly before continuing');
                      return;
                    }
                    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
                  }}
                  disabled={isUpdating || isLoading || !canProceedToNextStep()}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
                  disabled={isUpdating || isLoading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    !isFormValid() ||
                    employeeIdValidation === 'checking' ||
                    emailValidation === 'checking' ||
                    !!joiningDateError
                  }>
                  {(isUpdating || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update User
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;
