
import { useEffect, useState } from 'react';
import { Person, FileItem, IncidentType } from '@/types/incident';
import { useIncidents } from '@/contexts/IncidentContext';
import { ConfigItem } from '@/contexts/types';
import { useParams } from 'react-router-dom';
import { useSubcategories } from '@/hooks/useSubcategories';
import { toast } from 'sonner';

export const useEditIncidentForm = () => {
  const { id } = useParams<{ id: string }>();
  const { 
    users, 
    categories, 
    locations, 
    facilities, 
    getIncident,
    subcategoryMappings
  } = useIncidents();
  
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
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load incident data when component mounts
  useEffect(() => {
    if (!id) return;
    
    const incident = getIncident(id);
    if (!incident) {
      toast.error("Incident not found");
      return;
    }
    
    // Find category ID
    const categoryId = categories.find(c => c.name === incident.category)?.id || '';
    
    // Find location ID
    const locationId = locations.find(l => l.name === incident.location)?.id || '';
    
    // Find facility ID
    const facilityId = facilities.find(f => f.name === incident.facility)?.id || '';
    
    // Extract time from date
    const date = new Date(incident.date);
    const formattedDate = date.toISOString().split('T')[0];
    const formattedTime = date.toTimeString().split(' ')[0].slice(0, 5);
    
    setFormData({
      id: incident.id,
      ticketId: incident.ticketId,
      type: incident.type,
      status: incident.status,
      categoryId,
      subcategory: incident.subcategory || '',
      description: incident.description,
      date: formattedDate,
      time: formattedTime,
      locationId,
      facilityId,
      priority: incident.priority || 'Medium',
      owner: incident.owner?.id || ''
    });
    
    // Set image if available
    if (incident.image) {
      setImage(incident.image);
    }
    
    // Set people involved
    if (incident.peopleInvolved) {
      setPeopleInvolved([...incident.peopleInvolved]);
    }
    
    // Set supporting files if available
    if (incident.documents) {
      const files = incident.documents.map((doc, index) => ({
        id: `doc-${index}`,
        name: doc.name,
        type: doc.type,
        size: doc.data.length * 0.75, // Approximate size from base64
        base64: doc.data
      }));
      setSupportingFiles(files);
    }
    
  }, [id, getIncident, categories, locations, facilities]);

  // Setup subcategory handling
  const { availableSubcategories } = useSubcategories(
    formData.categoryId,
    subcategoryMappings,
    setFormData
  );

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
