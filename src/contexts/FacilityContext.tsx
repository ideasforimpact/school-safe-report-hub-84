
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { toast } from "@/components/ui/sonner";
import { SchoolFacility } from '@/contexts/IncidentContext';

interface FacilityContextType {
  facilities: string[];
  addFacility: (facility: string) => void;
  resetFacilities: () => void;
}

// Initial facilities from the IncidentContext SchoolFacility type
const INITIAL_FACILITIES: string[] = [
  // School Branches
  'North Campus',
  'South Campus',
  'East Wing',
  'West Wing',
  'Downtown Branch',
  'Suburban Campus',
  'International Branch',
  'Primary School Wing',
  'Secondary School Wing',
  'Higher Secondary Wing',
  'Other'
];

const FacilityContext = createContext<FacilityContextType | undefined>(undefined);

export const FacilityProvider = ({ children }: { children: ReactNode }) => {
  const [facilities, setFacilities] = useState<string[]>(() => {
    try {
      const savedFacilities = localStorage.getItem('facilities');
      // Ensure we only use valid string arrays from localStorage
      if (savedFacilities) {
        const parsed = JSON.parse(savedFacilities);
        if (Array.isArray(parsed)) {
          // Filter out non-string values
          return parsed.filter(item => typeof item === 'string');
        }
      }
      return INITIAL_FACILITIES;
    } catch (error) {
      console.error('Error loading facilities from localStorage:', error);
      return INITIAL_FACILITIES;
    }
  });

  // Save facilities to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('facilities', JSON.stringify(facilities));
  }, [facilities]);

  const addFacility = (facility: string) => {
    if (facility && typeof facility === 'string' && facility.trim() !== '') {
      // Only add if not already exists
      if (!facilities.includes(facility.trim())) {
        setFacilities(prev => [...prev, facility.trim()]);
        toast.success("Facility added successfully");
      }
    } else {
      toast.error("Invalid facility name");
    }
  };

  const resetFacilities = () => {
    setFacilities(INITIAL_FACILITIES);
    localStorage.setItem('facilities', JSON.stringify(INITIAL_FACILITIES));
    toast.success("Facilities reset successfully");
  };

  return (
    <FacilityContext.Provider value={{ 
      facilities, 
      addFacility,
      resetFacilities
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
