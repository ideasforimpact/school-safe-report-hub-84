
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useIncidents } from '@/contexts/IncidentContext';
import { OtherSettingsConfig } from './configuration/OtherSettingsConfig';

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
    addDesignation(name);
  };

  const handleUpdateDesignation = (id: string, name: string) => {
    updateDesignation(id, name);
  };

  const handleDeleteDesignation = (id: string) => {
    deleteDesignation(id);
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
          addCampus={addCampus}
          updateCampus={updateCampus}
          deleteCampus={deleteCampus}
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
