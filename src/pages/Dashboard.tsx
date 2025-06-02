
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

  return (
    <Layout>
      <div className="container max-w-7xl py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening at your institution.</p>
          </div>
        </div>

        <SafetyModuleSummaryCards />
        <SummaryCards incidents={incidents} />
        <IntegratedDashboardSection />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentActivities />
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
