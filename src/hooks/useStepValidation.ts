
import { useMemo } from 'react';
import { ClientFormData } from './useClientManagement';

export const useStepValidation = (formData: ClientFormData) => {
  const validateStep1 = useMemo(() => {
    return !!(
      formData.name &&
      formData.email &&
      formData.contactPerson &&
      formData.phone &&
      formData.superAdminEmail &&
      formData.clientTypeId &&
      formData.institutionType
    );
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
    // Step 3 is always valid since auth settings are optional
    return true;
  }, []);

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
