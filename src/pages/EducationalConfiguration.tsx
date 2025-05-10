
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
    deleteSection: contextDeleteSection,
    facilities: contextFacilities,
    addFacility: contextAddFacility,
    updateFacility: contextUpdateFacility,
    deleteFacility: contextDeleteFacility
  } = useIncidents();

  // Local state to sync with context
  const [campuses, setCampuses] = useState<CampusItem[]>(contextCampuses);
  const [classes, setClasses] = useState<ClassItem[]>(contextClasses);
  const [sections, setSections] = useState<SectionItem[]>(contextSections);
  const [facilities, setFacilities] = useState<ConfigItem[]>(contextFacilities);

  // Update local state when context changes
  useEffect(() => {
    setCampuses(contextCampuses);
    setClasses(contextClasses);
    setSections(contextSections);
    setFacilities(contextFacilities);
  }, [contextCampuses, contextClasses, contextSections, contextFacilities]);
  
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
      contextAddCampus(name);
      toast.success("Campus added successfully");
    } catch (error) {
      console.error("Error adding campus:", error);
      toast.error("Failed to add campus");
    }
  };

  const handleUpdateCampus = (id: string, name: string) => {
    try {
      contextUpdateCampus(id, name);
      toast.success("Campus updated successfully");
    } catch (error) {
      console.error("Error updating campus:", error);
      toast.error("Failed to update campus");
    }
  };

  const handleDeleteCampus = (id: string) => {
    try {
      contextDeleteCampus(id);
      toast.success("Campus deleted successfully");
    } catch (error) {
      console.error("Error deleting campus:", error);
      toast.error("Failed to delete campus");
    }
  };

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

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto p-4">
        <div>
          <h1 className="text-2xl font-bold">Educational Structure Configuration</h1>
          <p className="text-gray-600 mt-1">
            Manage campuses, classes, sections, and facilities
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
          facilities={facilities}
          addFacility={handleAddFacility}
          updateFacility={handleUpdateFacility}
          deleteFacility={handleDeleteFacility}
        />
      </div>
    </Layout>
  );
};

export default EducationalConfiguration;
