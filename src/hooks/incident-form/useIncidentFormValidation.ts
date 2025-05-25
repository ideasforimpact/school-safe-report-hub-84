
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
      newErrors.type = 'Report type cannot be empty';
    }
    
    // Validate description
    if (!formData.description?.trim()) {
      newErrors.description = 'Description cannot be empty';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.trim().length > 250) {
      newErrors.description = 'Description must be maximum 250 characters';
    }
    
    // Validate date
    if (!formData.date) {
      newErrors.date = 'Date cannot be empty';
    }
    
    // Validate time
    if (!formData.time) {
      newErrors.time = 'Time cannot be empty';
    }
    
    // Validate category
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category cannot be empty';
    }
    
    // Validate subcategory
    if (formData.categoryId && !formData.subcategory) {
      newErrors.subcategory = 'Subcategory cannot be empty';
    }
    
    // Validate location
    if (!formData.locationId) {
      newErrors.locationId = 'Location cannot be empty';
    }
    
    // Validate facility
    if (!formData.facilityId) {
      newErrors.facilityId = 'Facility cannot be empty';
    }
    
    // Validate priority
    if (!formData.priority) {
      newErrors.priority = 'Priority cannot be empty';
    }
    
    // Validate owner
    if (!formData.owner) {
      newErrors.owner = 'Assignment cannot be empty';
    }
    
    // Validate People Involved - only if someone has been added
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
            newErrors[`peopleInvolved.${index}.role`] = 'Role cannot be empty';
          }
          
          if (!person.name || person.name.trim() === '') {
            newErrors[`peopleInvolved.${index}.name`] = 'Name cannot be empty';
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
