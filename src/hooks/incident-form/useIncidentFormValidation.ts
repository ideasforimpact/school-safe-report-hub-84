
import { useState } from 'react';
import { Person } from '@/types/incident';

// Define the structure with an index signature for string keys
export interface FormErrors {
  [key: string]: string;
}

export function useIncidentFormValidation() {
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (formData: any, peopleInvolved: Person[] = []) => {
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
    } else if (formData.description.trim().length > 250) {
      newErrors.description = 'Description must be maximum 250 characters';
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
    
    // Validate facility
    if (!formData.facilityId) {
      newErrors.facilityId = 'Facility is required';
    }
    
    // Validate priority
    if (!formData.priority) {
      newErrors.priority = 'Priority is required';
    }
    
    // Validate owner
    if (!formData.owner) {
      newErrors.owner = 'Assignment is required';
    }
    
    // Validate People Involved - only if someone has been added
    if (peopleInvolved && peopleInvolved.length > 0) {
      peopleInvolved.forEach((person, index) => {
        // Only validate if at least one field is filled (partial entry)
        const hasAnyValue = person.name.trim() || person.role || person.notes?.trim();
        
        if (hasAnyValue) {
          // If any field has a value, then all required fields must be filled
          if (!person.role || person.role === '') {
            newErrors[`peopleInvolved.${index}.role`] = 'Role is required';
          }
          
          if (!person.name || person.name.trim() === '') {
            newErrors[`peopleInvolved.${index}.name`] = 'Name is required';
          }
        }
      });
    }
    
    setErrors(newErrors);
    
    return Object.keys(newErrors).length === 0;
  };

  return {
    errors,
    validateForm,
    setErrors
  };
}
