
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivities from '@/components/dashboard/RecentActivities';
import SafetyResources from '@/components/dashboard/SafetyResources';
import DashboardStatsCards from '@/components/dashboard/DashboardStatsCards';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';

const Dashboard = () => {
  const { user } = useAuth();
  const { clients } = useClient();
  
  // Find the client associated with the current user
  const userClient = user?.clientId 
    ? clients.find(c => c.id === user.clientId) 
    : null;

  // Fetch dashboard stats using the new hook
  const { stats, loading: statsLoading, error: statsError } = useDashboardStats(user?.clientId || null);

  // Mock activities for now - these should come from a dedicated service
  const recentActivities = [];

  // Handler for activity clicks
  const handleActivityClick = (activity: any) => {
    console.log("Activity clicked:", activity);
  };

  // Get the school name for the welcome message
  const schoolName = userClient?.name || 'Your School';

  return (
    <Layout>
      <div className="container py-6 space-y-8">
        {/* Welcome message */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome to {schoolName}'s Safety Command Center
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor your safety metrics and manage incidents effectively
          </p>
        </div>

        {/* Error handling */}
        {statsError && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Dashboard</AlertTitle>
            <AlertDescription>{statsError}</AlertDescription>
          </Alert>
        )}
        
        {/* Dashboard Statistics Cards */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>
          <DashboardStatsCards stats={stats} loading={statsLoading} />
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
