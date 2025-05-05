
import { useState } from 'react';
import { useIncidents } from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useIncidentFormData } from './incident-form/useIncidentFormData';
import { usePeopleInvolved } from './incident-form/usePeopleInvolved';
import { useFilesManagement } from './incident-form/useFilesManagement';
import { useSubcategories } from './incident-form/useSubcategories';
import { useTicketId } from './incident-form/useTicketId';
import { useSelectedValues } from './incident-form/useSelectedValues';

export function useIncidentForm() {
  const { 
    generateTicketId,
    categories,
    subcategoryMappings,
    locations,
    facilities,
    users
  } = useIncidents();

  const { user } = useAuth();

  const {
    formData,
    setFormData,
    handleChange,
    handleSelectChange,
    handleDateTimeChange
  } = useIncidentFormData(user);

  const {
    peopleInvolved,
    setPeopleInvolved,
    handlePersonChange,
    addPerson,
    removePerson
  } = usePeopleInvolved();

  const {
    supportingFiles,
    handleFilesChange
  } = useFilesManagement();

  const { availableSubcategories } = useSubcategories(
    formData.categoryId,
    subcategoryMappings,
    setFormData
  );

  const { nextTicketId } = useTicketId(generateTicketId);

  const { 
    getSelectedCategory,
    getSelectedLocation,
    getSelectedFacility
  } = useSelectedValues(
    formData.categoryId,
    formData.locationId,
    formData.facilityId,
    categories,
    locations,
    facilities
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  return {
    nextTicketId,
    formData,
    setFormData,
    supportingFiles,
    availableSubcategories,
    peopleInvolved,
    setPeopleInvolved,
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
    facilities,
    users
  };
}
