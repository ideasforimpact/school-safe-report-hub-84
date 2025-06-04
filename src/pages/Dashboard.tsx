
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivities from '@/components/dashboard/RecentActivities';
import SafetyResources from '@/components/dashboard/SafetyResources';
import IntegratedDashboardSection from '@/components/dashboard/IntegratedDashboardSection';
import ComprehensiveDashboardCards from '@/components/dashboard/ComprehensiveDashboardCards';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';

const Dashboard = () => {
  const { user } = useAuth();
  const { clients } = useClient();
  const { stats, loading } = useDashboardStats();

  // Find the client associated with the current user
  const userClient = user?.clientId 
    ? clients.find(c => c.id === user.clientId) 
    : null;

  // Mock activities for now - these should come from a dedicated service
  const recentActivities = [];

  // Data for the integrated dashboard section
  const openIncidentsData = {
    count: stats?.openIncidents.count || 0,
    change: -5 // Mock change for now
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
        {/* If no incidents yet and not loading, show a welcome message */}
        {!loading && stats?.openIncidents.count === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Welcome to {schoolName}'s Safety Command Center</AlertTitle>
            <AlertDescription>
              Your comprehensive dashboard for monitoring safety metrics, incidents, and compliance status.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Integrated Dashboard Overview */}
        <IntegratedDashboardSection openIncidentsData={openIncidentsData} />
        
        {/* Comprehensive Dashboard Cards */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Safety Metrics Overview</h2>
          <ComprehensiveDashboardCards />
        </div>
        
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
