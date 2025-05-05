import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useIncidents } from '@/contexts/IncidentContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { CategoryTab } from '@/components/configuration/CategoryTab';
import { SubcategoryTab } from '@/components/configuration/SubcategoryTab';
import { LocationTab } from '@/components/configuration/LocationTab';
import { FacilityTab } from '@/components/configuration/FacilityTab';
import { DesignationTab } from '@/components/configuration/DesignationTab';
import { CampusTab } from '@/components/configuration/CampusTab';
import { ClassTab } from '@/components/configuration/ClassTab';
import { SectionTab } from '@/components/configuration/SectionTab';
import { 
  Building, 
  Folder, 
  FolderOpen, 
  AlertTriangle, 
  MapPin, 
  Building2, 
  UserCircle, 
  LayoutGrid 
} from 'lucide-react';

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

  // Track the active top-level category
  const [activeCategory, setActiveCategory] = useState('incident');

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
            <Card>
              <CardContent className="pt-6">
                <Tabs defaultValue="categories">
                  <TabsList className="mb-4">
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
                    <TabsTrigger value="locations" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Locations</span>
                    </TabsTrigger>
                    <TabsTrigger value="facilities" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>Facilities</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="categories">
                    <CategoryTab 
                      categories={categories}
                      addCategory={addCategory}
                      updateCategory={updateCategory}
                      deleteCategory={deleteCategory}
                    />
                  </TabsContent>
                  
                  <TabsContent value="subcategories">
                    <SubcategoryTab 
                      categories={categories}
                      subcategoryMappings={subcategoryMappings}
                      addSubcategory={addSubcategory}
                      updateSubcategory={updateSubcategory}
                      deleteSubcategory={deleteSubcategory}
                    />
                  </TabsContent>
                  
                  <TabsContent value="locations">
                    <LocationTab 
                      locations={locations}
                      addLocation={addLocation}
                      updateLocation={updateLocation}
                      deleteLocation={deleteLocation}
                    />
                  </TabsContent>
                  
                  <TabsContent value="facilities">
                    <FacilityTab 
                      facilities={facilities}
                      addFacility={addFacility}
                      updateFacility={updateFacility}
                      deleteFacility={deleteFacility}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Educational structure configurations */}
          <TabsContent value="educational">
            <Card>
              <CardContent className="pt-6">
                <Tabs defaultValue="campuses">
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
          </TabsContent>
          
          {/* Other configurations */}
          <TabsContent value="other">
            <Card>
              <CardContent className="pt-6">
                <Tabs defaultValue="designations">
                  <TabsList className="mb-4">
                    <TabsTrigger value="designations" className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      <span>Designations</span>
                    </TabsTrigger>
                    {/* Additional configuration tabs can be added here in the future */}
                  </TabsList>
                  
                  <TabsContent value="designations">
                    <DesignationTab 
                      designations={designations}
                      addDesignation={addDesignation}
                      updateDesignation={updateDesignation}
                      deleteDesignation={deleteDesignation}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ConfigurationManagement;
