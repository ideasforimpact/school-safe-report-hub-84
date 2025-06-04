
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
  const schoolName = userClient?.name || 'Your Organization';

  return (
    <Layout>
      <div className="container py-8 space-y-8">
        {/* Welcome Message */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to {schoolName}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your comprehensive safety and management dashboard. Monitor incidents, assessments, and organizational metrics in real-time.
          </p>
        </div>

        {/* If no incidents yet and not loading, show a welcome message */}
        {!loading && stats && stats.openIncidents === 0 && (
          <Alert className="border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Great News!</AlertTitle>
            <AlertDescription className="text-green-700">
              No open incidents currently require attention. Your safety systems are running smoothly.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Dashboard Statistics Cards */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 text-center">
            Key Metrics Overview
          </h2>
          <DashboardStatsCards 
            stats={stats}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
