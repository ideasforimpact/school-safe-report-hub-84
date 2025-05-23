
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
          <div className="p-4 border rounded-md">
            <h3 className="text-lg font-medium mb-4">Campus Management</h3>
            <p>Loading campus management interface...</p>
          </div>
        </TabsContent>
        
        <TabsContent value="classes">
          <div className="p-4 border rounded-md">
            <h3 className="text-lg font-medium mb-4">Class Management</h3>
            <p>Loading class management interface...</p>
          </div>
        </TabsContent>
        
        <TabsContent value="sections">
          <div className="p-4 border rounded-md">
            <h3 className="text-lg font-medium mb-4">Section Management</h3>
            <p>Loading section management interface...</p>
          </div>
        </TabsContent>
        
        <TabsContent value="facilities">
          <div className="p-4 border rounded-md">
            <h3 className="text-lg font-medium mb-4">Facility Management</h3>
            <p>Loading facility management interface...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EducationalStructureContent;
