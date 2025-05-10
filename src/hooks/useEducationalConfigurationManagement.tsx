import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useIncidents } from '@/contexts/IncidentContext';
import { toast } from 'sonner';
import { CampusItem, ClassItem, SectionItem, ConfigItem } from '@/contexts/types';
import { useClient } from '@/contexts/ClientContext';
import { supabase } from '@/integrations/supabase/client';

export function useEducationalConfigurationManagement() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('campuses');
  const { client } = useClient();
  
  const { 
    classes: contextClasses,
    addClass: contextAddClass,
    updateClass: contextUpdateClass,
    deleteClass: contextDeleteClass,
    sections: contextSections,
    addSection: contextAddSection,
    updateSection: contextUpdateSection,
    deleteSection: contextDeleteSection,
    facilities: contextFacilities,
    addFacility: contextAddFacility,
    updateFacility: contextUpdateFacility,
    deleteFacility: contextDeleteFacility
  } = useIncidents();

  // Local state 
  const [loading, setLoading] = useState(false);
  const [campuses, setCampuses] = useState<CampusItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>(contextClasses);
  const [sections, setSections] = useState<SectionItem[]>(contextSections);
  const [facilities, setFacilities] = useState<ConfigItem[]>(contextFacilities);

  // Update local state when context changes
  useEffect(() => {
    setClasses(contextClasses);
    setSections(contextSections);
    setFacilities(contextFacilities);
  }, [contextClasses, contextSections, contextFacilities]);
  
  // Set initial tab based on URL parameter when component mounts
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Fetch campuses from database
  useEffect(() => {
    if (client?.id) {
      fetchCampuses();
    }
  }, [client?.id]);

  const fetchCampuses = async () => {
    if (!client?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('campus-management', {
        body: { clientId: client.id, action: 'list' }
      });

      if (error) throw error;
      
      setCampuses(data.campuses.map((campus: any) => ({
        id: campus.id,
        name: campus.name
      })));
    } catch (error) {
      console.error("Error fetching campuses:", error);
      toast.error("Failed to load campuses");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCampus = async (name: string) => {
    if (!client?.id) {
      toast.error("No client selected");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('campus-management', {
        body: { name, clientId: client.id, action: 'create' }
      });

      if (error) throw error;
      
      setCampuses(prev => [...prev, { id: data.campus.id, name: data.campus.name }]);
      toast.success("Campus added successfully");
    } catch (error) {
      console.error("Error adding campus:", error);
      toast.error("Failed to add campus");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCampus = async (id: string, name: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('campus-management', {
        body: { id, name, action: 'update' }
      });

      if (error) throw error;
      
      setCampuses(prev => prev.map(c => c.id === id ? { ...c, name } : c));
      toast.success("Campus updated successfully");
    } catch (error) {
      console.error("Error updating campus:", error);
      toast.error("Failed to update campus");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampus = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('campus-management', {
        body: { id, action: 'delete' }
      });

      if (error) throw error;
      
      setCampuses(prev => prev.filter(c => c.id !== id));
      toast.success("Campus deleted successfully");
    } catch (error) {
      console.error("Error deleting campus:", error);
      toast.error("Failed to delete campus");
    } finally {
      setLoading(false);
    }
  };

  // Use existing context methods for other entities
  const handleAddClass = (campusId: string, name: string) => {
    try {
      console.log("EducationalConfiguration: Adding class:", name, "to campus:", campusId);
      contextAddClass(campusId, name);
      toast.success("Class added successfully");
    } catch (error) {
      console.error("Error adding class:", error);
      toast.error("Failed to add class");
    }
  };

  const handleUpdateClass = (id: string, campusId: string, name: string) => {
    try {
      contextUpdateClass(id, campusId, name);
      toast.success("Class updated successfully");
    } catch (error) {
      console.error("Error updating class:", error);
      toast.error("Failed to update class");
    }
  };

  const handleDeleteClass = (id: string) => {
    try {
      contextDeleteClass(id);
      toast.success("Class deleted successfully");
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error("Failed to delete class");
    }
  };

  const handleAddSection = (classId: string, name: string) => {
    try {
      console.log("EducationalConfiguration: Adding section:", name, "to class:", classId);
      contextAddSection(classId, name);
      toast.success("Section added successfully");
    } catch (error) {
      console.error("Error adding section:", error);
      toast.error("Failed to add section");
    }
  };

  const handleUpdateSection = (id: string, classId: string, name: string) => {
    try {
      contextUpdateSection(id, classId, name);
      toast.success("Section updated successfully");
    } catch (error) {
      console.error("Error updating section:", error);
      toast.error("Failed to update section");
    }
  };

  const handleDeleteSection = (id: string) => {
    try {
      contextDeleteSection(id);
      toast.success("Section deleted successfully");
    } catch (error) {
      console.error("Error deleting section:", error);
      toast.error("Failed to delete section");
    }
  };

  const handleAddFacility = (name: string) => {
    try {
      contextAddFacility(name);
      toast.success("Facility added successfully");
    } catch (error) {
      console.error("Error adding facility:", error);
      toast.error("Failed to add facility");
    }
  };

  const handleUpdateFacility = (id: string, name: string) => {
    try {
      contextUpdateFacility(id, name);
      toast.success("Facility updated successfully");
    } catch (error) {
      console.error("Error updating facility:", error);
      toast.error("Failed to update facility");
    }
  };

  const handleDeleteFacility = (id: string) => {
    try {
      contextDeleteFacility(id);
      toast.success("Facility deleted successfully");
    } catch (error) {
      console.error("Error deleting facility:", error);
      toast.error("Failed to delete facility");
    }
  };
  
  return {
    activeTab,
    setActiveTab,
    loading,
    campuses,
    classes,
    sections,
    facilities,
    handleAddCampus,
    handleUpdateCampus,
    handleDeleteCampus,
    handleAddClass,
    handleUpdateClass,
    handleDeleteClass,
    handleAddSection,
    handleUpdateSection,
    handleDeleteSection,
    handleAddFacility,
    handleUpdateFacility,
    handleDeleteFacility
  };
}
