
import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import IncidentsHeader from '@/components/incidents/IncidentsHeader';
import IncidentFilters from '@/components/incidents/IncidentFilters';
import LazyIncidentsTable from '@/components/incidents/LazyIncidentsTable';
import { useIncidentData } from '@/hooks/useIncidentData';
import { useIncidentFilters } from '@/hooks/useIncidentFilters';

const Incidents = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  const { 
    incidents, 
    loading, 
    error, 
    fetchIncidents, 
    refetchIncidents, 
    hasIncidentAdmin 
  } = useIncidentData();

  // Transform incidents for the filter hook
  const transformedIncidents = incidents.map(record => ({
    id: record.id,
    ticketId: record.ticketId,
    type: record.type,
    category: record.category,
    subcategory: record.subcategory,
    description: record.description,
    date: record.date,
    location: record.location,
    peopleInvolved: [],
    status: record.status,
    reportedBy: record.reportedBy,
    owner: record.owner,
    facility: record.facility,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    priority: record.priority
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
    clearFilters
  } = useIncidentFilters(transformedIncidents);

  // Transform filtered incidents back to records
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

  // Fetch incidents on component mount
  useEffect(() => {
    const loadIncidents = async () => {
      setIsInitialLoading(true);
      try {
        await fetchIncidents();
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadIncidents();
  }, [fetchIncidents]);

  // Show loading spinner during initial load or when loading
  const showLoadingSpinner = isInitialLoading || loading;

  if (error) {
    return (
      <Layout>
        <div className="space-y-6">
          <IncidentsHeader 
            hasIncidentAdmin={hasIncidentAdmin}
          />
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-red-600">Error loading incidents: {error}</p>
            <button 
              onClick={() => refetchIncidents()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <IncidentsHeader 
          hasIncidentAdmin={hasIncidentAdmin}
        />
        
        <IncidentFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          availableCategories={availableCategories}
          availableSubcategories={availableSubcategories}
          availableLocations={locationOptions}
          availableFacilities={availableFacilities}
          availableOwners={availableOwners}
          priorityOptions={priorityOptions}
          statusOptions={statusOptions}
        />
        
        <LazyIncidentsTable 
          incidents={filteredIncidentRecords} 
          loading={showLoadingSpinner}
        />
      </div>
    </Layout>
  );
};

export default Incidents;
