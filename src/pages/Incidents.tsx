
import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import IncidentsHeader from '@/components/incidents/IncidentsHeader';
import IncidentsDataTable from '@/components/incidents/IncidentsDataTable';
import { useIncidents } from '@/contexts/incident';
import { useIncidentPageData } from '@/hooks/useIncidentPageData';
import { IncidentRecord } from '@/services/incidentService';

const Incidents = () => {
  const { incidents } = useIncidents();
  const { fetchIncidents, loading, error } = useIncidentPageData();

  // Fetch incidents when the page loads
  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Transform Incident[] to IncidentRecord[] for the data table
  const incidentRecords: IncidentRecord[] = incidents.map(incident => ({
    id: incident.id,
    ticket_id: incident.ticketId, // Map ticketId to ticket_id
    type: incident.type,
    category: incident.category,
    subcategory: incident.subcategory,
    description: incident.description,
    date: incident.date,
    location: incident.location,
    facility: incident.facility || '',
    status: incident.status,
    priority: incident.priority || 'Medium',
    reportedBy: incident.reportedBy.name,
    owner: incident.owner?.name,
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt
  }));

  return (
    <Layout>
      <div className="container max-w-7xl py-6">
        <IncidentsHeader />
        <IncidentsDataTable incidents={incidentRecords} />
        
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
