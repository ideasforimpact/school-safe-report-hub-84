
import { useState, useEffect } from 'react';
import { useIncidents } from '@/contexts/IncidentContext';
import { Person, IncidentStatus, IncidentType } from '@/types/incident';
import { FileItem } from '@/types/fileTypes';

export function useIncidentForm() {
  const { 
    generateTicketId,
    categories,
    subcategoryMappings,
    locations,
    facilities 
  } = useIncidents();

  // State for next ticket ID
  const [nextTicketId, setNextTicketId] = useState('');

  useEffect(() => {
    // Generate a preview of the next ticket ID
    setNextTicketId(generateTicketId());
  }, [generateTicketId]);

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

  // Supporting files state
  const [supportingFiles, setSupportingFiles] = useState<FileItem[]>([]);

  // State for available subcategories based on selected category
  const [availableSubcategories, setAvailableSubcategories] = useState<{id: string, name: string}[]>([]);

  // People involved state
  const [peopleInvolved, setPeopleInvolved] = useState<Person[]>([
    { name: '', role: 'Student' as const, id: '', notes: '' }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update available subcategories when category changes
  useEffect(() => {
    if (!formData.categoryId) {
      setAvailableSubcategories([]);
      return;
    }

    // Get subcategories for this category
    const subcats = subcategoryMappings[formData.categoryId] || [];
    setAvailableSubcategories(subcats);
  }, [formData.categoryId, subcategoryMappings]);

  // Reset subcategory when available subcategories change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      subcategory: ''
    }));
  }, [availableSubcategories]);

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

  const handlePersonChange = (index: number, field: keyof Person, value: string) => {
    const updatedPeople = [...peopleInvolved];
    updatedPeople[index] = { ...updatedPeople[index], [field]: value };
    setPeopleInvolved(updatedPeople);
  };

  const addPerson = () => {
    setPeopleInvolved([...peopleInvolved, { name: '', role: 'Student', id: '', notes: '' }]);
  };

  const removePerson = (index: number) => {
    const updatedPeople = [...peopleInvolved];
    updatedPeople.splice(index, 1);
    setPeopleInvolved(updatedPeople);
  };

  const handleFilesChange = (files: FileItem[]) => {
    setSupportingFiles(files);
  };

  // Helper functions for display/lookup
  const getSelectedCategory = () => {
    const category = categories.find(cat => cat.id === formData.categoryId);
    return category ? category.name : '';
  };

  const getSelectedLocation = () => {
    const location = locations.find(loc => loc.id === formData.locationId);
    return location ? location.name : '';
  };

  const getSelectedFacility = () => {
    const facility = facilities.find(fac => fac.id === formData.facilityId);
    return facility ? facility.name : '';
  };

  return {
    nextTicketId,
    formData,
    setFormData,
    supportingFiles,
    availableSubcategories,
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
    getSelectedCategory,
    getSelectedLocation,
    getSelectedFacility,
    categories,
    locations,
    facilities
  };
}
