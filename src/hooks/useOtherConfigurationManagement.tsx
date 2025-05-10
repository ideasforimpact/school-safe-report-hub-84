
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useIncidents } from '@/contexts/IncidentContext';
import { toast } from 'sonner';
import { ConfigItem } from '@/contexts/types';
import { useClient } from '@/contexts/ClientContext';
import { supabase } from '@/integrations/supabase/client';

export function useOtherConfigurationManagement() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('designations');
  const { client } = useClient();
  
  const { 
    designations: contextDesignations,
    addDesignation: contextAddDesignation,
    updateDesignation: contextUpdateDesignation,
    deleteDesignation: contextDeleteDesignation,
  } = useIncidents();

  // Local state
  const [loading, setLoading] = useState(false);
  const [designations, setDesignations] = useState<ConfigItem[]>(contextDesignations);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);

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

  // Fetch data from Supabase when client changes
  useEffect(() => {
    if (client?.id) {
      fetchCampuses();
      fetchGrades();
      fetchFacilities();
      // fetchSections() - to be implemented later
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

  const fetchGrades = async () => {
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
        name: facility.name,
        campusId: facility.campus_id
      })));
    } catch (error) {
      console.error("Error fetching facilities:", error);
      toast.error("Failed to load facilities");
    } finally {
      setLoading(false);
    }
  };

  // Designation management
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

  // Campus management with Supabase
  const addCampus = async (name: string) => {
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

  const updateCampus = async (id: string, name: string) => {
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

  const deleteCampus = async (id: string) => {
    // Check if campus has associated classes/grades
    const hasClasses = classes.some((cls: any) => cls.campusId === id);
    if (hasClasses) {
      toast.error("Cannot delete campus with associated grades. Remove the grades first.");
      return;
    }
    
    // Check if campus has associated facilities
    const hasFacilities = facilities.some((facility: any) => facility.campusId === id);
    if (hasFacilities) {
      toast.error("Cannot delete campus with associated facilities. Remove the facilities first.");
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

  // Class/Grade management
  const addClass = async (campusId: string, name: string) => {
    if (!client?.id) {
      toast.error("No client selected");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('grade-management', {
        body: { name, campusId, clientId: client.id, action: 'create' }
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

  const updateClass = async (id: string, campusId: string, name: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('grade-management', {
        body: { id, name, campusId, action: 'update' }
      });

      if (error) throw error;
      
      setClasses(prev => prev.map((c: any) => c.id === id ? { 
        ...c, 
        name: data.grade.name, 
        campusId: data.grade.campus_id 
      } : c));
      
      toast.success("Grade updated successfully");
    } catch (error) {
      console.error("Error updating grade:", error);
      toast.error("Failed to update grade");
    } finally {
      setLoading(false);
    }
  };

  const deleteClass = async (id: string) => {
    // Check if class has associated sections
    const hasSections = sections.some((section: any) => section.classId === id);
    if (hasSections) {
      toast.error("Cannot delete grade with associated sections. Remove the sections first.");
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('grade-management', {
        body: { id, action: 'delete' }
      });

      if (error) throw error;
      
      setClasses(prev => prev.filter((c: any) => c.id !== id));
      toast.success("Grade deleted successfully");
    } catch (error) {
      console.error("Error deleting grade:", error);
      toast.error("Failed to delete grade");
    } finally {
      setLoading(false);
    }
  };

  // Section management (placeholders - to be implemented)
  const addSection = (classId: string, name: string) => {
    // To be implemented
  };

  const updateSection = (id: string, classId: string, name: string) => {
    // To be implemented
  };

  const deleteSection = (id: string) => {
    // To be implemented
  };

  // Facility management
  const addFacility = async (name: string, campusId: string) => {
    if (!client?.id) {
      toast.error("No client selected");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('facility-management', {
        body: { name, campusId, clientId: client.id, action: 'create' }
      });

      if (error) throw error;
      
      setFacilities(prev => [...prev, { 
        id: data.facility.id, 
        name: data.facility.name,
        campusId: data.facility.campus_id
      }]);
      toast.success("Facility added successfully");
    } catch (error) {
      console.error("Error adding facility:", error);
      toast.error("Failed to add facility");
    } finally {
      setLoading(false);
    }
  };

  const updateFacility = async (id: string, name: string, campusId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('facility-management', {
        body: { id, name, campusId, action: 'update' }
      });

      if (error) throw error;
      
      setFacilities(prev => prev.map((f: any) => f.id === id ? { 
        ...f, 
        name: data.facility.name,
        campusId: data.facility.campus_id
      } : f));
      
      toast.success("Facility updated successfully");
    } catch (error) {
      console.error("Error updating facility:", error);
      toast.error("Failed to update facility");
    } finally {
      setLoading(false);
    }
  };

  const deleteFacility = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('facility-management', {
        body: { id, action: 'delete' }
      });

      if (error) throw error;
      
      setFacilities(prev => prev.filter((f: any) => f.id !== id));
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
