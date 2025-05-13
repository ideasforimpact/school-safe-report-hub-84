
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryTab } from '@/components/configuration/CategoryTab';
import { SubcategoryTab } from '@/components/configuration/SubcategoryTab';
import { LocationTab } from '@/components/configuration/LocationTab';
import { FacilityTab } from '@/components/configuration/FacilityTab';
import { MapPin, Building2 } from 'lucide-react';
import { useIncidents } from '@/contexts/IncidentContext';

interface IncidentRelatedConfigProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const IncidentRelatedConfig: React.FC<IncidentRelatedConfigProps> = ({
  activeTab,
  setActiveTab
}) => {
  // Get the necessary data and functions from the context
  const {
    locations,
    facilities,
    campuses,
    addLocation,
    updateLocation,
    deleteLocation,
    addFacility,
    updateFacility,
    deleteFacility
  } = useIncidents();

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
            <TabsTrigger value="facilities" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Facilities</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories">
            <CategoryTab />
          </TabsContent>
          
          <TabsContent value="subcategories">
            <SubcategoryTab />
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
              campuses={campuses}
              addFacility={addFacility}
              updateFacility={updateFacility}
              deleteFacility={deleteFacility}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
