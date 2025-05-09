
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Campus {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
  campusId: string;
}

interface Section {
  id: string;
  name: string;
  classId: string;
}

interface IncidentContextType {
  campuses: Campus[];
  classes: Class[];
  sections: Section[];
}

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

export const IncidentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initial mock data for campuses, classes and sections
  const [campuses] = useState<Campus[]>([
    { id: 'c1', name: 'Main Campus' },
    { id: 'c2', name: 'North Campus' },
    { id: 'c3', name: 'South Campus' },
  ]);

  const [classes] = useState<Class[]>([
    { id: 'cl1', name: 'Grade 1', campusId: 'c1' },
    { id: 'cl2', name: 'Grade 2', campusId: 'c1' },
    { id: 'cl3', name: 'Grade 3', campusId: 'c1' },
    { id: 'cl4', name: 'Grade 4', campusId: 'c1' },
    { id: 'cl5', name: 'Grade 5', campusId: 'c1' },
    { id: 'cl6', name: 'Grade 1', campusId: 'c2' },
    { id: 'cl7', name: 'Grade 2', campusId: 'c2' },
    { id: 'cl8', name: 'Grade 1', campusId: 'c3' },
  ]);

  const [sections] = useState<Section[]>([
    { id: 's1', name: 'Section A', classId: 'cl1' },
    { id: 's2', name: 'Section B', classId: 'cl1' },
    { id: 's3', name: 'Section A', classId: 'cl2' },
    { id: 's4', name: 'Section B', classId: 'cl2' },
    { id: 's5', name: 'Section A', classId: 'cl3' },
    { id: 's6', name: 'Section A', classId: 'cl4' },
    { id: 's7', name: 'Section A', classId: 'cl5' },
    { id: 's8', name: 'Section A', classId: 'cl6' },
    { id: 's9', name: 'Section B', classId: 'cl6' },
    { id: 's10', name: 'Section A', classId: 'cl7' },
    { id: 's11', name: 'Section A', classId: 'cl8' },
  ]);

  return (
    <IncidentContext.Provider value={{ campuses, classes, sections }}>
      {children}
    </IncidentContext.Provider>
  );
};

export const useIncidents = () => {
  const context = useContext(IncidentContext);
  if (context === undefined) {
    throw new Error('useIncidents must be used within an IncidentProvider');
  }
  return context;
};
