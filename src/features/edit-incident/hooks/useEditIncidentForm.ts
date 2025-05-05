
import { useEffect, useState } from 'react';
import { Person, FileItem, IncidentType } from '@/types/incident';
import { useIncidents } from '@/contexts/IncidentContext';
import { ConfigItem } from '@/contexts/types';

export const useEditIncidentForm = () => {
  const { users, categories, locations, facilities } = useIncidents();
  
  // Form data state
  const [formData, setFormData] = useState({
    id: '',
    ticketId: '',
    type: '',
    status: '',
    categoryId: '',
    subcategory: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].slice(0, 5),
    locationId: '',
    facilityId: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    owner: ''
  });
  
  // Image state
  const [image, setImage] = useState<string | undefined>(undefined);
  
  // People involved state
  const [peopleInvolved, setPeopleInvolved] = useState<Person[]>([]);
  
  // Supporting files state
  const [supportingFiles, setSupportingFiles] = useState<FileItem[]>([]);
  
  // Subcategories state
  const [availableSubcategories, setAvailableSubcategories] = useState<{ id: string; name: string; }[]>([]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form event handlers
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
        date: date.toISOString().split('T')[0]
      }));
    }
    if (timeString) {
      setFormData(prev => ({ ...prev, time: timeString }));
    }
  };
  
  const onImageChange = (imageBase64: string | undefined) => {
    setImage(imageBase64);
  };
  
  const handleFilesChange = (files: FileItem[]) => {
    setSupportingFiles(files);
  };

  // Mock submission handler for now
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => setIsSubmitting(false), 1000);
  };

  // Helper functions to get data for form
  const getCategories = (): ConfigItem[] => {
    return categories;
  };

  const getLocations = (): ConfigItem[] => {
    return locations;
  };

  const getFacilities = (): ConfigItem[] => {
    return facilities;
  };

  const getUsers = () => {
    return users;
  };

  // Get categories for a specific incident type
  const getCategoriesForType = (type: string): ConfigItem[] => {
    // In a real app, you would filter categories based on type
    return categories;
  };

  return {
    formData,
    image,
    supportingFiles,
    peopleInvolved,
    availableSubcategories,
    handleChange,
    handleSelectChange,
    handleDateTimeChange,
    handleFilesChange,
    onImageChange,
    isSubmitting,
    handleSubmit,
    getCategories,
    getLocations,
    getFacilities,
    getUsers,
    getCategoriesForType
  };
};
