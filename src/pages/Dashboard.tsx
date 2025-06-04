
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
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

  // Get the school name for the welcome message
  const schoolName = userClient?.name || 'Your School';

  return (
    <Layout>
      <div className="container py-6 space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to {schoolName}</h1>
          <p className="text-lg text-gray-600">Safety Command Center Dashboard</p>
        </div>

        {/* If no incidents yet and not loading, show a welcome message */}
        {!loading && stats && stats.openIncidents === 0 && (
          <Alert className="border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Great News!</AlertTitle>
            <AlertDescription className="text-green-700">
              No open incidents at {schoolName}. Your safety systems are working well.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Dashboard Statistics Cards */}
        <DashboardStatsCards 
          stats={stats}
          loading={loading}
          error={error}
        />
      </div>
    </Layout>
  );
};

export default Dashboard;
