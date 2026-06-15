import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FileItem } from '@/types/fileTypes';
import {
  IncidentType,
  IncidentCategory,
  IncidentLocation,
  Person
} from '@/types/incident';

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
    setFormData,
    setPeopleInvolved
  };
};
