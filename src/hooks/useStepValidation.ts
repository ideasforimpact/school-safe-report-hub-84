
import { useMemo } from 'react';
import { ClientFormData } from './useClientManagement';
import { isValidEmail } from '@/services/employee/utils/employeeValidationUtils';
import { isValidClientName, isValidContactPerson, isValidPhone } from '@/components/backoffice/tabs/BasicInfoTab';

export const useStepValidation = (formData: ClientFormData) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const hasValidClientName =isValidClientName(formData.name);
  const hasValidContactPerson =isValidContactPerson(formData.contactPerson);

  const hasValidPhone =isValidPhone(formData.phone);
  const validateStep1 = useMemo(() => {
  const hasRequired =
    !!formData.email &&
    !!formData.name &&
    !!formData.contactPerson &&
    !!formData.phone &&
    !!formData.clientTypeId &&
    !!formData.institutionType;

    const hasValidSuperAdminEmail =
    isValidEmail(formData.superAdminEmail) &&
    formData.superAdminEmailExists === false && 
    isValidClientName; 

  const hasValidHeadOfficeMapping =
    formData.isHeadOffice !== true ||
    ((formData.mappedClientIds?.length || 0) > 0);

  return hasRequired && hasValidSuperAdminEmail && hasValidClientName
  && hasValidContactPerson && hasValidPhone && hasValidHeadOfficeMapping;
}, [
    formData.name,
    formData.email,
    formData.contactPerson,
    formData.phone,
    formData.superAdminEmail,
    formData.clientTypeId,
    formData.superAdminEmailExists,
    formData.institutionType,
    formData.isHeadOffice,
    formData.mappedClientIds
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
