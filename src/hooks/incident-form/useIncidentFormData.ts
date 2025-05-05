
import { useState } from 'react';
import { User as AuthUser } from '@/contexts/auth/types';

// Initial form data state with updated fields to match what's expected in ReportIncident.tsx
const initialFormData = {
  type: 'Incident',
  description: '',
  rootCause: '',
  date: new Date(),
  time: new Date().toTimeString().split(' ')[0].slice(0, 5), // Add time field
  locationId: '',
  location: '',
  categoryId: '',
  subcategory: '',
  facilityId: '',
  priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical', // Ensure correct type
  status: 'Open',
  owner: '' // Add owner field
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

  const handleDateTimeChange = (date: Date | undefined, timeString?: string) => {
    if (date) {
      setFormData(prev => ({ ...prev, date }));
    }
    if (timeString) {
      setFormData(prev => ({ ...prev, time: timeString }));
    }
  };

  return {
    formData,
    setFormData,
    handleChange,
    handleSelectChange,
    handleDateTimeChange
  };
}
