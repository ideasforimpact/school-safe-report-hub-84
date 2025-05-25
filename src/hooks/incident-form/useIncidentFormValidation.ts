
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

    // Validate type - check for typeId instead of type
    if (!formData.typeId && !formData.type) {
      newErrors.typeId = 'Report type is required';
    }
    
    // Validate description
    if (!formData.description?.trim()) {
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
    
    // Validate category - check for categoryId
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    
    // Validate subcategory - check for subcategoryId
    if (formData.categoryId && !formData.subcategoryId && !formData.subcategory) {
      newErrors.subcategoryId = 'Subcategory is required';
    }
    
    // Validate location - check for locationId
    if (!formData.locationId) {
      newErrors.locationId = 'Location is required';
    }
    
    // Validate facility - check for facilityId
    if (!formData.facilityId) {
      newErrors.facilityId = 'Facility is required';
    }
    
    // Validate priority - check for priorityId
    if (!formData.priorityId && !formData.priority) {
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
    
    return Object.keys(newErrors).length === 0;
  };

  return {
    errors,
    validateForm,
    setErrors
  };
}
