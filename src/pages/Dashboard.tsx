
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import SafetyDashboardHeader from '@/components/dashboard/SafetyDashboardHeader';
import EnhancedStatsCards from '@/components/dashboard/EnhancedStatsCards';
import SafetyPerformanceGauges from '@/components/dashboard/SafetyPerformanceGauges';
import FacilityRiskMatrix from '@/components/dashboard/FacilityRiskMatrix';
import CategoryImpactAnalysis from '@/components/dashboard/CategoryImpactAnalysis';
import MonthlyIncidentsChart from '@/components/dashboard/MonthlyIncidentsChart';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { clients } = useClient();
  const { stats, loading, error } = useDashboardStats();

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Enhanced Safety Dashboard Header */}
        <SafetyDashboardHeader stats={stats} loading={loading} />

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

        {/* Enhanced Statistics Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Safety Metrics Overview</h2>
            <div className="text-sm text-gray-500">
              Real-time safety monitoring and compliance tracking
            </div>
          </div>
          <EnhancedStatsCards stats={stats} loading={loading} />
        </div>

        {/* Safety Performance Gauges */}
        <SafetyPerformanceGauges stats={stats} loading={loading} />

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FacilityRiskMatrix loading={loading} />
          <CategoryImpactAnalysis loading={loading} />
        </div>
        
        {/* Monthly Trends */}
        <div className="grid grid-cols-1 gap-6">
          <MonthlyIncidentsChart data={stats.monthlyIncidentsData || []} loading={loading} />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
