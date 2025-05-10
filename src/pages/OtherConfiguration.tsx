
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useIncidents } from '@/contexts/IncidentContext';
import { OtherSettingsConfig } from './configuration/OtherSettingsConfig';
import { toast } from 'sonner';

const OtherConfiguration = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('designations');
  
  const { 
    designations,
    addDesignation,
    updateDesignation,
    deleteDesignation,
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

  // Set initial tab based on URL parameter when component mounts
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleAddDesignation = (name: string) => {
    try {
      addDesignation(name);
      toast.success("Designation added successfully");
    } catch (error) {
      console.error("Error adding designation:", error);
      toast.error("Failed to add designation");
    }
  };

  const handleUpdateDesignation = (id: string, name: string) => {
    try {
      updateDesignation(id, name);
      toast.success("Designation updated successfully");
    } catch (error) {
      console.error("Error updating designation:", error);
      toast.error("Failed to update designation");
    }
  };

  const handleDeleteDesignation = (id: string) => {
    try {
      deleteDesignation(id);
      toast.success("Designation deleted successfully");
    } catch (error) {
      console.error("Error deleting designation:", error);
      toast.error("Failed to delete designation");
    }
  };

  const handleAddCampus = (name: string) => {
    try {
      console.log('OtherConfiguration: Adding campus:', name); // Debug log
      addCampus(name);
      toast.success("Campus added successfully");
    } catch (error) {
      console.error("Error adding campus:", error);
      toast.error("Failed to add campus");
    }
  };

  const handleUpdateCampus = (id: string, name: string) => {
    try {
      updateCampus(id, name);
      toast.success("Campus updated successfully");
    } catch (error) {
      console.error("Error updating campus:", error);
      toast.error("Failed to update campus");
    }
  };

  const handleDeleteCampus = (id: string) => {
    try {
      // Check if campus has associated classes before deleting
      const hasClasses = classes.some(cls => cls.campusId === id);
      
      if (hasClasses) {
        toast.error("Cannot delete campus with associated classes. Remove the classes first.");
        return;
      }

      deleteCampus(id);
      toast.success("Campus deleted successfully");
    } catch (error) {
      console.error("Error deleting campus:", error);
      toast.error("Failed to delete campus");
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto p-4">
        <div>
          <h1 className="text-2xl font-bold">Other Settings Configuration</h1>
          <p className="text-gray-600 mt-1">
            Manage designations, educational structure, and facilities
          </p>
        </div>

        <OtherSettingsConfig 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          designations={designations}
          addDesignation={handleAddDesignation}
          updateDesignation={handleUpdateDesignation}
          deleteDesignation={handleDeleteDesignation}
          campuses={campuses}
          addCampus={handleAddCampus}
          updateCampus={handleUpdateCampus}
          deleteCampus={handleDeleteCampus}
          classes={classes}
          addClass={addClass}
          updateClass={updateClass}
          deleteClass={deleteClass}
          sections={sections}
          addSection={addSection}
          updateSection={updateSection}
          deleteSection={deleteSection}
          facilities={facilities}
          addFacility={addFacility}
          updateFacility={updateFacility}
          deleteFacility={deleteFacility}
        />
      </div>
    </Layout>
  );
};

export default OtherConfiguration;
