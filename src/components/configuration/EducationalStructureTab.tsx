import React from 'react';
import { EducationalStructureConfig } from '@/pages/configuration/EducationalStructureConfig';
import { useEducationalConfigurationManagement } from '@/hooks/useEducationalConfigurationManagement';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';

const EducationalStructureTab = () => {
  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();
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
    handleDeleteFacility,
  } = useEducationalConfigurationManagement();

  return (
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
      canCreate={!isReadOnlySwitchedContext}
    />
  );
};

export default EducationalStructureTab;
