
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CampusTab } from '@/components/configuration/CampusTab';
import { ClassTab } from '@/components/configuration/ClassTab';
import { SectionTab } from '@/components/configuration/SectionTab';
import { FacilityTab } from '@/components/configuration/FacilityTab';
import { CampusItem, ClassItem, SectionItem, ConfigItem } from '@/contexts/types';
import { Building, GraduationCap, Users, Warehouse } from 'lucide-react';
import { toast } from 'sonner';

interface EducationalStructureConfigProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  loading?: boolean;
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

export const EducationalStructureConfig: React.FC<EducationalStructureConfigProps> = ({
  activeTab,
  setActiveTab,
  loading = false,
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
  const [currentTab, setCurrentTab] = useState(activeTab || 'campuses');
  
  // Check if campuses are available to enable other tabs
  const hasCampuses = campuses.length > 0;

  // Update internal tab when parent activeTab changes
  useEffect(() => {
    setCurrentTab(activeTab || 'campuses');
  }, [activeTab]);
  
  // Custom handler for tab changes with validation
  const handleTabChange = (value: string) => {
    if (value !== 'campuses' && !hasCampuses) {
      toast.error("Please add at least one campus first before accessing this tab");
      return;
    }
    setCurrentTab(value);
    setActiveTab(value);
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="campuses" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>Campuses</span>
            </TabsTrigger>
            <TabsTrigger 
              value="classes" 
              className="flex items-center gap-2" 
              disabled={!hasCampuses}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Grades</span>
            </TabsTrigger>
            <TabsTrigger 
              value="sections" 
              className="flex items-center gap-2"
              disabled={!hasCampuses}
            >
              <Users className="h-4 w-4" />
              <span>Sections</span>
            </TabsTrigger>
            <TabsTrigger 
              value="facilities" 
              className="flex items-center gap-2"
              disabled={!hasCampuses}
            >
              <Warehouse className="h-4 w-4" />
              <span>Facilities</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="campuses">
            <CampusTab 
              campuses={campuses}
              addCampus={addCampus}
              updateCampus={updateCampus}
              deleteCampus={deleteCampus}
              classes={classes}
              loading={loading}
            />
          </TabsContent>
          
          <TabsContent value="classes">
            <ClassTab 
              classes={classes}
              campuses={campuses}
              addClass={addClass}
              updateClass={updateClass}
              deleteClass={deleteClass}
              sections={sections}
              loading={loading}
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
          
          <TabsContent value="facilities">
            <FacilityTab 
              facilities={facilities}
              campuses={campuses}
              addFacility={addFacility}
              updateFacility={updateFacility}
              deleteFacility={deleteFacility}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
