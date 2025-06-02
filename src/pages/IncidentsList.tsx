
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { IncidentRecord } from '@/services/incidentService';
import { optimizedIncidentService } from '@/services/incident/optimizedIncidentService';
import IncidentsDataTable from '@/components/incidents/IncidentsDataTable';
import IncidentsHeader from '@/components/incidents/IncidentsHeader';
import IncidentFilters from '@/components/incidents/IncidentFilters';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIncidentFilters } from '@/hooks/useIncidentFilters';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const IncidentsList = () => {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { state: employeeState } = useEmployeeStore();
  const { user, employeeData: authEmployeeData } = useAuth();

  // Transform IncidentRecord[] to Incident[] for the filter hook
  const transformedIncidents = incidents.map(record => ({
    id: record.id,
    ticketId: record.ticket_id,
    type: record.type as any,
    category: record.category as any,
    subcategory: record.subcategory,
    description: record.description,
    date: record.date,
    location: record.location as any,
    peopleInvolved: [],
    status: record.status as any,
    reportedBy: { id: '', name: record.reportedBy },
    owner: record.owner ? { id: '', name: record.owner } : undefined,
    facility: record.facility,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    priority: record.priority as any
  }));

  const {
    filters,
    filteredIncidents,
    availableCategories,
    availableSubcategories,
    availableLocations,
    availableFacilities,
    availableOwners,
    priorityOptions,
    statusOptions,
    locationOptions,
    handleFilterChange,
    toggleAdvancedFilters,
    clearFilters
  } = useIncidentFilters(transformedIncidents);

  // Transform filtered incidents back to IncidentRecord[]
  const filteredIncidentRecords = filteredIncidents.map(incident => ({
    id: incident.id,
    ticket_id: incident.ticketId,
    type: incident.type,
    category: incident.category,
    subcategory: incident.subcategory,
    description: incident.description,
    date: incident.date,
    location: incident.location,
    facility: incident.facility || '',
    status: incident.status,
    priority: incident.priority,
    reportedBy: incident.reportedBy.name,
    owner: incident.owner?.name,
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt
  }));

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);

        // Get client ID from available sources
        let clientId = employeeState.employeeData?.clientId || authEmployeeData?.clientId;

        // If no client ID from context, get from user email
        if (!clientId && user?.email) {
          const { data: empData } = await supabase
            .from('employees')
            .select('client_id')
            .eq('email', user.email.toLowerCase())
            .maybeSingle();
            
          if (empData) {
            clientId = empData.client_id;
          }
        }

        if (!clientId) {
          setIncidents([]);
          return;
        }

        const fetchedIncidents = await optimizedIncidentService.fetchIncidents(clientId);
        setIncidents(fetchedIncidents);

      } catch (error: any) {
        console.error('Error fetching incidents:', error);
        if (error.message?.includes('timeout')) {
          toast.error('Request timed out. Please try again or contact support if the issue persists.');
        } else {
          toast.error('Failed to load incidents. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, [employeeState.employeeData?.clientId, authEmployeeData?.clientId, user?.email]);

  return (
    <Layout>
      <div className="space-y-6 p-6 w-full">
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
          <div className="w-full">
            <IncidentsHeader />
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 space-y-6">
          <IncidentFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            toggleAdvancedFilters={toggleAdvancedFilters}
            availableCategories={availableCategories}
            availableSubcategories={availableSubcategories}
            availableLocations={availableLocations}
            availableFacilities={availableFacilities}
            availableOwners={availableOwners}
            priorityOptions={priorityOptions}
            locationOptions={locationOptions}
            statusOptions={statusOptions}
          />
          
          <IncidentsDataTable incidents={filteredIncidentRecords} loading={loading} />
        </div>
      </div>
    </Layout>
  );
};

export default IncidentsList;
