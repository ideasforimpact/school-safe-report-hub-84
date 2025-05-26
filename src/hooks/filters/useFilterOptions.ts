
import { useState, useEffect } from 'react';
import { useIncidents } from '@/contexts/incident';
import { useLocation } from 'react-router-dom';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { categoryService } from '@/services/incident/categoryService';
import { priorityService } from '@/services/incident/priorityService';
import { supabase } from '@/integrations/supabase/client';

// Hook to get filter options for incidents
export const useFilterOptions = () => {
  const { incidents, locations, facilities, designations, campuses, classes, sections } = useIncidents();
  const location = useLocation();
  const isInsightsPage = location.pathname.includes('/insights');
  const { state } = useEmployeeStore();

  // Initialize options arrays
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<string[]>([]);
  const [priorityOptions, setPriorityOptions] = useState<string[]>([]);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [facilityOptions, setFacilityOptions] = useState<string[]>([]);
  const [assigneeOptions, setAssigneeOptions] = useState<{id: string, name: string}[]>([]);
  const [reporterOptions, setReporterOptions] = useState<{id: string, name: string}[]>([]);

  // Fetch all filter data from database
  useEffect(() => {
    const fetchFilterData = async () => {
      if (!state.employeeData?.clientId) {
        console.log('No client ID available for fetching filter data');
        return;
      }

      try {
        console.log('Fetching filter data for client:', state.employeeData.clientId);

        // Fetch categories
        const categories = await categoryService.getCategories(state.employeeData.clientId);
        setCategoryOptions(categories.map(cat => cat.name));
        console.log('Categories loaded:', categories.length);

        // Fetch subcategories
        const subcategories = await categoryService.getSubcategories(undefined, state.employeeData.clientId);
        setSubcategoryOptions(subcategories.map(sub => sub.name));
        console.log('Subcategories loaded:', subcategories.length);

        // Fetch priorities
        const priorities = await priorityService.getPriorities(state.employeeData.clientId, true);
        setPriorityOptions(priorities.map(priority => priority.name));
        console.log('Priorities loaded:', priorities.length);

        // Fetch status options from database
        const { data: statusData, error: statusError } = await supabase
          .from('incident_status')
          .select('name')
          .order('name');

        if (statusError) {
          console.error('Error fetching status options:', statusError);
        } else {
          setStatusOptions(statusData?.map(status => status.name) || []);
          console.log('Status options loaded:', statusData?.length || 0);
        }

        // Fetch locations from campuses table
        const { data: campusData, error: campusError } = await supabase
          .from('campuses')
          .select('name')
          .eq('client_id', state.employeeData.clientId)
          .order('name');

        if (campusError) {
          console.error('Error fetching campus locations:', campusError);
        } else {
          setLocationOptions(campusData?.map(campus => campus.name) || []);
          console.log('Campus locations loaded:', campusData?.length || 0);
        }

        // Fetch facilities from facilities table
        const { data: facilityData, error: facilityError } = await supabase
          .from('facilities')
          .select('name')
          .eq('client_id', state.employeeData.clientId)
          .order('name');

        if (facilityError) {
          console.error('Error fetching facilities:', facilityError);
        } else {
          setFacilityOptions(facilityData?.map(facility => facility.name) || []);
          console.log('Facilities loaded:', facilityData?.length || 0);
        }

        console.log('All filter data loaded successfully');
      } catch (error) {
        console.error('Error fetching filter data:', error);
      }
    };

    fetchFilterData();
  }, [state.employeeData?.clientId]);

  // Extract unique values from incidents for assignees and reporters
  useEffect(() => {
    if (incidents && incidents.length > 0) {
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

      console.log('Assignees and reporters extracted from incidents:', {
        assignees: uniqueAssignees.length,
        reporters: uniqueReporters.length
      });
    }
  }, [incidents]);

  return {
    categoryOptions,
    subcategoryOptions,
    priorityOptions,
    statusOptions,
    locationOptions,
    facilityOptions,
    assigneeOptions,
    reporterOptions,
    isInsightsPage,
    campuses,
    classes,
    sections,
    designations
  };
};
