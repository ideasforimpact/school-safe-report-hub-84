
import React from 'react';
import Layout from '@/components/layout/Layout';
import { OtherSettingsConfig } from './configuration/OtherSettingsConfig';
import { EducationalConfigurationHeader } from '@/components/configuration/EducationalConfigurationHeader';
import { useOtherConfigurationManagement } from '@/hooks/useOtherConfigurationManagement';

const OtherConfiguration = () => {
  const {
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
  } = useOtherConfigurationManagement();

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto p-4">
        <EducationalConfigurationHeader
          title="Other Settings Configuration"
          description="Manage designations, educational structure, and facilities"
        />

        <OtherSettingsConfig 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          loading={loading}
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
