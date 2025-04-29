
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { toast } from "@/components/ui/sonner";

export type IncidentType = 'Incident' | 'Near Miss' | 'Unsafe Condition';
export type IncidentCategory = 
  'Physical Injury' | 
  'Bullying' | 
  'Tech Misuse' | 
  'Property Damage' | 
  'Health Concern' |
  'Security Breach' |
  'Other';
export type IncidentLocation = 'On Campus' | 'Off Campus' | 'In Transit' | 'During Function';
export type IncidentStatus = 'Open' | 'In Progress' | 'Closed';

export interface Person {
  name: string;
  role: 'Student' | 'Staff' | 'Other';
  notes?: string;
}

export interface Action {
  description: string;
  responsiblePerson: string;
  date: Date;
}

export interface Incident {
  id: string;
  type: IncidentType;
  category: IncidentCategory;
  description: string;
  date: Date;
  location: IncidentLocation;
  peopleInvolved: Person[];
  status: IncidentStatus;
  reportedBy: {
    id: string;
    name: string;
  };
  actions?: Action[];
  createdAt: Date;
  updatedAt: Date;
}

interface IncidentContextType {
  incidents: Incident[];
  addIncident: (incident: Omit<Incident, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  getIncident: (id: string) => Incident | undefined;
}

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

// Sample data for demo purposes
const generateSampleIncidents = (): Incident[] => {
  const pastDays = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return [
    {
      id: '1',
      type: 'Incident',
      category: 'Physical Injury',
      description: 'Student fell during recess and scraped knee',
      date: pastDays(2),
      location: 'On Campus',
      peopleInvolved: [
        { name: 'John Doe', role: 'Student', notes: 'Grade 5' }
      ],
      status: 'Closed',
      reportedBy: { id: '2', name: 'Teacher Reporter' },
      actions: [
        { description: 'First aid administered, parent notified', responsiblePerson: 'Nurse Smith', date: pastDays(2) }
      ],
      createdAt: pastDays(2),
      updatedAt: pastDays(1)
    },
    {
      id: '2',
      type: 'Near Miss',
      category: 'Property Damage',
      description: 'Ceiling tile nearly fell in hallway',
      date: pastDays(5),
      location: 'On Campus',
      peopleInvolved: [],
      status: 'In Progress',
      reportedBy: { id: '2', name: 'Teacher Reporter' },
      actions: [
        { description: 'Maintenance notified, area cordoned off', responsiblePerson: 'Janitor Brown', date: pastDays(5) }
      ],
      createdAt: pastDays(5),
      updatedAt: pastDays(4)
    },
    {
      id: '3',
      type: 'Unsafe Condition',
      category: 'Health Concern',
      description: 'Mold spotted in corner of gymnasium',
      date: pastDays(10),
      location: 'On Campus',
      peopleInvolved: [],
      status: 'Open',
      reportedBy: { id: '1', name: 'Admin User' },
      createdAt: pastDays(10),
      updatedAt: pastDays(10)
    },
    {
      id: '4',
      type: 'Incident',
      category: 'Bullying',
      description: 'Verbal altercation between students',
      date: pastDays(1),
      location: 'On Campus',
      peopleInvolved: [
        { name: 'Student A', role: 'Student' },
        { name: 'Student B', role: 'Student' }
      ],
      status: 'Open',
      reportedBy: { id: '2', name: 'Teacher Reporter' },
      createdAt: pastDays(1),
      updatedAt: pastDays(1)
    },
    {
      id: '5',
      type: 'Incident',
      category: 'Tech Misuse',
      description: 'Student accessing inappropriate content on school device',
      date: pastDays(3),
      location: 'On Campus',
      peopleInvolved: [
        { name: 'Student C', role: 'Student' }
      ],
      status: 'In Progress',
      reportedBy: { id: '1', name: 'Admin User' },
      actions: [
        { description: 'Device confiscated, parent meeting scheduled', responsiblePerson: 'IT Admin', date: pastDays(3) }
      ],
      createdAt: pastDays(3),
      updatedAt: pastDays(2)
    }
  ];
};

export const IncidentProvider = ({ children }: { children: ReactNode }) => {
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    const savedIncidents = localStorage.getItem('incidents');
    return savedIncidents ? JSON.parse(savedIncidents) : generateSampleIncidents();
  });

  // Save incidents to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('incidents', JSON.stringify(incidents));
  }, [incidents]);

  const addIncident = (incidentData: Omit<Incident, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const newIncident: Incident = {
      ...incidentData,
      id: Date.now().toString(),
      status: 'Open',
      createdAt: now,
      updatedAt: now
    };
    
    setIncidents(prev => [newIncident, ...prev]);
    toast.success("Incident reported successfully");
  };

  const updateIncident = (id: string, updates: Partial<Incident>) => {
    setIncidents(prev => 
      prev.map(incident => 
        incident.id === id 
          ? { ...incident, ...updates, updatedAt: new Date() } 
          : incident
      )
    );
    toast.success("Incident updated");
  };

  const getIncident = (id: string) => {
    return incidents.find(incident => incident.id === id);
  };

  return (
    <IncidentContext.Provider value={{ incidents, addIncident, updateIncident, getIncident }}>
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
