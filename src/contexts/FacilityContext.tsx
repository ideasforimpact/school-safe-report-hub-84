
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { toast } from "@/components/ui/sonner";
import { SchoolFacility } from '@/contexts/IncidentContext';

interface FacilityContextType {
  facilities: string[];
  addFacility: (facility: string) => void;
}

// Initial facilities from the IncidentContext SchoolFacility type
const INITIAL_FACILITIES = [
  'Main Building', 
  'Science Block', 
  'Sports Complex', 
  'Cafeteria', 
  'Library', 
  'Administrative Block', 
  'Playground', 
  'Auditorium', 
  'Computer Lab', 
  'Other'
];

const FacilityContext = createContext<FacilityContextType | undefined>(undefined);

export const FacilityProvider = ({ children }: { children: ReactNode }) => {
  const [facilities, setFacilities] = useState<string[]>(() => {
    const savedFacilities = localStorage.getItem('facilities');
    return savedFacilities ? JSON.parse(savedFacilities) : INITIAL_FACILITIES;
  });

  // Save facilities to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('facilities', JSON.stringify(facilities));
  }, [facilities]);

  const addFacility = (facility: string) => {
    setFacilities(prev => [...prev, facility]);
  };

  return (
    <FacilityContext.Provider value={{ 
      facilities, 
      addFacility
    }}>
      {children}
    </FacilityContext.Provider>
  );
};

export const useFacilities = () => {
  const context = useContext(FacilityContext);
  if (context === undefined) {
    throw new Error('useFacilities must be used within a FacilityProvider');
  }
  return context;
};
