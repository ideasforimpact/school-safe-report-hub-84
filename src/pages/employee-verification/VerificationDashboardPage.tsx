
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VerificationOverview from '@/components/employee-verification/dashboard/VerificationOverview';
import VerificationTrends from '@/components/employee-verification/dashboard/VerificationTrends';
import VerificationPerformance from '@/components/employee-verification/dashboard/VerificationPerformance';
import DocumentExpiryAlerts from '@/components/employee-verification/dashboard/DocumentExpiryAlerts';
import RecentVerifications from '@/components/employee-verification/dashboard/RecentVerifications';
import { FileCheck, BarChart2, Clock, AlertTriangle, Activity, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const VerificationDashboardPage = () => {
  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-100">
          <div className="flex items-center space-x-4">
            <BarChart2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Verification Dashboard</h1>
              <p className="text-gray-500 text-sm">Monitor verification activities and compliance</p>
            </div>
          </div>
          <Button asChild variant="outline" className="flex items-center gap-2">
            <Link to="/employee-verification">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Employees</span>
            </Link>
          </Button>
        </div>

        <VerificationOverview />

        <Tabs defaultValue="trends" className="mt-8">
          <TabsList className="mb-6 bg-gray-100 p-1">
            <TabsTrigger value="trends" className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              <span>Trends</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Performance</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="recent" className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Recent Activity</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="trends" className="animate-fade-in">
            <VerificationTrends />
          </TabsContent>
          
          <TabsContent value="performance" className="animate-fade-in">
            <VerificationPerformance />
          </TabsContent>
          
          <TabsContent value="alerts" className="animate-fade-in">
            <DocumentExpiryAlerts />
          </TabsContent>
          
          <TabsContent value="recent" className="animate-fade-in">
            <RecentVerifications />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default VerificationDashboardPage;
