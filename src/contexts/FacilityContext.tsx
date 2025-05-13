
import React, { createContext, useContext, ReactNode, useState } from 'react';

// Define the facility type
export interface Facility {
  id: string;
  name: string;
  address?: string;
  type?: string;
  capacity?: number;
  isActive?: boolean;
}

// Define context type
interface FacilityContextType {
  facilities: Facility[];
  addFacility: (facility: Omit<Facility, 'id'>) => void;
  updateFacility: (id: string, facility: Partial<Facility>) => void;
  deleteFacility: (id: string) => void;
  getFacilityById: (id: string) => Facility | undefined;
}

// Create the context with default values
const FacilityContext = createContext<FacilityContextType | undefined>(undefined);

// Sample initial facilities
const initialFacilities: Facility[] = [
  { id: '1', name: 'Main Building', address: '123 Education St', type: 'Academic', capacity: 500, isActive: true },
  { id: '2', name: 'Science Lab', address: '123 Education St', type: 'Laboratory', capacity: 100, isActive: true },
  { id: '3', name: 'Sports Complex', address: '456 Athletic Ave', type: 'Sports', capacity: 1000, isActive: true },
  { id: '4', name: 'Library', address: '123 Education St', type: 'Academic', capacity: 200, isActive: true },
];

// Provider component
export const FacilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [facilities, setFacilities] = useState<Facility[]>(initialFacilities);

  const addFacility = (facilityData: Omit<Facility, 'id'>) => {
    const newFacility: Facility = {
      id: Date.now().toString(),
      ...facilityData,
    };
    setFacilities([...facilities, newFacility]);
  };

  const updateFacility = (id: string, facilityData: Partial<Facility>) => {
    setFacilities(
      facilities.map((facility) =>
        facility.id === id ? { ...facility, ...facilityData } : facility
      )
    );
  };

  const deleteFacility = (id: string) => {
    setFacilities(facilities.filter((facility) => facility.id !== id));
  };

  const getFacilityById = (id: string) => {
    return facilities.find((facility) => facility.id === id);
  };

  return (
    <FacilityContext.Provider
      value={{
        facilities,
        addFacility,
        updateFacility,
        deleteFacility,
        getFacilityById,
      }}
    >
      {children}
    </FacilityContext.Provider>
  );
};

// Custom hook to use facility context
export const useFacilities = () => {
  const context = useContext(FacilityContext);
  if (!context) {
    throw new Error('useFacilities must be used within a FacilityProvider');
  }
  return context;
};
