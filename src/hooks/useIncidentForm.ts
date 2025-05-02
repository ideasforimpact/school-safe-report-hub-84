
import { useState } from 'react';
import { useIncidents } from '@/contexts/IncidentContext';
import { useIncidentFormData } from './useIncidentFormData';
import { usePeopleInvolved } from './usePeopleInvolved';
import { useFilesManagement } from './useFilesManagement';
import { useSubcategories } from './useSubcategories';
import { useTicketId } from './useTicketId';
import { useSelectedValues } from './useSelectedValues';
import { ConfigItem } from '@/contexts/types';

export function useIncidentForm() {
  const { 
    generateTicketId,
    categories,
    subcategoryMappings,
    locations,
    facilities 
  } = useIncidents();

  const {
    formData,
    setFormData,
    handleChange,
    handleSelectChange,
    handleDateTimeChange
  } = useIncidentFormData();

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
    facilities
  };
}
