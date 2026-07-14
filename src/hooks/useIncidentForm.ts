import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/useAuth';
import { FileItem } from '@/types/fileTypes';
import {
  IncidentType,
  IncidentCategory,
  IncidentLocation,
  Person
} from '@/types/incident';
 
interface ConfigItem {
  id: string;
  name: string;
}
 
interface FormData {
  typeId: string;
  categoryId: string;
  subcategoryId: string;
  description: string;
  date: string;
  time: string;
  locationId: string;
  facilityId: string;
  priorityId: string;
  owner: string;
  status: string;
}
 
export const useIncidentForm = () => {
  const { employeeData } = useAuth();
  const clientId = employeeData?.clientId;
  const clientTypeId = employeeData?.clientType?.id;
  const [nextTicketId, setNextTicketId] = useState<string>('');
  const [formData, setForm] = useState<FormData>({
    typeId: '',
    categoryId: '',
    subcategoryId: '',
    description: '',
    date: '',
    time: '',
    locationId: '',
    facilityId: '',
    priorityId: '',
    owner: '',
    status: 'Open'
  });
  const [supportingFiles, setSupportingFiles] = useState<FileItem[]>([]);
  const [peopleInvolved, setPeople] = useState<Person[]>([]);
  const [locations, setLocations] = useState<ConfigItem[]>([]);
  const [facilities, setFacilities] = useState<ConfigItem[]>([]);
  const [reportTypes, setReportTypes] = useState<ConfigItem[]>([]);
  const [categories, setCategories] = useState<ConfigItem[]>([]);
  const [subcategories, setSubcategories] = useState<ConfigItem[]>([]);
  const [priorities, setPriorities] = useState<ConfigItem[]>([]);
  const [users, setUsers] = useState<ConfigItem[]>([]);
 
  useEffect(() => {
    if (!clientId) return;
 
    const fetchData = async () => {
      try {
        let locationsQuery = supabase
          .from('campuses')
          .select('*')
          .eq('client_id', clientId);
        if (clientTypeId) locationsQuery = locationsQuery.eq('client_type_id', clientTypeId);
        const { data: locationsData, error: locationsError } = await locationsQuery;
        if (locationsError) {
          throw locationsError;
        }
        setLocations(locationsData || []);
 
        let facilitiesQuery = supabase
          .from('facilities')
          .select('*')
          .eq('client_id', clientId);
        if (clientTypeId) facilitiesQuery = facilitiesQuery.eq('client_type_id', clientTypeId);
        const { data: facilitiesData, error: facilitiesError } = await facilitiesQuery;
        if (facilitiesError) {
          throw facilitiesError;
        }
        setFacilities(facilitiesData || []);
 
        let reportTypesQuery = supabase
          .from('incident_report_types')
          .select('*')
          .eq('client_id', clientId);
        if (clientTypeId) reportTypesQuery = reportTypesQuery.eq('client_type_id', clientTypeId);
        const { data: reportTypesData, error: reportTypesError } = await reportTypesQuery;
        if (reportTypesError) {
          throw reportTypesError;
        }
        setReportTypes(reportTypesData || []);
 
        let categoriesQuery = supabase
          .from('incident_categories')
          .select('*')
          .eq('client_id', clientId);
        if (clientTypeId) categoriesQuery = categoriesQuery.eq('client_type_id', clientTypeId);
        const { data: categoriesData, error: categoriesError } = await categoriesQuery;
        if (categoriesError) {
          throw categoriesError;
        }
        setCategories(categoriesData || []);
 
        let subcategoriesQuery = supabase
          .from('incident_subcategories')
          .select('*')
          .eq('client_id', clientId);
        if (clientTypeId) subcategoriesQuery = subcategoriesQuery.eq('client_type_id', clientTypeId);
        const { data: subcategoriesData, error: subcategoriesError } = await subcategoriesQuery;
        if (subcategoriesError) {
          throw subcategoriesError;
        }
        setSubcategories(subcategoriesData || []);
 
        let prioritiesQuery = supabase
          .from('incident_priorities')
          .select('*')
          .eq('client_id', clientId);
        if (clientTypeId) prioritiesQuery = prioritiesQuery.eq('client_type_id', clientTypeId);
        const { data: prioritiesData, error: prioritiesError } = await prioritiesQuery;
        if (prioritiesError) {
          throw prioritiesError;
        }
        setPriorities(prioritiesData || []);
 
        const { data: usersData, error: usersError } = await supabase
          .from('employees')
          .select('id, first_name, last_name')
          .eq('client_id', clientId)
          .eq('is_secondary_super_admin', false);
        if (usersError) {
          throw usersError;
        }
        const formattedUsers = usersData
          ? usersData.map((user) => ({
              id: user.id,
              name: `${user.first_name} ${user.last_name}`
            }))
          : [];
        setUsers(formattedUsers || []);
      } catch (error) {
        console.error('Error fetching form configuration data:', error);
        toast.error('Could not load form configuration data');
      }
    };
 
    fetchData();
  }, [clientId, clientTypeId]);
 
  useEffect(() => {
    const generateId = () => {
      const newTicketId = `INC-${Math.floor(Math.random() * 10000)}`;
      setNextTicketId(newTicketId);
    };
 
    generateId();
  }, []);
 
  const handleChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };
 
  const handleSelectChange = (name: string, value: string) => {
    if (name === 'categoryId') {
      setForm((prev) => ({ ...prev, categoryId: value, subcategoryId: '' }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };
 
  const handleMultiSelectChange = (fields: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...fields }));
  };
 
  const handleDateTimeChange = (name: string, value: Date | string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };
 
  const handlePersonChange = (
    index: number,
    field: keyof Person,
    value: string,
    additionalFields?: Record<string, any>
  ) => {
    const updatedPeople = [...peopleInvolved];
    const updatedPerson = { ...updatedPeople[index], [field]: value };
    
    // Merge additional fields if provided
    if (additionalFields) {
      Object.assign(updatedPerson, additionalFields);
    }
    
    updatedPeople[index] = updatedPerson;
    setPeople(updatedPeople);
  };
 
  const addPerson = () => {
    setPeople([...peopleInvolved, { name: '', role: 'Student', notes: '' }]);
  };
 
  const removePerson = (index: number) => {
    const updatedPeople = peopleInvolved.filter((_, i) => i !== index);
    setPeople(updatedPeople);
  };
 
  const handleFilesChange = (newFiles: FileItem[]) => {
    setSupportingFiles(newFiles);
  };
 
  const getSelectedLocation = (locationId: string) => {
    return locations.find((location) => location.id === locationId);
  };
 
  const getSelectedFacility = (facilityId: string) => {
    return facilities.find((facility) => facility.id === facilityId);
  };
 
  const setFormData = (newFormData: Partial<FormData>) => {
    setForm(prev => ({ ...prev, ...newFormData }));
  };
 
  const setPeopleInvolved = (newPeople: Person[]) => {
    setPeople(newPeople);
  };
 
  return {
    nextTicketId,
    formData,
    supportingFiles,
    peopleInvolved,
    handleChange,
    handleSelectChange,
    handleMultiSelectChange,
    handleDateTimeChange,
    handlePersonChange,
    addPerson,
    removePerson,
    handleFilesChange,
    getSelectedLocation,
    getSelectedFacility,
    locations,
    facilities,
    reportTypes,
    categories,
    subcategories,
    priorities,
    users,
    setFormData,
    setPeopleInvolved
  };
};