
import { useState } from 'react';

type IncidentFormData = {
  type: string;
  description: string;
  date: string;
  time: string;
  locationId: string;
  categoryId: string;
  subcategory?: string;
  priority: string;
  [key: string]: any;
};

type ValidationErrors = {
  type?: string;
  description?: string;
  date?: string;
  time?: string;
  locationId?: string;
  categoryId?: string;
  subcategory?: string;
  priority?: string;
  [key: string]: string | undefined;
};

export function useIncidentFormValidation() {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateForm = (formData: IncidentFormData): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    // Required fields
    if (!formData.type) {
      newErrors.type = 'Incident type is required';
      isValid = false;
    }

    if (!formData.description || formData.description.length < 10) {
      newErrors.description = 'A detailed description (at least 10 characters) is required';
      isValid = false;
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
      isValid = false;
    }

    if (!formData.time) {
      newErrors.time = 'Time is required';
      isValid = false;
    }

    if (!formData.locationId) {
      newErrors.locationId = 'Location is required';
      isValid = false;
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
      isValid = false;
    }

    if (!formData.priority) {
      newErrors.priority = 'Priority is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  return {
    errors,
    validateForm
  };
}
