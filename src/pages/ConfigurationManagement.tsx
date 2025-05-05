
import React from 'react';
import Layout from '@/components/layout/Layout';
import { useIncidents } from '@/contexts/IncidentContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryTab } from '@/components/configuration/CategoryTab';
import { SubcategoryTab } from '@/components/configuration/SubcategoryTab';
import { LocationTab } from '@/components/configuration/LocationTab';
import { FacilityTab } from '@/components/configuration/FacilityTab';
import { DesignationTab } from '@/components/configuration/DesignationTab';
import { CampusTab } from '@/components/configuration/CampusTab';
import { ClassTab } from '@/components/configuration/ClassTab';
import { SectionTab } from '@/components/configuration/SectionTab';
import { Building, Folder, FolderOpen, Layers } from 'lucide-react';

const ConfigurationManagement = () => {
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

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto p-4">
        <div>
          <h1 className="text-2xl font-bold">Configuration Management</h1>
          <p className="text-gray-600 mt-1">
            Manage incident categories, subcategories, locations, facilities, designations, campuses, classes, and sections
          </p>
        </div>

        <Tabs defaultValue="categories">
          <TabsList className="mb-4 flex flex-wrap">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="facilities">Facilities</TabsTrigger>
            <TabsTrigger value="designations">Designations</TabsTrigger>
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
          
          {/* Categories Tab */}
          <TabsContent value="categories">
            <CategoryTab 
              categories={categories}
              addCategory={addCategory}
              updateCategory={updateCategory}
              deleteCategory={deleteCategory}
            />
          </TabsContent>
          
          {/* Subcategories Tab */}
          <TabsContent value="subcategories">
            <SubcategoryTab 
              categories={categories}
              subcategoryMappings={subcategoryMappings}
              addSubcategory={addSubcategory}
              updateSubcategory={updateSubcategory}
              deleteSubcategory={deleteSubcategory}
            />
          </TabsContent>
          
          {/* Locations Tab */}
          <TabsContent value="locations">
            <LocationTab 
              locations={locations}
              addLocation={addLocation}
              updateLocation={updateLocation}
              deleteLocation={deleteLocation}
            />
          </TabsContent>
          
          {/* Facilities Tab */}
          <TabsContent value="facilities">
            <FacilityTab 
              facilities={facilities}
              addFacility={addFacility}
              updateFacility={updateFacility}
              deleteFacility={deleteFacility}
            />
          </TabsContent>
          
          {/* Designations Tab */}
          <TabsContent value="designations">
            <DesignationTab 
              designations={designations}
              addDesignation={addDesignation}
              updateDesignation={updateDesignation}
              deleteDesignation={deleteDesignation}
            />
          </TabsContent>
          
          {/* Campuses Tab */}
          <TabsContent value="campuses">
            <CampusTab 
              campuses={campuses}
              addCampus={addCampus}
              updateCampus={updateCampus}
              deleteCampus={deleteCampus}
              classes={classes}
            />
          </TabsContent>
          
          {/* Classes Tab */}
          <TabsContent value="classes">
            <ClassTab 
              classes={classes}
              campuses={campuses}
              addClass={addClass}
              updateClass={updateClass}
              deleteClass={deleteClass}
            />
          </TabsContent>
          
          {/* Sections Tab */}
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
      </div>
    </Layout>
  );
};

export default ConfigurationManagement;
