
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import DashboardStatsCards from '@/components/dashboard/DashboardStatsCards';
import MonthlyIncidentsChart from '@/components/dashboard/MonthlyIncidentsChart';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';

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
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to {schoolName}'s Safety Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor your safety metrics and key performance indicators
          </p>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Dashboard</AlertTitle>
            <AlertDescription>
              {error}. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        )}

        {/* Dashboard Statistics Cards */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h2>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
          
          <DashboardStatsCards stats={stats} loading={loading} />
        </div>

        {/* Monthly Incidents Chart */}
        <div className="space-y-6">
          <MonthlyIncidentsChart 
            data={stats.monthlyIncidentsData} 
            loading={loading} 
          />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
