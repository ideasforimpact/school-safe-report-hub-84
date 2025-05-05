
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useIncidents } from '@/contexts/IncidentContext';
import { EducationalStructureConfig } from './configuration/EducationalStructureConfig';
import { toast } from 'sonner';
import { CampusItem, ClassItem, SectionItem } from '@/contexts/types';

const EducationalConfiguration = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('campuses');
  
  const { 
    campuses: contextCampuses,
    addCampus: contextAddCampus,
    updateCampus: contextUpdateCampus,
    deleteCampus: contextDeleteCampus,
    classes: contextClasses,
    addClass: contextAddClass,
    updateClass: contextUpdateClass,
    deleteClass: contextDeleteClass,
    sections: contextSections,
    addSection: contextAddSection,
    updateSection: contextUpdateSection,
    deleteSection: contextDeleteSection
  } = useIncidents();

  // Local state to sync with context
  const [campuses, setCampuses] = useState(contextCampuses);
  const [classes, setClasses] = useState(contextClasses);
  const [sections, setSections] = useState(contextSections);

  // Update local state when context changes
  useEffect(() => {
    setCampuses(contextCampuses);
    setClasses(contextClasses);
    setSections(contextSections);
  }, [contextCampuses, contextClasses, contextSections]);
  
  // Set initial tab based on URL parameter when component mounts
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleAddCampus = (name: string) => {
    try {
      console.log('EducationalConfiguration: Adding campus:', name); // Debug log
      const newCampus = contextAddCampus(name);
      console.log('New campus created:', newCampus); // Debug log
      
      // Check if newCampus is defined before updating state
      if (newCampus) {
        // Manually update the local state to ensure UI update
        setCampuses(prev => [...prev, newCampus]);
      }
      
      toast.success("Campus added successfully");
    } catch (error) {
      console.error("Error adding campus:", error);
      toast.error("Failed to add campus");
    }
  };

  const handleUpdateCampus = (id: string, name: string) => {
    try {
      contextUpdateCampus(id, name);
      // Update local state
      setCampuses(prev => prev.map(c => c.id === id ? { ...c, name } : c));
      toast.success("Campus updated successfully");
    } catch (error) {
      console.error("Error updating campus:", error);
      toast.error("Failed to update campus");
    }
  };

  const handleDeleteCampus = (id: string) => {
    try {
      contextDeleteCampus(id);
      // Update local state
      setCampuses(prev => prev.filter(c => c.id !== id));
      toast.success("Campus deleted successfully");
    } catch (error) {
      console.error("Error deleting campus:", error);
      toast.error("Failed to delete campus");
    }
  };

  const handleAddClass = (campusId: string, name: string) => {
    try {
      contextAddClass(campusId, name);
      // No need to check the return value - context will update and trigger useEffect
      toast.success("Class added successfully");
    } catch (error) {
      console.error("Error adding class:", error);
      toast.error("Failed to add class");
    }
  };

  const handleUpdateClass = (id: string, campusId: string, name: string) => {
    try {
      contextUpdateClass(id, campusId, name);
      // Update local state
      setClasses(prev => prev.map(c => c.id === id ? { ...c, name, campusId } : c));
      toast.success("Class updated successfully");
    } catch (error) {
      console.error("Error updating class:", error);
      toast.error("Failed to update class");
    }
  };

  const handleDeleteClass = (id: string) => {
    try {
      contextDeleteClass(id);
      // Update local state
      setClasses(prev => prev.filter(c => c.id !== id));
      toast.success("Class deleted successfully");
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error("Failed to delete class");
    }
  };

  const handleAddSection = (classId: string, name: string) => {
    try {
      contextAddSection(classId, name);
      // No need to check the return value - context will update and trigger useEffect
      toast.success("Section added successfully");
    } catch (error) {
      console.error("Error adding section:", error);
      toast.error("Failed to add section");
    }
  };

  const handleUpdateSection = (id: string, classId: string, name: string) => {
    try {
      contextUpdateSection(id, classId, name);
      // Update local state
      setSections(prev => prev.map(s => s.id === id ? { ...s, name, classId } : s));
      toast.success("Section updated successfully");
    } catch (error) {
      console.error("Error updating section:", error);
      toast.error("Failed to update section");
    }
  };

  const handleDeleteSection = (id: string) => {
    try {
      contextDeleteSection(id);
      // Update local state
      setSections(prev => prev.filter(s => s.id !== id));
      toast.success("Section deleted successfully");
    } catch (error) {
      console.error("Error deleting section:", error);
      toast.error("Failed to delete section");
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto p-4">
        <div>
          <h1 className="text-2xl font-bold">Educational Structure Configuration</h1>
          <p className="text-gray-600 mt-1">
            Manage campuses, classes, and sections
          </p>
        </div>

        <EducationalStructureConfig 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          campuses={campuses}
          addCampus={handleAddCampus}
          updateCampus={handleUpdateCampus}
          deleteCampus={handleDeleteCampus}
          classes={classes}
          addClass={handleAddClass}
          updateClass={handleUpdateClass}
          deleteClass={handleDeleteClass}
          sections={sections}
          addSection={handleAddSection}
          updateSection={handleUpdateSection}
          deleteSection={handleDeleteSection}
        />
      </div>
    </Layout>
  );
};

export default EducationalConfiguration;
