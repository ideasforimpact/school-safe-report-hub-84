
import { useState } from 'react';
import { useIncidents } from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/auth/AuthContext';
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

  // Set default owner to current user when component mounts
  useState(() => {
    if (user?.id && !formData.owner) {
      setFormData(prev => ({...prev, owner: user.id}));
    }
  });

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
