
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DesignationTab } from '@/components/configuration/DesignationTab';
import { ConfigItem, CampusItem, ClassItem, SectionItem } from '@/contexts/types';
import { UserCircle, Building, School } from 'lucide-react';
import { EducationalStructureConfig } from './EducationalStructureConfig';
import { toast } from 'sonner';

interface OtherSettingsConfigProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  loading?: boolean;
  designations: ConfigItem[];
  addDesignation: (name: string) => void;
  updateDesignation: (id: string, name: string) => void;
  deleteDesignation: (id: string) => void;
  
  // Educational structure props
  campuses: CampusItem[];
  addCampus: (name: string) => void;
  updateCampus: (id: string, name: string) => void;
  deleteCampus: (id: string) => void;
  classes: ClassItem[];
  addClass: (campusId: string, name: string) => void;
  updateClass: (id: string, campusId: string, name: string) => void;
  deleteClass: (id: string) => void;
  sections: SectionItem[];
  addSection: (classId: string, name: string) => void;
  updateSection: (id: string, classId: string, name: string) => void;
  deleteSection: (id: string) => void;
  facilities: ConfigItem[];
  addFacility: (name: string, campusId: string) => void;
  updateFacility: (id: string, name: string, campusId: string) => void;
  deleteFacility: (id: string) => void;
}

export const OtherSettingsConfig: React.FC<OtherSettingsConfigProps> = ({
  activeTab,
  setActiveTab,
  loading = false,
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
}) => {
  // Keep track of the actual tab value to handle disabled tabs logic
  const [currentTab, setCurrentTab] = useState(activeTab || 'designations');
  const [eduStructureTab, setEduStructureTab] = useState('campuses');
  
  // Check if campuses are available
  const hasCampuses = campuses.length > 0;

  // Update internal tab when parent activeTab changes
  useEffect(() => {
    setCurrentTab(activeTab || 'designations');
  }, [activeTab]);

  // Custom handler for tab changes
  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    setActiveTab(value);
  };

  // Custom handler for educational structure tab
  const handleEduStructureTabChange = (value: string) => {
    if (value !== 'campuses' && !hasCampuses) {
      toast.error("Please add at least one campus first before accessing this tab");
      return;
    }
    setEduStructureTab(value);
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="designations" className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              <span>Designations</span>
            </TabsTrigger>
            <TabsTrigger value="educational-structure" className="flex items-center gap-2">
              <School className="h-4 w-4" />
              <span>Educational Structure</span>
            </TabsTrigger>
            <TabsTrigger value="facilities" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>Facilities</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="designations">
            <DesignationTab 
              designations={designations}
              addDesignation={addDesignation}
              updateDesignation={updateDesignation}
              deleteDesignation={deleteDesignation}
            />
          </TabsContent>
          
          <TabsContent value="educational-structure">
            <EducationalStructureConfig 
              activeTab={eduStructureTab}
              setActiveTab={handleEduStructureTabChange}
              loading={loading}
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
          </TabsContent>
          
          <TabsContent value="facilities">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Facilities Management</h2>
              <p className="text-gray-600">
                This tab will be implemented in the next phase. For now, please use the Facilities tab in the Educational Structure section.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
