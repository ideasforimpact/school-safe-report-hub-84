
import { useState, useCallback } from 'react';
import { useIncidents } from '@/contexts/IncidentContext';
import { Person } from '@/types/incident';
import { FileItem } from '@/types/fileTypes';
import { v4 as uuidv4 } from 'uuid';
import { useSelectedValues } from '@/hooks/useSelectedValues';
import { getAllCampuses } from '@/services/campus/campusService';

// Initial person object
const initialPerson: Person = {
  name: '',
  role: 'Student' as const,
  notes: ''
};

export function useIncidentForm() {
  const { 
    facilities,
    users,
    generateTicketId
  } = useIncidents();

  // State for form data
  const [formData, setFormData] = useState({
    type: 'Incident',
    categoryId: '',
    subcategory: '',
    description: '',
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
    time: new Date().toTimeString().slice(0, 5), // Current time in HH:MM
    locationId: '',
    facilityId: '',
    location: '', // Additional location details
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    owner: ''
  });

  // State for supporting files
  const [supportingFiles, setSupportingFiles] = useState<FileItem[]>([]);
  
  // State for people involved
  const [peopleInvolved, setPeopleInvolved] = useState<Person[]>([{ ...initialPerson }]);
  
  // State for submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Calculate next ticket ID
  const nextTicketId = generateTicketId();

  const { getSelectedLocation, getSelectedFacility } = useSelectedValues(
    formData.categoryId,
    formData.locationId,
    formData.facilityId,
    [], // Categories will come from context, not used here
    [], // Locations will be directly fetched from database
    facilities
  );

  // Form field update handlers
  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear subcategory when category changes
    if (name === 'categoryId') {
      setFormData(prev => ({ ...prev, subcategory: '' }));
    }

    // Clear facility when location changes
    if (name === 'locationId') {
      setFormData(prev => ({ ...prev, facilityId: '' }));
    }
  };

  const handleDateTimeChange = (date: Date | undefined, timeString?: string) => {
    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, date: dateStr }));
    }
    if (timeString) {
      setFormData(prev => ({ ...prev, time: timeString }));
    }
  };

  // People involved handlers
  const handlePersonChange = (index: number, field: keyof Person, value: string) => {
    setPeopleInvolved(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addPerson = () => {
    setPeopleInvolved(prev => [...prev, { ...initialPerson, id: uuidv4() }]);
  };

  const removePerson = (index: number) => {
    setPeopleInvolved(prev => prev.filter((_, i) => i !== index));
  };

  // File change handler
  const handleFilesChange = useCallback((files: FileItem[]) => {
    setSupportingFiles(files);
  }, []);

  return {
    nextTicketId,
    formData,
    supportingFiles,
    peopleInvolved,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    handleSelectChange,
    handleDateTimeChange,
    handlePersonChange,
    addPerson,
    removePerson,
    handleFilesChange,
    getSelectedLocation,
    getSelectedFacility,
    facilities,
    users
  };
}
