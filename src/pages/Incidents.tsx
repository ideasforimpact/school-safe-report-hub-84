
import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import IncidentsHeader from '@/components/incidents/IncidentsHeader';
import IncidentsDataTable from '@/components/incidents/IncidentsDataTable';
import { useIncidentPageData } from '@/hooks/useIncidentPageData';

const Incidents = () => {
  const { fetchIncidents, loading, error } = useIncidentPageData();

  // Fetch incidents when the page loads
  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  return (
    <Layout>
      <div className="container max-w-7xl py-6">
        <IncidentsHeader />
        <IncidentsDataTable />
        
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {error && (
          <div className="text-center py-8 text-red-600">
            <p>Error loading incidents: {error}</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Incidents;
