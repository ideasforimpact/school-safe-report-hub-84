
import { useState } from 'react';
import { ConfigItem } from '@/contexts/types';

export function useLocationManagement(
  initialLocations: ConfigItem[],
  initialFacilities: ConfigItem[]
) {
  // Locations state
  const [locations, setLocations] = useState<ConfigItem[]>(initialLocations);
  const [facilities, setFacilities] = useState<ConfigItem[]>(initialFacilities);

  // Locations management
  const addLocation = (name: string) => {
    const newLocation = {
      id: Date.now().toString(),
      name
    };
    setLocations(prev => [...prev, newLocation]);
  };

  const updateLocation = (id: string, name: string) => {
    setLocations(prev => prev.map(loc => 
      loc.id === id ? { ...loc, name } : loc
    ));
  };

  const deleteLocation = (id: string) => {
    setLocations(prev => prev.filter(loc => loc.id !== id));
  };

  // Facilities management
  const addFacility = (name: string) => {
    const newFacility = {
      id: Date.now().toString(),
      name
    };
    setFacilities(prev => [...prev, newFacility]);
  };

  const updateFacility = (id: string, name: string) => {
    setFacilities(prev => prev.map(fac => 
      fac.id === id ? { ...fac, name } : fac
    ));
  };

  const deleteFacility = (id: string) => {
    setFacilities(prev => prev.filter(fac => fac.id !== id));
  };

  return {
    locations,
    facilities,
    addLocation,
    updateLocation,
    deleteLocation,
    addFacility,
    updateFacility,
    deleteFacility
  };
}
