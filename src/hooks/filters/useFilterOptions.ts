
import { useState, useEffect } from 'react';
import { useIncidents } from '@/contexts/incident/IncidentContext';
import { useLocation } from 'react-router-dom';

// Hook to get filter options for incidents
export const useFilterOptions = () => {
  const { incidents, categories, locations, facilities, designations, campuses, classes, sections } = useIncidents();
  const location = useLocation();
  const isInsightsPage = location.pathname.includes('/insights');

  // Initialize options arrays
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [facilityOptions, setFacilityOptions] = useState<string[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>(['Open', 'In Progress', 'Closed']);
  const [priorityOptions, setPriorityOptions] = useState<string[]>(['Low', 'Medium', 'High', 'Critical']);
  const [assigneeOptions, setAssigneeOptions] = useState<{id: string, name: string}[]>([]);
  const [reporterOptions, setReporterOptions] = useState<{id: string, name: string}[]>([]);

  // Extract unique values from incidents
  useEffect(() => {
    if (incidents && incidents.length > 0) {
      // Extract categories
      const uniqueCategories = [...new Set(incidents.map(inc => inc.category))];
      setCategoryOptions(uniqueCategories);

      // Extract locations
      const uniqueLocations = [...new Set(incidents.map(inc => inc.location))];
      setLocationOptions(uniqueLocations);

      // Extract facilities
      const uniqueFacilities = [...new Set(incidents.map(inc => inc.facility).filter(Boolean) as string[])];
      setFacilityOptions(uniqueFacilities);

      // Extract assignees (owners)
      const uniqueAssignees = incidents
        .filter(inc => inc.owner)
        .map(inc => ({ id: inc.owner!.id, name: inc.owner!.name }))
        .filter((owner, index, self) => index === self.findIndex(o => o.id === owner.id));
      setAssigneeOptions(uniqueAssignees);

      // Extract reporters
      const uniqueReporters = incidents
        .map(inc => ({ id: inc.reportedBy.id, name: inc.reportedBy.name }))
        .filter((reporter, index, self) => index === self.findIndex(r => r.id === reporter.id));
      setReporterOptions(uniqueReporters);
    }
  }, [incidents]);

  return {
    categoryOptions,
    locationOptions,
    facilityOptions,
    statusOptions,
    priorityOptions,
    assigneeOptions,
    reporterOptions,
    isInsightsPage,
    campuses,
    classes,
    sections,
    designations
  };
};
