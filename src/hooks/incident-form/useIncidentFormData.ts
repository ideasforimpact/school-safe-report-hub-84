
import { useState } from 'react';
import { User as AuthUser } from '@/contexts/auth/types';
import { formatUserFullName } from '@/utils/userUtils';

// Initial form data state with updated fields to match what's expected in ReportIncident.tsx
const initialFormData = {
  type: 'Incident',
  description: '',
  rootCause: '',
  date: new Date().toISOString().split('T')[0], // Store as ISO string date
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

export function useIncidentFormData(user: AuthUser | undefined) {
  // Form data state
  const [formData, setFormData] = useState({
    ...initialFormData,
    reportedById: user?.id || '',
    reportedBy: user ? formatUserFullName(user) : ''
  });

  // Form change handlers
  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Updated handleDateTimeChange function to properly handle the parameters
  const handleDateTimeChange = (field: string, value: Date | string) => {
    if (field === 'date' && value instanceof Date) {
      setFormData(prev => ({ 
        ...prev, 
        date: value.toISOString().split('T')[0] // Convert Date to string
      }));
    } else if (field === 'time' && typeof value === 'string') {
      setFormData(prev => ({ ...prev, time: value }));
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
