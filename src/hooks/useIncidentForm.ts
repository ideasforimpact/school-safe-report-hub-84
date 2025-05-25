import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
    const fetchData = async () => {
      try {
        const { data: locationsData, error: locationsError } = await supabase
          .from('campuses')
          .select('*');
        if (locationsError) {
          throw locationsError;
        }
        setLocations(locationsData || []);

        const { data: facilitiesData, error: facilitiesError } = await supabase
          .from('facilities')
          .select('*');
        if (facilitiesError) {
          throw facilitiesError;
        }
        setFacilities(facilitiesData || []);

        const { data: reportTypesData, error: reportTypesError } = await supabase
          .from('incident_report_types')
          .select('*');
        if (reportTypesError) {
          throw reportTypesError;
        }
        setReportTypes(reportTypesData || []);

        const { data: categoriesData, error: categoriesError } = await supabase
          .from('incident_categories')
          .select('*');
        if (categoriesError) {
          throw categoriesError;
        }
        setCategories(categoriesData || []);

        const { data: subcategoriesData, error: subcategoriesError } = await supabase
          .from('incident_subcategories')
          .select('*');
        if (subcategoriesError) {
          throw subcategoriesError;
        }
        setSubcategories(subcategoriesData || []);

        const { data: prioritiesData, error: prioritiesError } = await supabase
          .from('incident_priorities')
          .select('*');
        if (prioritiesError) {
          throw prioritiesError;
        }
        setPriorities(prioritiesData || []);

        const { data: usersData, error: usersError } = await supabase
          .from('employees')
          .select('id, first_name, last_name');
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
  }, []);

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
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateTimeChange = (name: string, value: Date | string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePersonChange = (
    index: number,
    field: keyof Person,
    value: string
  ) => {
    const updatedPeople = [...peopleInvolved];
    updatedPeople[index] = { ...updatedPeople[index], [field]: value };
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
