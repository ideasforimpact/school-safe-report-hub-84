
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

  const handleAddCampus = (name: string) => {
    addCampus(name);
  };

  const handleUpdateCampus = (id: string, name: string) => {
    updateCampus(id, name);
  };

  const handleDeleteCampus = (id: string) => {
    deleteCampus(id);
  };

  const handleAddClass = (campusId: string, name: string) => {
    addClass(campusId, name);
  };

  const handleUpdateClass = (id: string, campusId: string, name: string) => {
    updateClass(id, campusId, name);
  };

  const handleDeleteClass = (id: string) => {
    deleteClass(id);
  };

  const handleAddSection = (classId: string, name: string) => {
    addSection(classId, name);
  };

  const handleUpdateSection = (id: string, classId: string, name: string) => {
    updateSection(id, classId, name);
  };

  const handleDeleteSection = (id: string) => {
    deleteSection(id);
  };

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
        />
      </div>
    </Layout>
  );
};

export default EducationalConfiguration;
