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

  // Combined function to handle both date and time changes
  const handleDateTimeChange = (date: Date | undefined, timeString?: string) => {
    if (date) {
      // Update the date
      const formattedDate = date.toISOString().split('T')[0];
      
      // If time is provided, update it too, otherwise keep the current time
      const updatedTime = timeString !== undefined ? timeString : formData.time;
      
      setFormData(prev => ({
        ...prev,
        date: formattedDate,
        time: updatedTime
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
