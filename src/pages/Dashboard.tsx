
import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import SummaryCards from '@/components/dashboard/SummaryCards';
import RecentActivities from '@/components/dashboard/RecentActivities';
import QuickActions from '@/components/dashboard/QuickActions';
import SafetyModuleSummaryCards from '@/components/dashboard/SafetyModuleSummaryCards';
import IntegratedDashboardSection from '@/components/dashboard/IntegratedDashboardSection';
import { useIncidents } from '@/contexts/incident';
import { useIncidentPageData } from '@/hooks/useIncidentPageData';

const Dashboard = () => {
  const { incidents } = useIncidents();
  const { fetchIncidents } = useIncidentPageData();

  // Fetch incidents for dashboard metrics
  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Calculate dashboard metrics
  const openIncidentsCount = incidents.filter(i => i.status !== 'Closed').length;
  const totalIncidents = incidents.length;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const incidentsThisMonth = incidents.filter(i => {
    const incidentDate = new Date(i.createdAt);
    return incidentDate.getMonth() === currentMonth && incidentDate.getFullYear() === currentYear;
  }).length;

  // Find most common category
  const categoryCounts: Record<string, number> = {};
  incidents.forEach(incident => {
    categoryCounts[incident.category] = (categoryCounts[incident.category] || 0) + 1;
  });
  const mostCommonCategory = Object.keys(categoryCounts).reduce((a, b) => 
    categoryCounts[a] > categoryCounts[b] ? a : b, 'None'
  );

  // Calculate total people involved
  const totalPeopleInvolved = incidents.reduce((sum, incident) => 
    sum + (incident.peopleInvolved?.length || 0), 0
  );

  // Mock data for SafetyModuleSummaryCards with correct structure
  const safetyData = {
    openIncidents: {
      count: openIncidentsCount,
      change: 5 // Mock change percentage
    },
    verificationStatus: {
      verified: 45,
      pending: 12,
      total: 57
    },
    assessmentPerformance: {
      score: 87,
      completed: 23,
      total: 25
    },
    safetyResources: {
      count: 36,
      recent: 4
    }
  };

  // Transform incidents to activities with correct Activity structure
  const mockActivities = incidents.slice(0, 5).map(incident => ({
    type: 'incident' as const,
    activity: 'create' as const,
    entityId: incident.id,
    entityTitle: incident.description,
    user: incident.reportedBy.name,
    userId: incident.reportedBy.id,
    date: incident.createdAt,
    details: `New incident: ${incident.description}`
  }));

  // Data for IntegratedDashboardSection with correct structure
  const openIncidentsData = {
    count: openIncidentsCount,
    change: 5 // Mock change percentage
  };

  return (
    <Layout>
      <div className="container max-w-7xl py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening at your institution.</p>
          </div>
        </div>

        <SafetyModuleSummaryCards {...safetyData} />
        <SummaryCards 
          openIncidents={openIncidentsCount}
          totalIncidents={totalIncidents}
          incidentsThisMonth={incidentsThisMonth}
          mostCommonCategory={mostCommonCategory}
          categoryCounts={categoryCounts}
          totalPeopleInvolved={totalPeopleInvolved}
        />
        <IntegratedDashboardSection openIncidentsData={openIncidentsData} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentActivities activities={mockActivities} onActivityClick={() => {}} />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
