
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import SafetyDashboardHeader from '@/components/dashboard/SafetyDashboardHeader';
import EnhancedStatsCards from '@/components/dashboard/EnhancedStatsCards';
import SafetyPerformanceGauges from '@/components/dashboard/SafetyPerformanceGauges';
import RiskAssessmentMatrix from '@/components/dashboard/RiskAssessmentMatrix';
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
        {/* Enhanced Safety Dashboard Header */}
        <SafetyDashboardHeader 
          stats={stats}
          schoolName={schoolName}
          loading={loading}
        />

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

        {/* Critical Safety Overview */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Critical Safety Overview</h2>
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
          
          <EnhancedStatsCards stats={stats} loading={loading} />
        </div>

        {/* Safety Performance Metrics */}
        <SafetyPerformanceGauges stats={stats} loading={loading} />

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Assessment Matrix */}
          <RiskAssessmentMatrix stats={stats} loading={loading} />
          
          {/* Monthly Incidents Trend */}
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
