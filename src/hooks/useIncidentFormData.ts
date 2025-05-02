
import { useState, useEffect } from 'react';
import { IncidentStatus, IncidentType } from '@/types/incident';

export function useIncidentFormData() {
  // Form data state
  const [formData, setFormData] = useState({
    type: '' as IncidentType,
    categoryId: '',
    subcategory: '',
    description: '',
    rootCause: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].slice(0, 5),
    locationId: '',
    facilityId: '',
    status: 'Open' as IncidentStatus,
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical'
  });

  // Form handling functions
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle both date and time changes in one function
  const handleDateTimeChange = (date: Date | undefined, timeString?: string) => {
    if (date) {
      // Update the date
      setFormData(prev => ({
        ...prev,
        date: date.toISOString().split('T')[0],
        // If time is provided, update it too
        ...(timeString !== undefined && { time: timeString })
      }));
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
