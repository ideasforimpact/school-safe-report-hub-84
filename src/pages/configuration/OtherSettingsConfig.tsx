
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DesignationTab } from '@/components/configuration/DesignationTab';
import { ConfigItem, CampusItem, ClassItem, SectionItem } from '@/contexts/types';
import { UserCircle, Building } from 'lucide-react';
import { EducationalStructureConfig } from './EducationalStructureConfig';

interface OtherSettingsConfigProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
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
  addFacility: (name: string) => void;
  updateFacility: (id: string, name: string) => void;
  deleteFacility: (id: string) => void;
}

export const OtherSettingsConfig: React.FC<OtherSettingsConfigProps> = ({
  activeTab,
  setActiveTab,
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
  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="designations" value={activeTab || 'designations'} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="designations" className="flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              <span>Designations</span>
            </TabsTrigger>
            <TabsTrigger value="educational-structure" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>Educational Structure</span>
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
              activeTab={activeTab === "educational-structure" ? "campuses" : activeTab}
              setActiveTab={setActiveTab}
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
        </Tabs>
      </CardContent>
    </Card>
  );
};
