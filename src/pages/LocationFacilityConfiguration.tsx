
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
import { ConfigItem } from '@/contexts/types';

const LocationFacilityConfiguration = () => {
  const [activeTab, setActiveTab] = useState('locations');
  const [localLocations, setLocalLocations] = useState<ConfigItem[]>([]);
  const [localFacilities, setLocalFacilities] = useState<ConfigItem[]>([]);
  const [localContextFacilities, setLocalContextFacilities] = useState<ConfigItem[]>([]);

  // Get facilities and locations from the context
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

  // Initialize local state once context data is loaded
  React.useEffect(() => {
    setLocalLocations(locations);
  }, [locations]);

  React.useEffect(() => {
    setLocalFacilities(configFacilities);
  }, [configFacilities]);

  React.useEffect(() => {
    // Convert context facilities to ConfigItem format for display
    const contextFacilitiesItems = contextFacilities.map(name => ({
      id: `facility-${name}`,
      name
    }));
    setLocalContextFacilities(contextFacilitiesItems);
  }, [contextFacilities]);

  // Merge facilities, ensuring no duplicates
  const allFacilities = [...localFacilities];
  
  // Add facilities from context if they don't already exist
  localContextFacilities.forEach(facility => {
    if (!localFacilities.some(f => f.name === facility.name)) {
      allFacilities.push(facility);
    }
  });

  // Custom handlers for locations that update both systems and local state
  const handleAddLocation = (name: string) => {
    try {
      // Add to the context system first
      addLocation(name);
      // Update local state immediately 
      const newLocation = { id: Date.now().toString(), name };
      setLocalLocations(prev => [...prev, newLocation]);
      toast.success("Location added successfully");
    } catch (error) {
      console.error("Error adding location:", error);
      toast.error("Failed to add location");
    }
  };

  const handleUpdateLocation = (id: string, name: string) => {
    try {
      // Update in the context system
      updateLocation(id, name);
      // Update local state immediately
      setLocalLocations(prev => prev.map(loc => 
        loc.id === id ? { ...loc, name } : loc
      ));
      toast.success("Location updated successfully");
    } catch (error) {
      console.error("Error updating location:", error);
      toast.error("Failed to update location");
    }
  };

  const handleDeleteLocation = (id: string) => {
    try {
      // Delete from the context system
      deleteLocation(id);
      // Update local state immediately
      setLocalLocations(prev => prev.filter(loc => loc.id !== id));
      toast.success("Location deleted successfully");
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Failed to delete location");
    }
  };

  // Custom handlers for facilities that update both systems and local state
  const handleAddFacility = (name: string) => {
    try {
      // Try to add to config system first
      addConfigFacility(name);
      // Also add to context system as backup
      addContextFacility(name);
      
      // Update local state immediately
      const newFacility = { id: Date.now().toString(), name };
      setLocalFacilities(prev => [...prev, newFacility]);
      
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
        // Add to local facilities too
        const newFacility = { id: Date.now().toString(), name };
        setLocalFacilities(prev => [...prev, newFacility]);
      } else {
        // Update in config system
        updateConfigFacility(id, name);
        // Update local state immediately
        setLocalFacilities(prev => prev.map(fac => 
          fac.id === id ? { ...fac, name } : fac
        ));
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
      
      // Delete from config system
      deleteConfigFacility(id);
      // Update local state immediately
      setLocalFacilities(prev => prev.filter(fac => fac.id !== id));
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
                  locations={localLocations}
                  addLocation={handleAddLocation}
                  updateLocation={handleUpdateLocation}
                  deleteLocation={handleDeleteLocation}
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
