
import { useState } from 'react';
import { User } from '@/types/incident';
import { IncidentType } from '@/types/incident';

export function useIncidentFormData(currentUser?: User | null) {
  const [formData, setFormData] = useState({
    type: '' as string,
    categoryId: '',
    subcategory: '',
    description: '',
    date: new Date().toISOString().split('T')[0], // Use ISO string date format
    time: new Date().toTimeString().split(' ')[0].slice(0, 5),
    locationId: '',
    facilityId: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    owner: currentUser?.id || '' // Default to current user
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateTimeChange = (date: Date | undefined, timeString?: string) => {
    if (date) {
      setFormData(prev => ({ 
        ...prev, 
        date: date.toISOString().split('T')[0] // Convert Date to string
      }));
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
