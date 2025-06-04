
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivities from '@/components/dashboard/RecentActivities';
import SafetyResources from '@/components/dashboard/SafetyResources';
import IntegratedDashboardSection from '@/components/dashboard/IntegratedDashboardSection';
import DashboardStatsCards from '@/components/dashboard/DashboardStatsCards';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';

const Dashboard = () => {
  const { user } = useAuth();
  const { clients } = useClient();
  const { stats, loading, error } = useDashboardStats();

  // Find the client associated with the current user
  const userClient = user?.clientId 
    ? clients.find(c => c.id === user.clientId) 
    : null;

  // Mock activities for now - these should come from a dedicated service
  const recentActivities = [];

  // Handler for activity clicks
  const handleActivityClick = (activity: any) => {
    console.log("Activity clicked:", activity);
  };

  // Get the school name for the welcome message
  const schoolName = userClient?.name || 'Your School';

  // Data for the integrated dashboard section
  const openIncidentsData = {
    count: stats?.openIncidents || 0,
    change: -5
  };

  return (
    <Layout>
      <div className="container py-6 space-y-8">
        {/* If no incidents yet and not loading, show a welcome message */}
        {!loading && stats && stats.openIncidents === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Welcome to {schoolName}'s Safety Command Center</AlertTitle>
          </Alert>
        )}
        
        {/* Integrated Dashboard Overview */}
        <IntegratedDashboardSection openIncidentsData={openIncidentsData} />
        
        {/* Dashboard Statistics Cards */}
        <DashboardStatsCards 
          stats={stats}
          loading={loading}
          error={error}
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
