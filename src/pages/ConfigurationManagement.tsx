
import React from 'react';
import Layout from '@/components/layout/Layout';
import { useIncidents } from '@/contexts/IncidentContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryTab } from '@/components/configuration/CategoryTab';
import { SubcategoryTab } from '@/components/configuration/SubcategoryTab';
import { LocationTab } from '@/components/configuration/LocationTab';
import { FacilityTab } from '@/components/configuration/FacilityTab';
import { DesignationTab } from '@/components/configuration/DesignationTab';

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
    deleteDesignation
  } = useIncidents();

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto p-4">
        <div>
          <h1 className="text-2xl font-bold">Configuration Management</h1>
          <p className="text-gray-600 mt-1">
            Manage incident categories, subcategories, locations, facilities, and designations
          </p>
        </div>

        <Tabs defaultValue="categories">
          <TabsList className="mb-4">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="facilities">Facilities</TabsTrigger>
            <TabsTrigger value="designations">Designations</TabsTrigger>
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
        </Tabs>
      </div>
    </Layout>
  );
};

export default ConfigurationManagement;
