
import { useMemo } from 'react';
import { ClientFormData } from './useClientManagement';

export const useStepValidation = (formData: ClientFormData) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = (email?: string) => !!email && emailRegex.test(email);
  const isValidPhone = (phone?: string) => !!phone && /[0-9+()\-\s]{7,20}/.test(phone);

  const validateStep1 = useMemo(() => {
    const hasRequired = !!(
      formData.name &&
      formData.email &&
      formData.contactPerson &&
      formData.phone &&
      formData.superAdminEmail &&
      formData.clientTypeId &&
      formData.institutionType
    );
    if (!hasRequired) return false;

    // Field-specific rules
    if (formData.name.length > 50) return false;
    if (formData.contactPerson.length > 20) return false;
    if (!isValidEmail(formData.email)) return false;
    if (!isValidEmail(formData.superAdminEmail)) return false;
    if (!isValidPhone(formData.phone)) return false;
    return true;
  }, [
    formData.name,
    formData.email,
    formData.contactPerson,
    formData.phone,
    formData.superAdminEmail,
    formData.clientTypeId,
    formData.institutionType
  ]);

  const validateStep2 = useMemo(() => {
    return !!(formData.moduleInfoArray && formData.moduleInfoArray.length > 0);
  }, [formData.moduleInfoArray]);

  const validateStep3 = useMemo(() => {
    // Check if user has configured any authentication settings
    const hasAllowedDomains = formData.allowedDomains && formData.allowedDomains.length > 0;
    const hasSuperAdminDomains = formData.superAdminAllowedDomains && formData.superAdminAllowedDomains.length > 0;
    const hasAuthProviders = formData.authProviders && Object.values(formData.authProviders).some(enabled => enabled === true);
    
    // Step 3 is valid if at least one authentication setting is configured
    return hasAllowedDomains || hasSuperAdminDomains || hasAuthProviders;
  }, [formData.allowedDomains, formData.superAdminAllowedDomains, formData.authProviders]);

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        return validateStep1;
      case 1:
        return validateStep2;
      case 2:
        return validateStep3;
      default:
        return false;
    }
  };

  const getCompletedSteps = (): number[] => {
    const completed: number[] = [];
    if (validateStep1) completed.push(0);
    if (validateStep2) completed.push(1);
    if (validateStep3) completed.push(2);
    return completed;
  };

  return {
    isStepValid,
    getCompletedSteps,
    canProceedToNext: (currentStep: number) => isStepValid(currentStep),
    canSubmit: validateStep1 && validateStep2 && validateStep3
  };
};
