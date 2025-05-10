
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
    sections: contextSections,
    addSection: contextAddSection,
    updateSection: contextUpdateSection,
    deleteSection: contextDeleteSection
  } = useIncidents();

  // Local state 
  const [loading, setLoading] = useState(false);
  const [campuses, setCampuses] = useState<CampusItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>(contextSections);
  const [facilities, setFacilities] = useState<ConfigItem[]>([]);

  // Update sections state when context changes
  useEffect(() => {
    setSections(contextSections);
  }, [contextSections]);
  
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
      fetchClasses();
      fetchFacilities();
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

  const fetchClasses = async () => {
    if (!client?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('grade-management', {
        body: { clientId: client.id, action: 'list' }
      });

      if (error) throw error;
      
      setClasses(data.grades.map((grade: any) => ({
        id: grade.id,
        name: grade.name,
        campusId: grade.campus_id
      })));
    } catch (error) {
      console.error("Error fetching grades:", error);
      toast.error("Failed to load grades");
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilities = async () => {
    if (!client?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('facility-management', {
        body: { clientId: client.id, action: 'list' }
      });

      if (error) throw error;
      
      setFacilities(data.facilities.map((facility: any) => ({
        id: facility.id,
        name: facility.name
      })));
    } catch (error) {
      console.error("Error fetching facilities:", error);
      toast.error("Failed to load facilities");
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
    // First check if there are classes associated with this campus
    const hasClasses = classes.some(cls => cls.campusId === id);
    if (hasClasses) {
      toast.error("Cannot delete campus with associated grades/classes. Delete the grades first.");
      return;
    }

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

  const handleAddClass = async (campusId: string, name: string) => {
    if (!client?.id) {
      toast.error("No client selected");
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('grade-management', {
        body: { 
          name, 
          campusId, 
          clientId: client.id, 
          action: 'create' 
        }
      });

      if (error) throw error;
      
      setClasses(prev => [...prev, { 
        id: data.grade.id, 
        name: data.grade.name,
        campusId: data.grade.campus_id
      }]);
      
      toast.success("Grade added successfully");
    } catch (error) {
      console.error("Error adding grade:", error);
      toast.error("Failed to add grade");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClass = async (id: string, campusId: string, name: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('grade-management', {
        body: { 
          id, 
          name, 
          campusId,
          action: 'update' 
        }
      });

      if (error) throw error;
      
      setClasses(prev => prev.map(cls => 
        cls.id === id ? { ...cls, name, campusId } : cls
      ));
      
      toast.success("Grade updated successfully");
    } catch (error) {
      console.error("Error updating grade:", error);
      toast.error("Failed to update grade");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    // Check if there are sections associated with this class
    const hasSections = sections.some(section => section.classId === id);
    if (hasSections) {
      toast.error("Cannot delete grade with associated sections. Delete the sections first.");
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('grade-management', {
        body: { id, action: 'delete' }
      });

      if (error) throw error;
      
      setClasses(prev => prev.filter(cls => cls.id !== id));
      toast.success("Grade deleted successfully");
    } catch (error) {
      console.error("Error deleting grade:", error);
      toast.error("Failed to delete grade");
    } finally {
      setLoading(false);
    }
  };

  // Use existing context methods for sections
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

  const handleAddFacility = async (name: string, campusId: string) => {
    if (!client?.id) {
      toast.error("No client selected");
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('facility-management', {
        body: { 
          name, 
          campusId,
          clientId: client.id, 
          action: 'create' 
        }
      });

      if (error) throw error;
      
      setFacilities(prev => [...prev, { 
        id: data.facility.id, 
        name: data.facility.name 
      }]);
      
      toast.success("Facility added successfully");
    } catch (error) {
      console.error("Error adding facility:", error);
      toast.error("Failed to add facility");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFacility = async (id: string, name: string, campusId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('facility-management', {
        body: { 
          id, 
          name,
          campusId,
          action: 'update' 
        }
      });

      if (error) throw error;
      
      setFacilities(prev => prev.map(facility => 
        facility.id === id ? { ...facility, name } : facility
      ));
      
      toast.success("Facility updated successfully");
    } catch (error) {
      console.error("Error updating facility:", error);
      toast.error("Failed to update facility");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFacility = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('facility-management', {
        body: { id, action: 'delete' }
      });

      if (error) throw error;
      
      setFacilities(prev => prev.filter(facility => facility.id !== id));
      toast.success("Facility deleted successfully");
    } catch (error) {
      console.error("Error deleting facility:", error);
      toast.error("Failed to delete facility");
    } finally {
      setLoading(false);
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
