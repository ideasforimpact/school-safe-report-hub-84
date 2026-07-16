import React from 'react';
import { EducationalStructureConfig } from '@/pages/configuration/EducationalStructureConfig';
import { useEducationalConfigurationManagement } from '@/hooks/useEducationalConfigurationManagement';

interface EducationalStructureTabContentProps {
  canCreate?: boolean;
}

// Wraps useEducationalConfigurationManagement so its campus/grade/section/facility
// fetches only run once this tab is actually mounted (Radix TabsContent only
// mounts the active tab's children) — calling the hook from SettingsPage directly
// fired those 4 edge functions on every Settings visit, regardless of which tab
// was open.
export const EducationalStructureTabContent: React.FC<EducationalStructureTabContentProps> = ({ canCreate }) => {
  const {
    activeTab, setActiveTab, loading, campuses, classes, sections, facilities,
    handleAddCampus, handleUpdateCampus, handleDeleteCampus,
    handleAddClass, handleUpdateClass, handleDeleteClass,
    handleAddSection, handleUpdateSection, handleDeleteSection,
    handleAddFacility, handleUpdateFacility, handleDeleteFacility,
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
      canCreate={canCreate}
    />
  );
};
