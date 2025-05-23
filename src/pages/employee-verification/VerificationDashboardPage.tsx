
import React from 'react';
import Layout from '@/components/layout/Layout';
import { FileCheck, Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import VerificationOverview from '@/components/employee-verification/dashboard/VerificationOverview';
import DocumentExpiryAlerts from '@/components/employee-verification/dashboard/DocumentExpiryAlerts';
import RecentVerifications from '@/components/employee-verification/dashboard/RecentVerifications';
import VerificationTrends from '@/components/employee-verification/dashboard/VerificationTrends';

const VerificationDashboardPage = () => {
  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-100">
          <div className="flex items-center space-x-4">
            <FileCheck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-left">Verification Dashboard</h1>
              <p className="text-gray-500 text-sm text-left">Monitor verification activities and metrics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="flex items-center gap-2">
              <Link to="/employee-verification">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Employees</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="space-y-6">
          {/* Overview cards */}
          <VerificationOverview />
          
          {/* Two column layout for charts and alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <VerificationTrends />
            </div>
            <div className="lg:col-span-1">
              <DocumentExpiryAlerts />
            </div>
          </div>
          
          {/* Recent verification activity */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <RecentVerifications />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VerificationDashboardPage;