
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DesignationTab } from '@/components/configuration/DesignationTab';
import { ConfigItem, CampusItem, ClassItem, SectionItem } from '@/contexts/types';
import { UserCircle, Building, School } from 'lucide-react';
import { EducationalStructureConfig } from './EducationalStructureConfig';

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
  addFacility: (name: string) => void;
  updateFacility: (id: string, name: string) => void;
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
              activeTab="campuses"
              setActiveTab={() => {/* This is intentional - we want to stay within educational structure tab */}}
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
                Add, edit, or remove facilities. This will be implemented in the next phase.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
