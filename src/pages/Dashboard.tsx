
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import SummaryCards from '@/components/dashboard/SummaryCards';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivities from '@/components/dashboard/RecentActivities';
import SafetyResources from '@/components/dashboard/SafetyResources';
import IntegratedDashboardSection from '@/components/dashboard/IntegratedDashboardSection';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';
import { useIncidentStats } from '@/hooks/useIncidentStats';

const Dashboard = () => {
  const { user } = useAuth();
  const { clients } = useClient();
  const { stats: incidentStats, loading: statsLoading } = useIncidentStats();

  // Find the client associated with the current user
  const userClient = user?.clientId 
    ? clients.find(c => c.id === user.clientId) 
    : null;

  // Mock activities for now - these should come from a dedicated service
  const recentActivities = [];

  // Calculate statistics for the dashboard using the stats hook
  const totalIncidents = incidentStats.total;
  const openIncidents = incidentStats.open;
  const inProgressIncidents = incidentStats.inProgress;
  const closedIncidents = incidentStats.closed;
  
  // Safety stats - these should come from actual calculations
  const incidentFreeStreak = 14;
  const reportRate = 92;
  
  // Mock calculations for categories and people involved
  const categoryCounts = { 'Physical Injury': 5, 'Property Damage': 3 };
  const mostCommonCategory = 'Physical Injury';
  const totalPeopleInvolved = totalIncidents * 2; // Mock calculation

  // Data for the integrated dashboard section
  const openIncidentsData = {
    count: openIncidents,
    change: -5
  };

  // Handler for activity clicks
  const handleActivityClick = (activity: any) => {
    console.log("Activity clicked:", activity);
  };

  // Get the school name for the welcome message
  const schoolName = userClient?.name || 'Your School';

  return (
    <Layout>
      <div className="container py-6 space-y-8">
        {/* If no incidents yet, show a welcome message */}
        {totalIncidents === 0 && !statsLoading && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Welcome to {schoolName}'s Safety Command Center</AlertTitle>
          </Alert>
        )}
        
        {/* Integrated Dashboard Overview */}
        <IntegratedDashboardSection openIncidentsData={openIncidentsData} />
        
        {/* Dashboard Cards */}
        <SummaryCards 
          openIncidents={openIncidents}
          totalIncidents={totalIncidents}
          incidentsThisMonth={inProgressIncidents}
          mostCommonCategory={mostCommonCategory}
          categoryCounts={categoryCounts}
          totalPeopleInvolved={totalPeopleInvolved}
        />
        
        {/* Quick Actions Section */}
        <QuickActions />
        
        {/* Two column layout for activities and resources */}
        <div className="grid gap-8 md:grid-cols-2">
          <RecentActivities 
            activities={recentActivities}
            onActivityClick={handleActivityClick}
          />
          
          <SafetyResources />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
