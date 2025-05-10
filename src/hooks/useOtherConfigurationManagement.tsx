
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

  // Local state
  const [loading, setLoading] = useState(false);
  const [designations, setDesignations] = useState<ConfigItem[]>(contextDesignations);
  const [campuses, setCampuses] = useState<any[]>([]);

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
