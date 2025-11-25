
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

    // Validate type ID
    if (!formData.typeId) {
      newErrors.typeId = 'Report type is required';
    }
    
    // Validate description
    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.trim().length > 200) {
      newErrors.description = 'Description must be maximum 200 characters';
    }
    
    // Validate date
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    // Validate time
    if (!formData.time) {
      newErrors.time = 'Time is required';
    }
    
    // Validate category ID
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    
    // Validate subcategory ID
    if (!formData.subcategoryId) {
      newErrors.subcategoryId = 'Subcategory is required';
    }
    
    // Validate location ID
    if (!formData.locationId) {
      newErrors.locationId = 'Location is required';
    }
    
    // Validate facility ID
    if (!formData.facilityId) {
      newErrors.facilityId = 'Facility is required';
    }
    
    // Validate priority ID
    if (!formData.priorityId) {
      newErrors.priorityId = 'Priority is required';
    }
    
    // Validate owner
    if (!formData.owner) {
      newErrors.owner = 'Assignment is required';
    }
    
    // Enhanced validation for People Involved
    if (peopleInvolved && peopleInvolved.length > 0) {
      peopleInvolved.forEach((person, index) => {
        // Check if this person entry has any meaningful data
        const hasName = person.name && person.name.trim() !== '';
        const hasNonDefaultRole = person.role && person.role !== 'Student';
        const hasNotes = person.notes && person.notes.trim() !== '';
        
        // If any field has a value, then all required fields must be filled
        const hasAnyValue = hasName || hasNonDefaultRole || hasNotes;
        
        if (hasAnyValue) {
          if (!person.role) {
            newErrors[`peopleInvolved.${index}.role`] = `Person ${index + 1}: Role is required`;
          }
          
          if (!person.name || person.name.trim() === '') {
            newErrors[`peopleInvolved.${index}.name`] = `Person ${index + 1}: Name is required`;
          }
        }
        
        // If there are multiple people involved, make all fields mandatory for each person
        if (peopleInvolved.length > 1) {
          if (!person.role) {
            newErrors[`peopleInvolved.${index}.role`] = `Person ${index + 1}: Role is required when multiple people are involved`;
          }
          
          if (!person.name || person.name.trim() === '') {
            newErrors[`peopleInvolved.${index}.name`] = `Person ${index + 1}: Name is required when multiple people are involved`;
          }
        }
      });
    }
    
    setErrors(newErrors);
    
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  };

  return {
    errors,
    validateForm,
    setErrors
  };
}
