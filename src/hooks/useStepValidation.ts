
import { useMemo } from 'react';
import { ClientFormData } from './useClientManagement';

export const useStepValidation = (formData: ClientFormData) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = (email?: string) => !!email && emailRegex.test(email);
  const isValidPhone = (phone?: string) => !!phone && /[0-9+()\-\s]{7,20}/.test(phone);

  const validateStep1 = useMemo(() => {
    // Presence-only validation for smoother UX on step navigation
    const hasRequired = !!(
      formData.name &&
      formData.email &&
      formData.contactPerson &&
      formData.phone &&
      formData.superAdminEmail &&
      formData.clientTypeId &&
      formData.institutionType
    );
    return hasRequired;
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
    // Require all three: at least one allowed domain, one super admin domain, and one auth provider enabled
    const hasAllowedDomains = !!(formData.allowedDomains && formData.allowedDomains.length > 0);
    const hasSuperAdminDomains = !!(formData.superAdminAllowedDomains && formData.superAdminAllowedDomains.length > 0);
    const hasAuthProviders = !!(formData.authProviders && Object.values(formData.authProviders).some(enabled => enabled === true));

    return hasAllowedDomains && hasSuperAdminDomains && hasAuthProviders;
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
