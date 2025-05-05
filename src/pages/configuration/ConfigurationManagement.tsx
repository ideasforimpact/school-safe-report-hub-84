import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useIncidents } from '@/contexts/IncidentContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Building, LayoutGrid } from 'lucide-react';
import { IncidentRelatedConfig } from './IncidentRelatedConfig';
import { EducationalStructureConfig } from './EducationalStructureConfig';
import { OtherSettingsConfig } from './OtherSettingsConfig';

const ConfigurationManagement = () => {
  const [searchParams] = useSearchParams();
  // Track the active top-level category
  const [activeCategory, setActiveCategory] = useState('incident');
  // Track the active tab within a category
  const [activeTab, setActiveTab] = useState('');

  const { 
    categories, 
    addCategory, 
    deleteCategory, 
    updateCategory,
    subcategoryMappings, 
    addSubcategory, 
    deleteSubcategory, 
    updateSubcategory,
    locations,
    addLocation,
    deleteLocation,
    updateLocation,
    facilities,
    addFacility,
    deleteFacility,
    updateFacility,
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
    deleteSection
  } = useIncidents();

  // Set initial tabs based on URL parameters when component mounts
  useEffect(() => {
    const category = searchParams.get('category');
    const tab = searchParams.get('tab');
    
    if (category && ['incident', 'educational', 'other'].includes(category)) {
      setActiveCategory(category);
    }
    
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto p-4">
        <div>
          <h1 className="text-2xl font-bold">Configuration Management</h1>
          <p className="text-gray-600 mt-1">
            Manage system configuration settings
          </p>
        </div>

        {/* Main category selection */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="mb-6">
            <TabsTrigger value="incident" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Incident Related</span>
            </TabsTrigger>
            <TabsTrigger value="educational" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>Educational Structure</span>
            </TabsTrigger>
            <TabsTrigger value="other" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              <span>Other Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Incident related configurations */}
          <TabsContent value="incident">
            <IncidentRelatedConfig 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              categories={categories}
              addCategory={addCategory}
              updateCategory={updateCategory}
              deleteCategory={deleteCategory}
              subcategoryMappings={subcategoryMappings}
              addSubcategory={addSubcategory}
              updateSubcategory={updateSubcategory}
              deleteSubcategory={deleteSubcategory}
              locations={locations}
              addLocation={addLocation}
              updateLocation={updateLocation}
              deleteLocation={deleteLocation}
              facilities={facilities}
              addFacility={addFacility}
              updateFacility={updateFacility}
              deleteFacility={deleteFacility}
            />
          </TabsContent>
          
          {/* Educational structure configurations */}
          <TabsContent value="educational">
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
          </TabsContent>
          
          {/* Other configurations */}
          <TabsContent value="other">
            <OtherSettingsConfig 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              designations={designations}
              addDesignation={addDesignation}
              updateDesignation={updateDesignation}
              deleteDesignation={deleteDesignation}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ConfigurationManagement;
