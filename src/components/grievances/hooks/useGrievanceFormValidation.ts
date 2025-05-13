
import { useState } from 'react';

interface FormErrors {
  [key: string]: string;
}

const useGrievanceFormValidation = () => {
  const [errors, setErrors] = useState<FormErrors>({});
  
  const validateForm = (name: string, heading: string, description: string) => {
    const newErrors: FormErrors = {};
    
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!heading.trim()) newErrors.heading = 'Grievance heading is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return { errors, validateForm };
};

export default useGrievanceFormValidation;
