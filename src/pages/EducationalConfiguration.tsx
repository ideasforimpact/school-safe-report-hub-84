
import React from 'react';
import Layout from '@/components/layout/Layout';
import { EducationalStructureConfig } from './configuration/EducationalStructureConfig';
import { EducationalConfigurationHeader } from '@/components/configuration/EducationalConfigurationHeader';
import { useEducationalConfigurationManagement } from '@/hooks/useEducationalConfigurationManagement';
import { useLang } from '@/hooks/useLang';

const EducationalConfiguration = () => {
  const lang = useLang();
  const {
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
  } = useEducationalConfigurationManagement();

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto p-4">
        <EducationalConfigurationHeader
          title={`${lang.structure.pageTitle} Configuration`}
          description={lang.structure.pageDescription}
        />

        <EducationalStructureConfig 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          loading={loading}
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
