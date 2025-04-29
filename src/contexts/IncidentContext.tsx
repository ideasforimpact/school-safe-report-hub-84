
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

// Adding subcategories mapping
export const subcategories: Record<IncidentCategory, string[]> = {
  'Physical Injury': [
    'Slipped on wet floor',
    'Playground or sports injury',
    'Injury from furniture or equipment',
    'Science/lab-related accidents',
    'Falls from stairs/benches',
    'Animal/insect bites on campus',
    'Other'
  ],
  'Bullying': [
    'Name-calling, teasing, mocking',
    'Physical fighting or intimidation',
    'Cyberbullying via messages/social media',
    'Spreading rumors or private info',
    'Targeted bullying (caste, appearance, disability)',
    'Other'
  ],
  'Tech Misuse': [
    'Using phone or laptop without permission',
    'Watching inappropriate videos',
    'Taking photos or videos without permission',
    'Cheating using AI tools or online answers',
    'Using VPN to access blocked websites',
    'Sharing or saving obscene or harmful content',
    'Being part of inappropriate online groups',
    'Using school Wi-Fi for wrong purposes',
    'Creating fake accounts of students or staff',
    'Cyberbullying or online harassment',
    'Other'
  ],
  'Property Damage': [
    'Vandalism (desks, walls, restrooms)',
    'Damage to lab/sports/classroom equipment',
    'Destruction of library or digital assets',
    'Electrical/plumbing fixture damage',
    'Tampering with CCTV or smart boards',
    'Other'
  ],
  'Health Concern': [
    'Fainting, seizures, or sudden illness',
    'Asthma/allergy attacks',
    'Menstrual health emergencies',
    'Accidents causing bleeding/fractures',
    'Food poisoning or dehydration',
    'Suspected communicable disease',
    'Other'
  ],
  'Security Breach': [
    'Unauthorized entry of outsiders',
    'Suspicious person or object found',
    'Safety violation',
    'Emergency exits blocked or locked',
    'Other'
  ],
  'Other': ['Other']
};

// Near Miss subcategories
export const nearMissSubcategories: Record<string, string[]> = {
  'Fall or Physical Injury Risk': [
    'Wet or slippery floors',
    'Uneven flooring or broken stairs',
    'Playground equipment failure',
    'Rough play almost causing injury',
    'Sports equipment narrowly missing someone',
    'Other'
  ],
  'Electrical / Fire / Infrastructure Risk': [
    'Exposed wires or sparks',
    'Electrical socket misuse or overloading',
    'Fire alarm not working during drill',
    'Combustible items near heat sources',
    'Ceiling fan wobbling, window glass nearly breaking',
    'Door/gate slamming due to wind',
    'Other'
  ],
  'Transport & Movement Risk': [
    'Student almost fell while boarding/exiting school bus',
    'Vehicle reversing without seeing nearby student',
    'Running in corridors/stairs almost causing a fall',
    'Other'
  ],
  'Behavioral / Technology Misuse': [
    'Object thrown narrowly missing someone',
    'Student using mobile in sensitive areas',
    'Device overheating or misused',
    'Near misuse of AI tools or unsafe browsing',
    'Other'
  ],
  'External / Unauthorized Access Risk': [
    'Student seen near construction or restricted zone',
    'Unidentified person near campus entry/exit',
    'Gate or restricted door left open accidentally',
    'Other'
  ]
};

// Unsafe Condition subcategories
export const unsafeConditionSubcategories: Record<string, string[]> = {
  'Building & Infrastructure Hazards': [
    'Broken tiles, loose railings, or damaged stairs',
    'Cracked windowpanes or unstable fixtures',
    'Incomplete construction zones left open',
    'Poor lighting in corridors or staircases',
    'Other'
  ],
  'Electrical / Fire Safety Concerns': [
    'Exposed wiring or open electrical boxes',
    'Overloaded power sockets or plug points',
    'Fire extinguishers missing or not working',
    'Blocked emergency exits or fire routes',
    'Other'
  ],
  'Playground / Sports Area Issues': [
    'Damaged swings, slides, or seesaw',
    'Loose bolts or unstable equipment',
    'Sharp edges or rusted metal in play areas',
    'Uneven playing surface or unsafe sports gear',
    'Other'
  ],
  'Transport & Vehicular Risks': [
    'Buses without proper railing or handhold',
    'Broken steps or sharp edges in transport vehicles',
    'Lack of supervision during pick-up/drop-off',
    'No speed breakers or warning signs in school driveway',
    'Other'
  ],
  'Hygiene & Health-Related Hazards': [
    'Dirty or slippery restrooms',
    'Stagnant water near drinking areas',
    'Uncovered dustbins attracting pests',
    'Spoiled food or unsafe canteen storage',
    'Other'
  ],
  'Technology & Surveillance Gaps': [
    'Non-functioning CCTV cameras',
    'Wi-Fi access in unauthorized zones',
    'Poor digital access control for sensitive areas',
    'Other'
  ],
  'Weather / Natural Hazards': [
    'Water leakage during rain',
    'Open drains or unmarked wet areas',
    'Trees with broken branches near pathways',
    'Other'
  ]
};

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
  image?: string; // Adding optional image URL for actions
}

export interface ActionItem {
  id: string;
  description: string;
  dueDate: Date;
  assignedTo: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  createdBy: {
    id: string;
    name: string;
  };
  image?: string; // Adding optional image URL for action items
  createdAt: Date;
  updatedAt: Date;
}

export interface Incident {
  id: string;
  type: IncidentType;
  category: IncidentCategory;
  subcategory: string;
  description: string;
  date: Date;
  location: IncidentLocation;
  peopleInvolved: Person[];
  status: IncidentStatus;
  reportedBy: {
    id: string;
    name: string;
  };
  image?: string; // Adding optional image URL for incidents
  actions?: Action[];
  actionItems?: ActionItem[];
  createdAt: Date;
  updatedAt: Date;
}

interface IncidentContextType {
  incidents: Incident[];
  addIncident: (incident: Omit<Incident, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  getIncident: (id: string) => Incident | undefined;
  addActionItem: (incidentId: string, actionItem: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateActionItem: (incidentId: string, actionItemId: string, updates: Partial<ActionItem>) => void;
  deleteActionItem: (incidentId: string, actionItemId: string) => void;
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
      subcategory: 'Playground or sports injury',
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
      actionItems: [
        {
          id: '1',
          description: 'Update playground safety guidelines',
          dueDate: pastDays(-5), // 5 days in the future
          assignedTo: 'Safety Coordinator',
          status: 'In Progress',
          createdBy: { id: '1', name: 'Admin User' },
          createdAt: pastDays(2),
          updatedAt: pastDays(2)
        }
      ],
      createdAt: pastDays(2),
      updatedAt: pastDays(1)
    },
    {
      id: '2',
      type: 'Near Miss',
      category: 'Property Damage',
      subcategory: 'Damage to lab/sports/classroom equipment',
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
      subcategory: 'Suspected communicable disease',
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
      subcategory: 'Name-calling, teasing, mocking',
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
      subcategory: 'Using phone or laptop without permission',
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

  const addActionItem = (incidentId: string, actionItemData: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const newActionItem: ActionItem = {
      ...actionItemData,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now
    };
    
    setIncidents(prev => 
      prev.map(incident => 
        incident.id === incidentId 
          ? { 
              ...incident, 
              actionItems: [...(incident.actionItems || []), newActionItem],
              updatedAt: now 
            } 
          : incident
      )
    );
    toast.success("Action item added");
  };

  const updateActionItem = (incidentId: string, actionItemId: string, updates: Partial<ActionItem>) => {
    setIncidents(prev => 
      prev.map(incident => {
        if (incident.id !== incidentId) return incident;
        
        const updatedActionItems = incident.actionItems?.map(item => 
          item.id === actionItemId 
            ? { ...item, ...updates, updatedAt: new Date() } 
            : item
        ) || [];
        
        return { 
          ...incident, 
          actionItems: updatedActionItems,
          updatedAt: new Date()
        };
      })
    );
    toast.success("Action item updated");
  };

  const deleteActionItem = (incidentId: string, actionItemId: string) => {
    setIncidents(prev => 
      prev.map(incident => {
        if (incident.id !== incidentId) return incident;
        
        const filteredActionItems = incident.actionItems?.filter(item => 
          item.id !== actionItemId
        ) || [];
        
        return { 
          ...incident, 
          actionItems: filteredActionItems,
          updatedAt: new Date()
        };
      })
    );
    toast.success("Action item deleted");
  };

  return (
    <IncidentContext.Provider value={{ 
      incidents, 
      addIncident, 
      updateIncident, 
      getIncident,
      addActionItem,
      updateActionItem,
      deleteActionItem
    }}>
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
