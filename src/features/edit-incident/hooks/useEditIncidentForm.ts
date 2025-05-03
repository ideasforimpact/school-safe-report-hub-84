
import { useEffect, useState } from 'react';
import { Person } from '@/types/incident';
import { subcategories, nearMissSubcategories, unsafeConditionSubcategories } from '@/contexts/IncidentContext';
import { IncidentType } from '@/types/incident';

export const useEditIncidentForm = (
  initialFormData: {
    type: string;
    category: string;
    subcategory: string;
    description: string;
    rootCause: string;
    date: string;
    time: string;
    location: string;
    status: string;
    owner: string;
    facility: string;
    image: string | undefined;
  },
  initialPeopleInvolved: Person[]
) => {
  // Form data state
  const [formData, setFormData] = useState(initialFormData);
  
  // People involved state
  const [peopleInvolved, setPeopleInvolved] = useState<Person[]>(initialPeopleInvolved);
  
  // Subcategories state
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);

  // Form event handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (imageBase64: string | undefined) => {
    setFormData(prev => ({ ...prev, image: imageBase64 }));
  };

  // Update available subcategories when type or category changes
  useEffect(() => {
    if (!formData.type || !formData.category) {
      setAvailableSubcategories([]);
      return;
    }

    if (formData.type === 'Incident') {
      setAvailableSubcategories(subcategories[formData.category as keyof typeof subcategories] || []);
    } else if (formData.type === 'Near Miss') {
      const nearMissCategory = formData.category;
      const subcats = nearMissSubcategories[nearMissCategory as keyof typeof nearMissSubcategories] || [];
      setAvailableSubcategories(subcats);
    } else if (formData.type === 'Unsafe Condition') {
      const unsafeCategory = formData.category;
      const subcats = unsafeConditionSubcategories[unsafeCategory as keyof typeof unsafeConditionSubcategories] || [];
      setAvailableSubcategories(subcats);
    }
  }, [formData.type, formData.category]);

  // Get categories based on selected type
  const getCategoriesForType = (type: IncidentType): string[] => {
    if (type === 'Incident') {
      return Object.keys(subcategories);
    } else if (type === 'Near Miss') {
      return Object.keys(nearMissSubcategories);
    } else if (type === 'Unsafe Condition') {
      return Object.keys(unsafeConditionSubcategories);
    }
    return [];
  };

  return {
    formData,
    setFormData,
    peopleInvolved,
    setPeopleInvolved,
    availableSubcategories,
    setAvailableSubcategories,
    handleChange,
    handleSelectChange,
    handleImageChange,
    getCategoriesForType
  };
};
