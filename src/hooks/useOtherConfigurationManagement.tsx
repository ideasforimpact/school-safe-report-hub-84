
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useIncidents } from '@/contexts/IncidentContext';
import { toast } from 'sonner';
import { ConfigItem } from '@/contexts/types';

export function useOtherConfigurationManagement() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('designations');
  
  const { 
    designations: contextDesignations,
    addDesignation: contextAddDesignation,
    updateDesignation: contextUpdateDesignation,
    deleteDesignation: contextDeleteDesignation,
    campuses,
    addCampus,
    updateCampus,
    deleteCampus,
    classes,
    addClass,
    updateClass,
    deleteClass,
    sections,
    addSection,
    updateSection,
    deleteSection,
    facilities,
    addFacility,
    updateFacility,
    deleteFacility
  } = useIncidents();

  // Local state for designations
  const [designations, setDesignations] = useState<ConfigItem[]>(contextDesignations);

  // Update local state when context changes
  useEffect(() => {
    setDesignations(contextDesignations);
  }, [contextDesignations]);
  
  // Set initial tab based on URL parameter when component mounts
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleAddDesignation = (name: string) => {
    try {
      contextAddDesignation(name);
      toast.success("Designation added successfully");
    } catch (error) {
      console.error("Error adding designation:", error);
      toast.error("Failed to add designation");
    }
  };

  const handleUpdateDesignation = (id: string, name: string) => {
    try {
      contextUpdateDesignation(id, name);
      toast.success("Designation updated successfully");
    } catch (error) {
      console.error("Error updating designation:", error);
      toast.error("Failed to update designation");
    }
  };

  const handleDeleteDesignation = (id: string) => {
    try {
      contextDeleteDesignation(id);
      toast.success("Designation deleted successfully");
    } catch (error) {
      console.error("Error deleting designation:", error);
      toast.error("Failed to delete designation");
    }
  };

  return {
    activeTab,
    setActiveTab,
    designations,
    handleAddDesignation,
    handleUpdateDesignation,
    handleDeleteDesignation,
    campuses,
    addCampus,
    updateCampus,
    deleteCampus,
    classes,
    addClass,
    updateClass,
    deleteClass,
    sections,
    addSection,
    updateSection,
    deleteSection,
    facilities,
    addFacility,
    updateFacility,
    deleteFacility
  };
}
