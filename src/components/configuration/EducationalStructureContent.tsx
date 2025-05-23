
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CampusTab } from '@/components/configuration/CampusTab';
import { ClassTab } from '@/components/configuration/ClassTab';
import { SectionTab } from '@/components/configuration/SectionTab';
import { FacilityTab } from '@/components/configuration/FacilityTab';
import { useEducationalConfigurationManagement } from '@/hooks/useEducationalConfigurationManagement';

const EducationalStructureContent = () => {
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
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 lg:grid-cols-4 mb-4">
          <TabsTrigger value="campuses">Campuses</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
        </TabsList>
        
        <TabsContent value="campuses">
          <CampusTab
            campuses={campuses}
            loading={loading}
            onAdd={handleAddCampus}
            onUpdate={handleUpdateCampus}
            onDelete={handleDeleteCampus}
          />
        </TabsContent>
        
        <TabsContent value="classes">
          <ClassTab
            classes={classes}
            loading={loading}
            onAdd={handleAddClass}
            onUpdate={handleUpdateClass}
            onDelete={handleDeleteClass}
          />
        </TabsContent>
        
        <TabsContent value="sections">
          <SectionTab
            sections={sections}
            loading={loading}
            onAdd={handleAddSection}
            onUpdate={handleUpdateSection}
            onDelete={handleDeleteSection}
          />
        </TabsContent>
        
        <TabsContent value="facilities">
          <FacilityTab
            facilities={facilities}
            loading={loading}
            onAdd={handleAddFacility}
            onUpdate={handleUpdateFacility}
            onDelete={handleDeleteFacility}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EducationalStructureContent;
