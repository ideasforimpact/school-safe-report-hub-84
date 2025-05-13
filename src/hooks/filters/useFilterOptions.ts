import { useState, useEffect } from 'react';
import { useIncidents } from '@/contexts/incident';
import { useLocation } from 'react-router-dom';

export const useFilterOptions = () => {
  // Get context values
  const { 
    // Ensure these are properly imported from the IncidentContext
    // or set as empty arrays if they don't exist
    campuses = [], 
    classes = [],
    sections = [],
    categories = [], 
    locations = [],
    facilities = [],
    designations = []
  } = useIncidents();

  // State for various filter options
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [facilityOptions, setFacilityOptions] = useState<string[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [priorityOptions, setPriorityOptions] = useState<string[]>([]);
  const [assigneeOptions, setAssigneeOptions] = useState<string[]>([]);
  const [reporterOptions, setReporterOptions] = useState<string[]>([]);

  const location = useLocation();
  const isInsightsPage = location.pathname.includes('insights');

  useEffect(() => {
    // Set category options
    if (Array.isArray(categories)) {
      const catOptions = categories.map(cat => cat.name);
      setCategoryOptions(catOptions);
    } else {
      setCategoryOptions([]);
    }

    // Set location options
    if (Array.isArray(locations)) {
      const locOptions = locations.map(loc => loc.name);
      setLocationOptions(locOptions);
    } else {
      setLocationOptions([]);
    }
    
    // Set facility options
    if (Array.isArray(facilities)) {
      const facOptions = facilities.map(fac => fac.name);
      setFacilityOptions(facOptions);
    } else {
      setFacilityOptions([]);
    }

    // Static options for status and priority
    setStatusOptions(['Open', 'In Progress', 'Closed', 'Voided']);
    setPriorityOptions(['Low', 'Medium', 'High', 'Critical']);
    
    // Mock options for assignees and reporters (replace with actual data when available)
    setAssigneeOptions(['John Smith', 'Jane Doe', 'Bob Johnson']);
    setReporterOptions(['Sarah Wilson', 'Mike Thomas', 'Emma Brown']);

  }, [categories, locations, facilities]);

  return {
    categoryOptions,
    locationOptions,
    facilityOptions,
    statusOptions,
    priorityOptions,
    assigneeOptions,
    reporterOptions,
    isInsightsPage,
    // Add educational structure options
    campuses: Array.isArray(campuses) ? campuses : [],
    classes: Array.isArray(classes) ? classes : [],
    sections: Array.isArray(sections) ? sections : [],
    designations: Array.isArray(designations) ? designations : [],
  };
};
