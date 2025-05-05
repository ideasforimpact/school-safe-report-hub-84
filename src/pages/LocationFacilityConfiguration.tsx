
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIncidents } from '@/contexts/IncidentContext';
import { toast } from '@/components/ui/sonner';
import { LocationTab } from '@/components/configuration/LocationTab';
import { FacilityTab } from '@/components/configuration/FacilityTab';
import { MapPin, Building2 } from 'lucide-react';
import { useFacilities } from '@/contexts/FacilityContext';

const LocationFacilityConfiguration = () => {
  const [activeTab, setActiveTab] = useState('locations');

  const { 
    facilities: configFacilities,
    addFacility: addConfigFacility,
    updateFacility: updateConfigFacility,
    deleteFacility: deleteConfigFacility,
    locations,
    addLocation,
    updateLocation,
    deleteLocation
  } = useIncidents();
  
  // Also get facilities from context
  const { 
    facilities: contextFacilities, 
    addFacility: addContextFacility,
    resetFacilities
  } = useFacilities();

  // Convert context facilities to ConfigItem format for display
  const contextFacilitiesItems = contextFacilities.map(name => ({
    id: `facility-${name}`,
    name
  }));

  // Merge facilities, ensuring no duplicates
  const allFacilities = [...configFacilities];
  
  // Add facilities from context if they don't already exist
  contextFacilitiesItems.forEach(facility => {
    if (!configFacilities.some(f => f.name === facility.name)) {
      allFacilities.push(facility);
    }
  });

  // Custom handlers for facilities that update both systems
  const handleAddFacility = (name: string) => {
    try {
      // Try to add to config system first
      addConfigFacility(name);
      // Also add to context system as backup
      addContextFacility(name);
      toast.success("Facility added successfully");
    } catch (error) {
      console.error("Error adding facility:", error);
      toast.error("Failed to add facility");
    }
  };

  const handleUpdateFacility = (id: string, name: string) => {
    try {
      // If it's a context facility, add it to config
      if (id.startsWith('facility-')) {
        addConfigFacility(name);
      } else {
        updateConfigFacility(id, name);
      }
      toast.success("Facility updated successfully");
    } catch (error) {
      console.error("Error updating facility:", error);
      toast.error("Failed to update facility");
    }
  };

  const handleDeleteFacility = (id: string) => {
    try {
      // If it's from context, we can't delete individual items easily
      // We'll just warn the user
      if (id.startsWith('facility-')) {
        toast.warning("Context facilities can only be reset as a group. Use the reset button.");
        return;
      }
      
      deleteConfigFacility(id);
      toast.success("Facility deleted successfully");
    } catch (error) {
      console.error("Error deleting facility:", error);
      toast.error("Failed to delete facility");
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto p-4">
        <div>
          <h1 className="text-2xl font-bold">Location & Facility Configuration</h1>
          <p className="text-gray-600 mt-1">
            Manage locations and facilities for incident reporting
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="locations" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Locations</span>
                </TabsTrigger>
                <TabsTrigger value="facilities" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Facilities</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="locations">
                <LocationTab 
                  locations={locations}
                  addLocation={addLocation}
                  updateLocation={updateLocation}
                  deleteLocation={deleteLocation}
                />
              </TabsContent>
              
              <TabsContent value="facilities">
                <div className="mb-4">
                  <button 
                    onClick={resetFacilities}
                    className="px-4 py-2 bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200 transition-colors"
                  >
                    Reset Context Facilities
                  </button>
                  <p className="text-sm text-gray-500 mt-1">
                    This will reset all facilities stored in the context system.
                  </p>
                </div>
                <FacilityTab 
                  facilities={allFacilities}
                  addFacility={handleAddFacility}
                  updateFacility={handleUpdateFacility}
                  deleteFacility={handleDeleteFacility}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default LocationFacilityConfiguration;
