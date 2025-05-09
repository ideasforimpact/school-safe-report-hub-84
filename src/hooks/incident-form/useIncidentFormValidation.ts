
import { useState } from 'react';

interface FormData {
  type: string;
  description: string;
  categoryId: string;
  subcategory: string;
  date: string;
  time: string;
  locationId: string;
  location: string;
  facilityId: string;
  priority: string;
}

interface FormErrors {
  description?: string;
  categoryId?: string;
  subcategory?: string;
  date?: string;
  time?: string;
  locationId?: string;
  facilityId?: string;
}

export function useIncidentFormValidation() {
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (formData: FormData): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validate description
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
      isValid = false;
    }

    // Validate category
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
      isValid = false;
    }

    // Validate subcategory if a category is selected
    if (formData.categoryId && !formData.subcategory) {
      newErrors.subcategory = 'Subcategory is required';
      isValid = false;
    }

    // Validate location
    if (!formData.locationId) {
      newErrors.locationId = 'Location is required';
      isValid = false;
    }

    // Validate date
    if (!formData.date) {
      newErrors.date = 'Date is required';
      isValid = false;
    }

    // Validate time
    if (!formData.time) {
      newErrors.time = 'Time is required';
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
