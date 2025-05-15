
import { useState, useEffect } from 'react';
import { useIncidents } from '@/contexts/incident'; // Keep import path consistent
import { FileItem } from '@/types/fileTypes';
import { Person } from '@/types/incident';
import { User } from '@/types/incident';
import { getAllCampuses } from '@/services/campus/campusService';
import { getFacilitiesByCampus } from '@/services/facility/facilityService';
import { ConfigItem } from '@/contexts/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FormData {
  type: string;
  typeId: string; // Added UUID field
  categoryId: string;
  subcategoryId: string; // Added UUID field for subcategory
  subcategory: string;
  description: string;
  date: string;
  time: string;
  locationId: string;
  facilityId: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  priorityId: string; // Added UUID field
  owner: string;
}

export function useIncidentForm() {
  const { users, generateTicketId } = useIncidents();
  
  const [nextTicketId, setNextTicketId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supportingFiles, setSupportingFiles] = useState<FileItem[]>([]);
  const [locations, setLocations] = useState<ConfigItem[]>([]);
  const [facilities, setFacilities] = useState<ConfigItem[]>([]);
  const [reportTypes, setReportTypes] = useState<{id: string, name: string}[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [subcategories, setSubcategories] = useState<{id: string, name: string, category_id: string}[]>([]);
  const [priorities, setPriorities] = useState<{id: string, name: string}[]>([]);
  const [peopleInvolved, setPeopleInvolved] = useState<Person[]>([
    { name: '', role: 'Student', notes: '' }
  ]);
  
  const [formData, setFormData] = useState<FormData>({
    type: 'Incident',
    typeId: '', // Initialize with empty string
    categoryId: '',
    subcategoryId: '', // Initialize with empty string
    subcategory: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].slice(0, 5),
    locationId: '',
    facilityId: '',
    priority: 'Medium',
    priorityId: '', // Initialize with empty string
    owner: ''
  });

  // Fetch all reference data on component mount
  useEffect(() => {
    const fetchAllReferenceData = async () => {
      try {
        // Fetch report types
        const { data: typesData, error: typesError } = await supabase
          .from('incident_report_types')
          .select('id, name')
          .eq('is_active', true);
        
        if (typesError) {
          console.error('Error fetching report types:', typesError);
          toast.error('Failed to load report types');
        } else if (typesData) {
          console.log('Fetched report types:', typesData);
          setReportTypes(typesData);
          
          // Set default type ID if we have report types
          if (typesData.length > 0) {
            const defaultType = typesData.find(t => t.name === 'Incident') || typesData[0];
            setFormData(prev => ({ 
              ...prev, 
              type: defaultType.name,
              typeId: defaultType.id
            }));
          }
        }
        
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('incident_categories')
          .select('id, name')
          .eq('is_active', true);
        
        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
          toast.error('Failed to load categories');
        } else if (categoriesData) {
          console.log('Fetched categories:', categoriesData);
          setCategories(categoriesData);
        }
        
        // Fetch all subcategories
        const { data: subcategoriesData, error: subcategoriesError } = await supabase
          .from('incident_subcategories')
          .select('id, name, category_id')
          .eq('is_active', true);
        
        if (subcategoriesError) {
          console.error('Error fetching subcategories:', subcategoriesError);
          toast.error('Failed to load subcategories');
        } else if (subcategoriesData) {
          console.log('Fetched subcategories:', subcategoriesData);
          setSubcategories(subcategoriesData);
        }
        
        // Fetch priorities
        const { data: prioritiesData, error: prioritiesError } = await supabase
          .from('incident_priorities')
          .select('id, name')
          .eq('is_active', true);
        
        if (prioritiesError) {
          console.error('Error fetching priorities:', prioritiesError);
          toast.error('Failed to load priorities');
        } else if (prioritiesData) {
          console.log('Fetched priorities:', prioritiesData);
          setPriorities(prioritiesData);
          
          // Set default priority ID if we have priorities
          if (prioritiesData.length > 0) {
            const defaultPriority = prioritiesData.find(p => p.name === 'Medium') || prioritiesData[0];
            setFormData(prev => ({ 
              ...prev, 
              priority: defaultPriority.name as 'Low' | 'Medium' | 'High' | 'Critical',
              priorityId: defaultPriority.id
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching reference data:', error);
        toast.error('Failed to load reference data');
      }
    };

    fetchAllReferenceData();
  }, []);

  // Fetch locations (campuses) on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const campuses = await getAllCampuses();
        console.log('Fetched campuses:', campuses);
        setLocations(campuses);
      } catch (error) {
        console.error('Error fetching campuses:', error);
        toast.error('Failed to load campuses');
      }
    };

    fetchLocations();
  }, []);

  // Fetch facilities when location changes
  useEffect(() => {
    if (!formData.locationId) {
      setFacilities([]);
      return;
    }

    const fetchFacilities = async () => {
      try {
        const facilitiesData = await getFacilitiesByCampus(formData.locationId);
        console.log('Fetched facilities for campus:', formData.locationId, facilitiesData);
        setFacilities(facilitiesData.map(f => ({ id: f.id, name: f.name })));
      } catch (error) {
        console.error('Error fetching facilities:', error);
        toast.error('Failed to load facilities');
      }
    };

    fetchFacilities();
  }, [formData.locationId]);

  // Update subcategory options when category changes
  useEffect(() => {
    if (formData.categoryId && subcategories.length > 0) {
      // Find subcategories for selected category
      const categorySubcategories = subcategories.filter(
        sub => sub.category_id === formData.categoryId
      );
      
      console.log('Filtered subcategories for category:', formData.categoryId, categorySubcategories);
      
      // Reset subcategory selection if current selection is not in the filtered list
      if (formData.subcategoryId) {
        const stillValid = categorySubcategories.some(sub => sub.id === formData.subcategoryId);
        if (!stillValid) {
          setFormData(prev => ({ 
            ...prev, 
            subcategory: '',
            subcategoryId: '' 
          }));
        }
      }
    }
  }, [formData.categoryId, subcategories]);

  // Set next ticket ID
  useEffect(() => {
    // Use the generateTicketId function from the context
    const newTicketId = generateTicketId();
    setNextTicketId(newTicketId);
  }, [generateTicketId]);

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    // Handle special cases where we need to update related fields
    if (name === 'categoryId') {
      // Reset subcategory when category changes
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        subcategory: '',
        subcategoryId: ''
      }));
    } else if (name === 'type') {
      // Find and set the typeId when type name is selected
      const selectedType = reportTypes.find(t => t.name === value);
      if (selectedType) {
        setFormData(prev => ({ 
          ...prev, 
          type: value,
          typeId: selectedType.id
        }));
      } else {
        setFormData(prev => ({ ...prev, type: value, typeId: '' }));
      }
    } else if (name === 'priority') {
      // Find and set the priorityId when priority name is selected
      const selectedPriority = priorities.find(p => p.name === value);
      if (selectedPriority) {
        setFormData(prev => ({ 
          ...prev, 
          priority: value as 'Low' | 'Medium' | 'High' | 'Critical',
          priorityId: selectedPriority.id
        }));
      } else {
        setFormData(prev => ({ ...prev, priority: value as 'Low' | 'Medium' | 'High' | 'Critical', priorityId: '' }));
      }
    } else if (name === 'subcategory') {
      // Find the subcategory ID when subcategory name is selected
      const selectedSubcategory = subcategories.find(
        s => s.name === value && s.category_id === formData.categoryId
      );
      if (selectedSubcategory) {
        setFormData(prev => ({ 
          ...prev, 
          subcategory: value,
          subcategoryId: selectedSubcategory.id
        }));
      } else {
        setFormData(prev => ({ ...prev, subcategory: value, subcategoryId: '' }));
      }
    } else {
      // Default handling for other fields
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDateTimeChange = (field: string, value: Date | string) => {
    if (field === 'date' && value instanceof Date) {
      setFormData(prev => ({ 
        ...prev, 
        date: value.toISOString().split('T')[0]
      }));
    } else if (field === 'time' && typeof value === 'string') {
      setFormData(prev => ({ ...prev, time: value }));
    }
  };

  const handlePersonChange = (index: number, field: keyof Person, value: string) => {
    const newPeople = [...peopleInvolved];
    newPeople[index] = { ...newPeople[index], [field]: value };
    setPeopleInvolved(newPeople);
  };

  const addPerson = () => {
    setPeopleInvolved([...peopleInvolved, { name: '', role: 'Student', notes: '' }]);
  };

  const removePerson = (index: number) => {
    const newPeople = peopleInvolved.filter((_, i) => i !== index);
    setPeopleInvolved(newPeople);
  };

  const handleFilesChange = (files: FileItem[]) => {
    setSupportingFiles(files);
  };

  const getSelectedLocation = (): string => {
    const selectedLocation = locations.find(loc => loc.id === formData.locationId);
    return selectedLocation ? selectedLocation.name : '';
  };

  const getSelectedFacility = (): string => {
    const selectedFacility = facilities.find(fac => fac.id === formData.facilityId);
    return selectedFacility ? selectedFacility.name : '';
  };

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
    locations,
    facilities,
    users,
    reportTypes,
    categories,
    subcategories,
    priorities
  };
}
