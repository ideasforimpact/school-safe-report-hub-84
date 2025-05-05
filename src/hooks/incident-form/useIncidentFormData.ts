
import { useState } from 'react';
import { User as AuthUser } from '@/contexts/auth/types';

// Initial form data state
const initialFormData = {
  type: 'Incident',
  description: '',
  rootCause: '',
  date: new Date(),
  locationId: '',
  location: '',
  categoryId: '',
  subcategory: '',
  facilityId: '',
  priority: 'Medium',
  status: 'Open'
};

export function useIncidentFormData(user: AuthUser | null) {
  // Form data state
  const [formData, setFormData] = useState({
    ...initialFormData,
    reportedById: user?.id || '',
    reportedBy: user?.name || ''
  });

  // Form change handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateTimeChange = (date: Date) => {
    setFormData(prev => ({ ...prev, date }));
  };

  return {
    formData,
    setFormData,
    handleChange,
    handleSelectChange,
    handleDateTimeChange
  };
}
