import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { generateTicketId, sampleUsers } from '@/utils/incidentUtils';
import { useIncidentActions } from '@/hooks/useIncidentActions';
import { useActionItems } from '@/hooks/useActionItems';
import { useActivities } from '@/hooks/useActivities';
import { Incident, User, Activity, ActionItem } from '@/types/incident';
import { generateSampleIncidents } from '@/utils/sampleIncidentData';
import { subcategories, nearMissSubcategories, unsafeConditionSubcategories } from '@/data/incidentCategories';

// Re-export types and incident category data
export * from '@/types/incidentTypes';
export { subcategories, nearMissSubcategories, unsafeConditionSubcategories } from '@/data/incidentCategories';

// Context interface
interface ConfigItem {
  id: string;
  name: string;
}

interface SubcategoryItem {
  id: string;
  name: string;
}

interface IncidentContextType {
  incidents: Incident[];
  users: User[];
  // Category management
  categories: ConfigItem[];
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  // Subcategory management
  subcategoryMappings: Record<string, SubcategoryItem[]>;
  addSubcategory: (categoryId: string, name: string) => void;
  updateSubcategory: (categoryId: string, id: string, name: string) => void;
  deleteSubcategory: (categoryId: string, id: string) => void;
  // Location management
  locations: ConfigItem[];
  addLocation: (name: string) => void;
  updateLocation: (id: string, name: string) => void;
  deleteLocation: (id: string) => void;
  // Facility management
  facilities: ConfigItem[];
  addFacility: (name: string) => void;
  updateFacility: (id: string, name: string) => void;
  deleteFacility: (id: string) => void;
  // Existing incident operations
  addIncident: (incident: Omit<Incident, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'ticketId'>) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  getIncident: (id: string) => Incident | undefined;
  addActionItem: (incidentId: string, actionItem: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateActionItem: (incidentId: string, actionItemId: string, updates: Partial<ActionItem>) => void;
  deleteActionItem: (incidentId: string, actionItemId: string) => void;
  getRecentActivities: () => Activity[];
  getIncidentActivities: (incidentId: string) => Activity[];
  generateTicketId: () => string;
}

// Initial configuration data
const initialCategories: ConfigItem[] = [
  { id: '1', name: 'Physical Injury' },
  { id: '2', name: 'Bullying' },
  { id: '3', name: 'Tech Misuse' },
  { id: '4', name: 'Property Damage' },
  { id: '5', name: 'Health Concern' },
  { id: '6', name: 'Security Breach' },
  { id: '7', name: 'Other' }
];

const initialSubcategories: Record<string, SubcategoryItem[]> = {
  '1': [ // Physical Injury
    { id: '1-1', name: 'Slipped on wet floor' },
    { id: '1-2', name: 'Playground or sports injury' },
    { id: '1-3', name: 'Injury from furniture or equipment' },
    { id: '1-4', name: 'Science/lab-related accidents' },
    { id: '1-5', name: 'Falls from stairs/benches' },
    { id: '1-6', name: 'Animal/insect bites on campus' },
    { id: '1-7', name: 'Other' }
  ],
  '2': [ // Bullying
    { id: '2-1', name: 'Name-calling, teasing, mocking' },
    { id: '2-2', name: 'Physical fighting or intimidation' },
    { id: '2-3', name: 'Cyberbullying via messages/social media' },
    { id: '2-4', name: 'Spreading rumors or private info' },
    { id: '2-5', name: 'Targeted bullying (caste, appearance, disability)' },
    { id: '2-6', name: 'Other' }
  ],
  '3': [
    { id: '3-1', name: 'Using phone or laptop without permission' },
    { id: '3-2', name: 'Watching inappropriate videos' },
    { id: '3-3', name: 'Taking photos or videos without permission' },
    { id: '3-4', name: 'Cheating using AI tools or online answers' },
    { id: '3-5', name: 'Using VPN to access blocked websites' },
    { id: '3-6', name: 'Sharing or saving obscene or harmful content' },
    { id: '3-7', name: 'Being part of inappropriate online groups' },
    { id: '3-8', name: 'Using school Wi-Fi for wrong purposes' },
    { id: '3-9', name: 'Creating fake accounts of students or staff' },
    { id: '3-10', name: 'Cyberbullying or online harassment' },
    { id: '3-11', name: 'Other' }
  ],
  '4': [
    { id: '4-1', name: 'Vandalism (desks, walls, restrooms)' },
    { id: '4-2', name: 'Damage to lab/sports/classroom equipment' },
    { id: '4-3', name: 'Destruction of library or digital assets' },
    { id: '4-4', name: 'Electrical/plumbing fixture damage' },
    { id: '4-5', name: 'Tampering with CCTV or smart boards' },
    { id: '4-6', name: 'Other' }
  ],
  '5': [
    { id: '5-1', name: 'Fainting, seizures, or sudden illness' },
    { id: '5-2', name: 'Asthma/allergy attacks' },
    { id: '5-3', name: 'Menstrual health emergencies' },
    { id: '5-4', name: 'Accidents causing bleeding/fractures' },
    { id: '5-5', name: 'Food poisoning or dehydration' },
    { id: '5-6', name: 'Suspected communicable disease' },
    { id: '5-7', name: 'Other' }
  ],
  '6': [
    { id: '6-1', name: 'Unauthorized entry of outsiders' },
    { id: '6-2', name: 'Suspicious person or object found' },
    { id: '6-3', name: 'Safety violation' },
    { id: '6-4', name: 'Emergency exits blocked or locked' },
    { id: '6-5', name: 'Other' }
  ],
  '7': [
    { id: '7-1', name: 'Other' }
  ]
};

const initialLocations: ConfigItem[] = [
  { id: '1', name: 'On Campus' },
  { id: '2', name: 'Off Campus' },
  { id: '3', name: 'In Transit' },
  { id: '4', name: 'During Function' }
];

const initialFacilities: ConfigItem[] = [
  { id: '1', name: 'Main Building' },
  { id: '2', name: 'Science Block' },
  { id: '3', name: 'Sports Complex' },
  { id: '4', name: 'Cafeteria' },
  { id: '5', name: 'Library' },
  { id: '6', name: 'Administrative Block' },
  { id: '7', name: 'Playground' },
  { id: '8', name: 'Auditorium' },
  { id: '9', name: 'Computer Lab' },
  { id: '10', name: 'Other' }
];

// Create the context with a default undefined value
const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

export const IncidentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    const savedIncidents = localStorage.getItem('incidents');
    return savedIncidents ? JSON.parse(savedIncidents) : generateSampleIncidents();
  });

  // Activity tracking with enhanced audit information
  const [activities, setActivities] = useState<Activity[]>(() => {
    const savedActivities = localStorage.getItem('activities');
    return savedActivities ? JSON.parse(savedActivities) : [];
  });

  // Configuration state
  const [categories, setCategories] = useState<ConfigItem[]>(() => {
    const saved = localStorage.getItem('categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [subcategoryMappings, setSubcategoryMappings] = useState<Record<string, SubcategoryItem[]>>(() => {
    const saved = localStorage.getItem('subcategories');
    return saved ? JSON.parse(saved) : initialSubcategories;
  });

  const [locations, setLocations] = useState<ConfigItem[]>(() => {
    const saved = localStorage.getItem('locations');
    return saved ? JSON.parse(saved) : initialLocations;
  });

  const [facilities, setFacilities] = useState<ConfigItem[]>(() => {
    const saved = localStorage.getItem('facilities');
    return saved ? JSON.parse(saved) : initialFacilities;
  });

  // Save data to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('incidents', JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem('activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('subcategories', JSON.stringify(subcategoryMappings));
  }, [subcategoryMappings]);

  useEffect(() => {
    localStorage.setItem('locations', JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem('facilities', JSON.stringify(facilities));
  }, [facilities]);

  // Hooks for incident-related operations
  const { addIncident, updateIncident, getIncident, addActivity } = useIncidentActions(
    incidents,
    setIncidents,
    activities,
    setActivities,
    sampleUsers as User[]  // Type assertion to fix the role compatibility issue
  );
  
  // Hooks for action item operations
  const { addActionItem, updateActionItem, deleteActionItem } = useActionItems(
    incidents,
    setIncidents,
    addActivity
  );
  
  // Hooks for activity-related operations
  const { getRecentActivities, getIncidentActivities } = useActivities(incidents, activities);

  // Configuration management functions
  // Categories
  const addCategory = (name: string) => {
    const newCategory = {
      id: Date.now().toString(),
      name
    };
    setCategories(prev => [...prev, newCategory]);
    // Initialize empty subcategory list for this category
    setSubcategoryMappings(prev => ({
      ...prev,
      [newCategory.id]: []
    }));
  };

  const updateCategory = (id: string, name: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, name } : cat
    ));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
    // Remove subcategories for this category
    const { [id]: _, ...rest } = subcategoryMappings;
    setSubcategoryMappings(rest);
  };

  // Subcategories
  const addSubcategory = (categoryId: string, name: string) => {
    const newSubcategory = {
      id: `${categoryId}-${Date.now()}`,
      name
    };
    setSubcategoryMappings(prev => ({
      ...prev,
      [categoryId]: [...(prev[categoryId] || []), newSubcategory]
    }));
  };

  const updateSubcategory = (categoryId: string, id: string, name: string) => {
    setSubcategoryMappings(prev => ({
      ...prev,
      [categoryId]: prev[categoryId].map(subcat =>
        subcat.id === id ? { ...subcat, name } : subcat
      )
    }));
  };

  const deleteSubcategory = (categoryId: string, id: string) => {
    setSubcategoryMappings(prev => ({
      ...prev,
      [categoryId]: prev[categoryId].filter(subcat => subcat.id !== id)
    }));
  };

  // Locations
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

  // Facilities
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

  // Create the context value object
  const contextValue: IncidentContextType = {
    incidents, 
    users: sampleUsers as User[],
    // Configuration
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    subcategoryMappings,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    locations,
    addLocation,
    updateLocation,
    deleteLocation,
    facilities,
    addFacility,
    updateFacility,
    deleteFacility,
    // Incident operations
    addIncident, 
    updateIncident, 
    getIncident,
    addActionItem,
    updateActionItem,
    deleteActionItem,
    getRecentActivities,
    getIncidentActivities,
    generateTicketId
  };

  return (
    <IncidentContext.Provider value={contextValue}>
      {children}
    </IncidentContext.Provider>
  );
};

// Hook to use the incident context
export const useIncidents = () => {
  const context = useContext(IncidentContext);
  if (context === undefined) {
    throw new Error('useIncidents must be used within an IncidentProvider');
  }
  return context;
};
