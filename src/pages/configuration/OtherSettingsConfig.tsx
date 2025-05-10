import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ConfigItem, CampusItem, ClassItem, SectionItem } from '@/contexts/types';
import { School } from 'lucide-react';
import { EducationalStructureConfig } from './EducationalStructureConfig';

interface OtherSettingsConfigProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  loading?: boolean;
  
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
  
  // Designations props (kept for compatibility but no longer used)
  designations?: ConfigItem[];
  addDesignation?: (name: string) => void;
  updateDesignation?: (id: string, name: string) => void;
  deleteDesignation?: (id: string) => void;
}

export const OtherSettingsConfig: React.FC<OtherSettingsConfigProps> = ({
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
  // Keep track of the actual tab value within educational structure
  const [eduStructureTab, setEduStructureTab] = useState('campuses');
  
  // Check if campuses are available
  const hasCampuses = campuses.length > 0;

  // Custom handler for educational structure tab
  const handleEduStructureTabChange = (value: string) => {
    if (value !== 'campuses' && !hasCampuses) {
      return;
    }
    setEduStructureTab(value);
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
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
      </CardContent>
    </Card>
  );
};
