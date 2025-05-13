
import { useState } from 'react';

// Define the structure with an index signature for string keys
export interface FormErrors {
  [key: string]: string;
}

export function useIncidentFormValidation() {
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (formData: any) => {
    const newErrors: FormErrors = {};

    // Validate type
    if (!formData.type) {
      newErrors.type = 'Please select an incident type';
    }
    
    // Validate description
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    // Validate date
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    // Validate time
    if (!formData.time) {
      newErrors.time = 'Time is required';
    }
    
    // Validate category
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    
    // Validate subcategory
    if (formData.categoryId && !formData.subcategory) {
      newErrors.subcategory = 'Subcategory is required';
    }
    
    // Validate location
    if (!formData.locationId) {
      newErrors.locationId = 'Location is required';
    }
    
    // Validate priority
    if (!formData.priority) {
      newErrors.priority = 'Priority is required';
    }
    
    setErrors(newErrors);
    
    return Object.keys(newErrors).length === 0;
  };

  return {
    errors,
    validateForm
  };
}
