
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CampusTab } from '@/components/configuration/CampusTab';
import { ClassTab } from '@/components/configuration/ClassTab';
import { SectionTab } from '@/components/configuration/SectionTab';
import { ConfigItem, SectionItem, ClassItem, CampusItem } from '@/contexts/types';
import { Building, Folder, FolderOpen } from 'lucide-react';

interface EducationalStructureConfigProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
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
}

export const EducationalStructureConfig: React.FC<EducationalStructureConfigProps> = ({
  activeTab,
  setActiveTab,
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
  deleteSection
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="campuses" value={activeTab || 'campuses'} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="campuses" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>Campuses</span>
            </TabsTrigger>
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              <span>Classes</span>
            </TabsTrigger>
            <TabsTrigger value="sections" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              <span>Sections</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="campuses">
            <CampusTab 
              campuses={campuses}
              addCampus={addCampus}
              updateCampus={updateCampus}
              deleteCampus={deleteCampus}
              classes={classes}
            />
          </TabsContent>
          
          <TabsContent value="classes">
            <ClassTab 
              classes={classes}
              campuses={campuses}
              addClass={addClass}
              updateClass={updateClass}
              deleteClass={deleteClass}
            />
          </TabsContent>
          
          <TabsContent value="sections">
            <SectionTab 
              sections={sections}
              classes={classes}
              addSection={addSection}
              updateSection={updateSection}
              deleteSection={deleteSection}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
