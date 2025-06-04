
import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import IncidentsHeader from '@/components/incidents/IncidentsHeader';
import IncidentsFilters from '@/components/incidents/IncidentsFilters';
import LazyIncidentsTable from '@/components/incidents/LazyIncidentsTable';
import { useIncidentData } from '@/hooks/useIncidentData';
import { useIncidentFilters } from '@/hooks/useIncidentFilters';
import { filterIncidents } from '@/utils/incidentFilters';

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
  
  const {
    filters,
    handleFilterChange,
    handleDateRangeChange,
    clearFilters
  } = useIncidentFilters();

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

  // Apply filters to incidents
  const filteredIncidents = filterIncidents(incidents, filters);

  // Show loading spinner during initial load or when loading
  const showLoadingSpinner = isInitialLoading || loading;

  if (error) {
    return (
      <Layout>
        <div className="space-y-6">
          <IncidentsHeader 
            totalIncidents={0}
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
          totalIncidents={filteredIncidents.length}
          hasIncidentAdmin={hasIncidentAdmin}
        />
        
        <IncidentsFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onDateRangeChange={handleDateRangeChange}
          onClearFilters={clearFilters}
          totalFiltered={filteredIncidents.length}
          totalIncidents={incidents.length}
        />
        
        <LazyIncidentsTable 
          incidents={filteredIncidents} 
          loading={showLoadingSpinner}
        />
      </div>
    </Layout>
  );
};

export default Incidents;
