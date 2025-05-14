
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryTab } from '@/components/configuration/CategoryTab';
import { SubcategoryTab } from '@/components/configuration/SubcategoryTab';
import { LocationTab } from '@/components/configuration/LocationTab';
import { FacilityTab } from '@/components/configuration/FacilityTab';
import { ContributingFactorsTab } from '@/components/configuration/ContributingFactorsTab';
import { ConfigItem, SubcategoryItem, CampusItem } from '@/contexts/types';
import { MapPin, Building2, BarChart } from 'lucide-react';
import { ContributingFactor } from '@/hooks/config/useContributingFactorsManagement';

interface IncidentRelatedConfigProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  categories: ConfigItem[];
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  subcategoryMappings: Record<string, SubcategoryItem[]>;
  addSubcategory: (categoryId: string, name: string) => void;
  updateSubcategory: (categoryId: string, id: string, name: string) => void;
  deleteSubcategory: (categoryId: string, id: string) => void;
  locations: ConfigItem[];
  addLocation: (name: string) => void;
  updateLocation: (id: string, name: string) => void;
  deleteLocation: (id: string) => void;
  facilities: ConfigItem[];
  addFacility: (name: string) => void;
  updateFacility: (id: string, name: string) => void;
  deleteFacility: (id: string) => void;
  campuses: CampusItem[]; 
  contributingFactors: ContributingFactor[];
  addContributingFactor: (name: string, description: string, weight: 'Low' | 'Medium' | 'High') => void;
  updateContributingFactor: (id: string, name: string, description: string, weight: 'Low' | 'Medium' | 'High') => void;
  deleteContributingFactor: (id: string) => void;
}

export const IncidentRelatedConfig: React.FC<IncidentRelatedConfigProps> = ({
  activeTab,
  setActiveTab,
  categories,
  addCategory,
  updateCategory,
  deleteCategory,
  subcategoryMappings,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  locations,
  addLocation,
  updateLocation,
  deleteLocation,
  facilities,
  addFacility,
  updateFacility,
  deleteFacility,
  campuses,
  contributingFactors,
  addContributingFactor,
  updateContributingFactor,
  deleteContributingFactor
}) => {
  // Check if campuses are available to enable tabs
  const hasCampuses = campuses.length > 0;
  
  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="categories" value={activeTab || 'categories'} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Locations</span>
            </TabsTrigger>
            <TabsTrigger 
              value="facilities" 
              className="flex items-center gap-2"
              disabled={!hasCampuses}
            >
              <Building2 className="h-4 w-4" />
              <span>Facilities</span>
            </TabsTrigger>
            <TabsTrigger value="contributingFactors" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              <span>Contributing Factors</span>
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
              campuses={campuses}
            />
          </TabsContent>

          <TabsContent value="contributingFactors">
            <ContributingFactorsTab 
              contributingFactors={contributingFactors}
              addContributingFactor={addContributingFactor}
              updateContributingFactor={updateContributingFactor}
              deleteContributingFactor={deleteContributingFactor}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
