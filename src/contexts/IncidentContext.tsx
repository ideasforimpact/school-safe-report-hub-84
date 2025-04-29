
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { toast } from "@/components/ui/sonner";
import { useFacilities } from './FacilityContext';

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

// School Facilities - Now dynamically loaded from FacilityContext
export type SchoolFacility = string;

export interface Person {
  name: string;
  role: 'Student' | 'Staff' | 'Other';
  notes?: string;
  id?: string; // Added optional id property to Person interface
}

export interface UserRef {
  id: string;
  name: string;
}

export interface Action {
  description: string;
  responsiblePerson: string;
  date: Date;
  image?: string;
  video?: string;
  document?: string;
}

export interface ActionItem {
  id: string;
  description: string;
  dueDate: Date;
  assignedTo: UserRef;
  status: 'Pending' | 'In Progress' | 'Completed';
  createdBy: UserRef;
  image?: string;
  video?: string;
  document?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Incident {
  id: string;
  type: IncidentType;
  category: IncidentCategory;
  subcategory: string;
  description: string;
  rootCause?: string;
  date: Date;
  location: IncidentLocation;
  peopleInvolved: Person[];
  status: IncidentStatus;
  reportedBy: UserRef;
  owner?: UserRef;
  facility?: SchoolFacility;
  image?: string;
  video?: string;
  document?: string;
  actions?: Action[];
  actionItems?: ActionItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Create a user type for dropdown selection
export interface User {
  id: string;
  name: string;
  role: 'Admin' | 'Teacher' | 'Staff' | 'Safety Officer';
}

interface IncidentContextType {
  incidents: Incident[];
  users: User[];
  addIncident: (incident: Omit<Incident, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  getIncident: (id: string) => Incident | undefined;
  addActionItem: (incidentId: string, actionItem: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateActionItem: (incidentId: string, actionItemId: string, updates: Partial<ActionItem>) => void;
  deleteActionItem: (incidentId: string, actionItemId: string) => void;
  getRecentActivities: () => Activity[];
  getIncidentActivities: (incidentId: string) => Activity[];
}

// Sample users for the demo
const sampleUsers: User[] = [
  { id: '1', name: 'Admin User', role: 'Admin' },
  { id: '2', name: 'Teacher Reporter', role: 'Teacher' },
  { id: '3', name: 'Safety Officer', role: 'Safety Officer' },
  { id: '4', name: 'Maintenance Staff', role: 'Staff' },
];

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
      rootCause: 'Uneven playground surface and lack of proper supervision',
      date: pastDays(2),
      location: 'On Campus',
      peopleInvolved: [
        { name: 'John Doe', role: 'Student', notes: 'Grade 5' }
      ],
      status: 'Closed',
      reportedBy: { id: '2', name: 'Teacher Reporter' },
      owner: { id: '3', name: 'Safety Officer' },
      facility: 'Playground',
      actions: [
        { description: 'First aid administered, parent notified', responsiblePerson: 'Nurse Smith', date: pastDays(2) }
      ],
      actionItems: [
        {
          id: '1',
          description: 'Update playground safety guidelines',
          dueDate: pastDays(-5), // 5 days in the future
          assignedTo: { id: '3', name: 'Safety Officer' },
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
      rootCause: 'Water damage from previous roof leak weakened the ceiling structure',
      date: pastDays(5),
      location: 'On Campus',
      peopleInvolved: [],
      status: 'In Progress',
      reportedBy: { id: '2', name: 'Teacher Reporter' },
      owner: { id: '4', name: 'Maintenance Staff' },
      facility: 'Main Building',
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

// Activity history with enhanced audit information
export interface Activity {
  type: 'incident' | 'action' | 'status' | 'actionItem';
  activity: 'create' | 'update' | 'delete' | 'close' | 'reopen';
  entityId: string;
  entityTitle: string;
  user: string;
  userId: string;
  date: Date;
  details?: string;
}

export const IncidentProvider = ({ children }: { children: ReactNode }) => {
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    const savedIncidents = localStorage.getItem('incidents');
    return savedIncidents ? JSON.parse(savedIncidents) : generateSampleIncidents();
  });

  // Activity tracking with enhanced audit information
  const [activities, setActivities] = useState<Activity[]>(() => {
    const savedActivities = localStorage.getItem('activities');
    return savedActivities ? JSON.parse(savedActivities) : [];
  });

  // Save data to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('incidents', JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem('activities', JSON.stringify(activities));
  }, [activities]);

  // Add a new activity to the log with enhanced audit information
  const addActivity = (activity: Activity) => {
    setActivities(prev => [activity, ...prev]);
  };

  const addIncident = (incidentData: Omit<Incident, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const newIncident: Incident = {
      ...incidentData,
      id: Date.now().toString(),
      status: 'Open', // The status is set here internally
      createdAt: now,
      updatedAt: now
    };
    
    setIncidents(prev => [newIncident, ...prev]);
    addActivity({
      type: 'incident',
      activity: 'create',
      entityId: newIncident.id,
      entityTitle: `${newIncident.type}: ${newIncident.category} - ${newIncident.subcategory}`,
      user: newIncident.reportedBy.name,
      userId: newIncident.reportedBy.id,
      date: now,
      details: `Incident reported by ${newIncident.reportedBy.name}`
    });
    toast.success("Incident reported successfully");
  };

  const updateIncident = (id: string, updates: Partial<Incident>) => {
    const now = new Date();
    const currentIncident = incidents.find(inc => inc.id === id);
    
    // Skip if no changes or incident not found
    if (!currentIncident) return;
    
    setIncidents(prev => 
      prev.map(incident => 
        incident.id === id 
          ? { ...incident, ...updates, updatedAt: now } 
          : incident
      )
    );
    
    // Log status change specifically
    if (updates.status && updates.status !== currentIncident.status) {
      const user = updates.reportedBy?.name || currentIncident.reportedBy.name;
      const userId = updates.reportedBy?.id || currentIncident.reportedBy.id;
      
      addActivity({
        type: 'status',
        activity: updates.status === 'Closed' ? 'close' : 'update',
        entityId: id,
        entityTitle: `${currentIncident.type}: ${currentIncident.category} - ${currentIncident.subcategory}`,
        user,
        userId,
        date: now,
        details: `Status changed from ${currentIncident.status} to ${updates.status} by ${user}`
      });
    } 
    // Log owner assignment
    else if (updates.owner && (!currentIncident.owner || updates.owner.id !== currentIncident.owner.id)) {
      const user = updates.reportedBy?.name || currentIncident.reportedBy.name;
      const userId = updates.reportedBy?.id || currentIncident.reportedBy.id;
      
      addActivity({
        type: 'incident',
        activity: 'update',
        entityId: id,
        entityTitle: `${currentIncident.type}: ${currentIncident.category} - ${currentIncident.subcategory}`,
        user,
        userId,
        date: now,
        details: `Incident assigned to ${updates.owner.name} by ${user}`
      });
    }
    // Log other updates
    else if (Object.keys(updates).length > 0) {
      const user = updates.reportedBy?.name || currentIncident.reportedBy.name;
      const userId = updates.reportedBy?.id || currentIncident.reportedBy.id;
      
      addActivity({
        type: 'incident',
        activity: 'update',
        entityId: id,
        entityTitle: `${currentIncident.type}: ${currentIncident.category} - ${currentIncident.subcategory}`,
        user,
        userId,
        date: now,
        details: `Incident details updated by ${user}`
      });
    }
    
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
    
    // Add to activity log with enhanced audit information
    const incident = incidents.find(inc => inc.id === incidentId);
    if (incident) {
      addActivity({
        type: 'actionItem',
        activity: 'create',
        entityId: newActionItem.id,
        entityTitle: `Action: ${newActionItem.description.substring(0, 30)}${newActionItem.description.length > 30 ? '...' : ''}`,
        user: newActionItem.createdBy.name,
        userId: newActionItem.createdBy.id,
        date: now,
        details: `Action item created by ${newActionItem.createdBy.name} and assigned to ${newActionItem.assignedTo.name}`
      });
    }
    
    toast.success("Action item added");
  };

  const updateActionItem = (incidentId: string, actionItemId: string, updates: Partial<ActionItem>) => {
    const now = new Date();
    const incident = incidents.find(inc => inc.id === incidentId);
    const currentActionItem = incident?.actionItems?.find(item => item.id === actionItemId);
    
    if (!incident || !currentActionItem) return;
    
    setIncidents(prev => 
      prev.map(incident => {
        if (incident.id !== incidentId) return incident;
        
        const updatedActionItems = incident.actionItems?.map(item => 
          item.id === actionItemId 
            ? { ...item, ...updates, updatedAt: now } 
            : item
        ) || [];
        
        return { 
          ...incident, 
          actionItems: updatedActionItems,
          updatedAt: now
        };
      })
    );
    
    // Log status change specifically
    if (updates.status && updates.status !== currentActionItem.status) {
      const user = updates.createdBy?.name || currentActionItem.createdBy.name;
      const userId = updates.createdBy?.id || currentActionItem.createdBy.id;
      
      addActivity({
        type: 'actionItem',
        activity: 'update',
        entityId: actionItemId,
        entityTitle: `Action: ${currentActionItem.description.substring(0, 30)}${currentActionItem.description.length > 30 ? '...' : ''}`,
        user,
        userId,
        date: now,
        details: `Action item status changed from ${currentActionItem.status} to ${updates.status} by ${user}`
      });
    } 
    // Log assignee change
    else if (updates.assignedTo && updates.assignedTo.id !== currentActionItem.assignedTo.id) {
      const user = updates.createdBy?.name || currentActionItem.createdBy.name;
      const userId = updates.createdBy?.id || currentActionItem.createdBy.id;
      
      addActivity({
        type: 'actionItem',
        activity: 'update',
        entityId: actionItemId,
        entityTitle: `Action: ${currentActionItem.description.substring(0, 30)}${currentActionItem.description.length > 30 ? '...' : ''}`,
        user,
        userId,
        date: now,
        details: `Action item reassigned from ${currentActionItem.assignedTo.name} to ${updates.assignedTo.name} by ${user}`
      });
    }
    // Log other updates
    else if (Object.keys(updates).length > 0) {
      const user = updates.createdBy?.name || currentActionItem.createdBy.name;
      const userId = updates.createdBy?.id || currentActionItem.createdBy.id;
      
      addActivity({
        type: 'actionItem',
        activity: 'update',
        entityId: actionItemId,
        entityTitle: `Action: ${currentActionItem.description.substring(0, 30)}${currentActionItem.description.length > 30 ? '...' : ''}`,
        user,
        userId,
        date: now,
        details: `Action item updated by ${user}`
      });
    }
    
    toast.success("Action item updated");
  };

  const deleteActionItem = (incidentId: string, actionItemId: string) => {
    const incident = incidents.find(inc => inc.id === incidentId);
    const actionItem = incident?.actionItems?.find(item => item.id === actionItemId);
    
    if (!incident || !actionItem) return;
    
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
    
    addActivity({
      type: 'actionItem',
      activity: 'delete',
      entityId: actionItemId,
      entityTitle: `Action: ${actionItem.description.substring(0, 30)}${actionItem.description.length > 30 ? '...' : ''}`,
      user: actionItem.createdBy.name,
      userId: actionItem.createdBy.id,
      date: new Date(),
      details: `Action item deleted by ${actionItem.createdBy.name}`
    });
    
    toast.success("Action item deleted");
  };

  // Get recent activities
  const getRecentActivities = () => {
    return activities;
  };
  
  // Get activities for a specific incident
  const getIncidentActivities = (incidentId: string) => {
    return activities.filter(activity => 
      activity.entityId === incidentId || 
      // Also include related action items
      incidents.find(inc => 
        inc.id === incidentId && 
        inc.actionItems?.some(item => item.id === activity.entityId)
      )
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  return (
    <IncidentContext.Provider value={{ 
      incidents, 
      users: sampleUsers,
      addIncident, 
      updateIncident, 
      getIncident,
      addActionItem,
      updateActionItem,
      deleteActionItem,
      getRecentActivities,
      getIncidentActivities
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
