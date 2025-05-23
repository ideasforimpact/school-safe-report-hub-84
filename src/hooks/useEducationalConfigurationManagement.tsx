
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfigItem, CampusItem, ClassItem, SectionItem } from '@/contexts/types';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';

export function useEducationalConfigurationManagement() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('campuses');
  const { employeeData } = useAuth();
  
  // Local states
  const [loading, setLoading] = useState(false);
  const [campuses, setCampuses] = useState<CampusItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [facilities, setFacilities] = useState<ConfigItem[]>([]);

  // Set initial tab based on URL parameter when component mounts
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Fetch data from Supabase when employeeData changes
  useEffect(() => {
    if (employeeData?.clientId) {
      fetchCampuses();
      fetchClasses();
      fetchSections();
      fetchFacilities();
    }
  }, [employeeData?.clientId]);

  // Fetch campuses
  const fetchCampuses = async () => {
    if (!employeeData?.clientId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('campus-management', {
        body: { clientId: employeeData.clientId, action: 'list' }
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

  // Fetch classes/grades
  const fetchClasses = async () => {
    if (!employeeData?.clientId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('grade-management', {
        body: { clientId: employeeData.clientId, action: 'list' }
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

  // Fetch sections with campus_id
  const fetchSections = async () => {
    if (!employeeData?.clientId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('section-management', {
        body: { clientId: employeeData.clientId, action: 'list' }
      });

      if (error) throw error;
      
      setSections(data.sections.map((section: any) => ({
        id: section.id,
        name: section.name,
        classId: section.grade_id,
        campusId: section.campus_id
      })));
    } catch (error) {
      console.error("Error fetching sections:", error);
      toast.error("Failed to load sections");
    } finally {
      setLoading(false);
    }
  };

  // Fetch facilities
  const fetchFacilities = async () => {
    if (!employeeData?.clientId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('facility-management', {
        body: { clientId: employeeData.clientId, action: 'list' }
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

  // Campus management with Supabase
  const handleAddCampus = async (name: string) => {
    if (!employeeData?.clientId) {
      toast.error("No client selected");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('campus-management', {
        body: { name, clientId: employeeData.clientId, action: 'create' }
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
    if (!employeeData?.clientId) {
      toast.error("No client selected");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('campus-management', {
        body: { id, name, clientId: employeeData.clientId, action: 'update' }
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
    if (!employeeData?.clientId) {
      toast.error("No client selected");
      return;
    }

    // Check if campus has associated classes/grades
    const hasClasses = classes.some(cls => cls.campusId === id);
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
    
    // Check if campus has associated sections
    const hasSections = sections.some((section: any) => section.campusId === id);
    if (hasSections) {
      toast.error("Cannot delete campus with associated sections. Remove the sections first.");
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('campus-management', {
        body: { id, clientId: employeeData.clientId, action: 'delete' }
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
  const handleAddClass = async (campusId: string, name: string) => {
    if (!employeeData?.clientId) {
      toast.error("No client selected");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('grade-management', {
        body: { name, campusId, clientId: employeeData.clientId, action: 'create' }
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
    if (!employeeData?.clientId) {
      toast.error("No client selected");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('grade-management', {
        body: { id, name, campusId, clientId: employeeData.clientId, action: 'update' }
      });

      if (error) throw error;
      
      setClasses(prev => prev.map(c => c.id === id ? { 
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

  const handleDeleteClass = async (id: string) => {
    if (!employeeData?.clientId) {
      toast.error("No client selected");
      return;
    }

    // Check if class has associated sections
    const hasSections = sections.some(section => section.classId === id);
    if (hasSections) {
      toast.error("Cannot delete grade with associated sections. Remove the sections first.");
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('grade-management', {
        body: { id, clientId: employeeData.clientId, action: 'delete' }
      });

      if (error) throw error;
      
      setClasses(prev => prev.filter(c => c.id !== id));
      toast.success("Grade deleted successfully");
    } catch (error) {
      console.error("Error deleting grade:", error);
      toast.error("Failed to delete grade");
    } finally {
      setLoading(false);
    }
  };

  // Section management with the new API and campus_id
  const handleAddSection = async (classId: string, campusId: string, name: string) => {
    if (!employeeData?.clientId) {
      toast.error("No client selected");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('section-management', {
        body: { 
          name, 
          gradeId: classId, 
          campusId: campusId, 
          clientId: employeeData.clientId, 
          action: 'create' 
        }
      });

      if (error) throw error;
      
      setSections(prev => [...prev, { 
        id: data.section.id, 
        name: data.section.name,
        classId: data.section.grade_id,
        campusId: data.section.campus_id
      }]);
      toast.success("Section added successfully");
    } catch (error) {
      console.error("Error adding section:", error);
      toast.error("Failed to add section");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSection = async (id: string, classId: string, campusId: string, name: string) => {
    if (!employeeData?.clientId) {
      toast.error("No client selected");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('section-management', {
        body: { 
          id, 
          name, 
          gradeId: classId, 
          campusId: campusId,
          clientId: employeeData.clientId, 
          action: 'update' 
        }
      });

      if (error) throw error;
      
      setSections(prev => prev.map(section => section.id === id ? { 
        ...section, 
        name: data.section.name, 
        classId: data.section.grade_id,
        campusId: data.section.campus_id
      } : section));
      
      toast.success("Section updated successfully");
    } catch (error) {
      console.error("Error updating section:", error);
      toast.error("Failed to update section");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!employeeData?.clientId) {
      toast.error("No client selected");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('section-management', {
        body: { id, clientId: employeeData.clientId, action: 'delete' }
      });

      if (error) throw error;
      
      setSections(prev => prev.filter(section => section.id !== id));
      toast.success("Section deleted successfully");
    } catch (error) {
      console.error("Error deleting section:", error);
      toast.error("Failed to delete section");
    } finally {
      setLoading(false);
    }
  };

  // Facility management
  const handleAddFacility = async (name: string, campusId: string) => {
    if (!employeeData?.clientId) {
      toast.error("No client selected");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('facility-management', {
        body: { name, campusId, clientId: employeeData.clientId, action: 'create' }
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

  const handleUpdateFacility = async (id: string, name: string, campusId: string) => {
    if (!employeeData?.clientId) {
      toast.error("No client selected");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('facility-management', {
        body: { id, name, campusId, clientId: employeeData.clientId, action: 'update' }
      });

      if (error) throw error;
      
      setFacilities(prev => prev.map(f => f.id === id ? { 
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

  const handleDeleteFacility = async (id: string) => {
    if (!employeeData?.clientId) {
      toast.error("No client selected");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('facility-management', {
        body: { id, clientId: employeeData.clientId, action: 'delete' }
      });

      if (error) throw error;
      
      setFacilities(prev => prev.filter(f => f.id !== id));
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
