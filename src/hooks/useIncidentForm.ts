
import { useState, useEffect } from 'react';
import { useIncidents } from '@/contexts/IncidentContext';
import { FileItem } from '@/types/fileTypes';
import { Person } from '@/types/incident';
import { User } from '@/types/incident';
import { getAllCampuses } from '@/services/campus/campusService';
import { getFacilitiesByCampus } from '@/services/facility/facilityService';
import { ConfigItem } from '@/contexts/types';
import { toast } from 'sonner';

interface FormData {
  type: string;
  categoryId: string;
  subcategory: string;
  description: string;
  date: string;
  time: string;
  locationId: string;
  facilityId: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  owner: string;
}

export function useIncidentForm() {
  const { users, generateTicketId } = useIncidents();
  
  const [nextTicketId, setNextTicketId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supportingFiles, setSupportingFiles] = useState<FileItem[]>([]);
  const [locations, setLocations] = useState<ConfigItem[]>([]);
  const [facilities, setFacilities] = useState<ConfigItem[]>([]);
  const [peopleInvolved, setPeopleInvolved] = useState<Person[]>([
    { name: '', role: 'Student', notes: '' }
  ]);
  
  const [formData, setFormData] = useState<FormData>({
    type: 'Incident',
    categoryId: '',
    subcategory: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].slice(0, 5),
    locationId: '',
    facilityId: '',
    priority: 'Medium',
    owner: ''
  });

  // Fetch locations (campuses) on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const campuses = await getAllCampuses();
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
        setFacilities(facilitiesData.map(f => ({ id: f.id, name: f.name })));
      } catch (error) {
        console.error('Error fetching facilities:', error);
        toast.error('Failed to load facilities');
      }
    };

    fetchFacilities();
  }, [formData.locationId]);

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
    setFormData(prev => ({ ...prev, [name]: value }));
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
  };
}
