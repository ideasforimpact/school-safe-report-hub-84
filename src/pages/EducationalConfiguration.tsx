
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useIncidents } from '@/contexts/IncidentContext';
import { EducationalStructureConfig } from './configuration/EducationalStructureConfig';

const EducationalConfiguration = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('campuses');
  
  const { 
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
  } = useIncidents();

  // Set initial tab based on URL parameter when component mounts
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto p-4">
        <div>
          <h1 className="text-2xl font-bold">Educational Structure Configuration</h1>
          <p className="text-gray-600 mt-1">
            Manage campuses, classes, and sections
          </p>
        </div>

        <EducationalStructureConfig 
          activeTab={activeTab}
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
        />
      </div>
    </Layout>
  );
};

export default EducationalConfiguration;
