
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  FileCheck, 
  Users, 
  Car, 
  Calendar,
  TrendingUp 
} from 'lucide-react';

interface DashboardStatsCardsProps {
  stats: {
    openIncidents: number;
    activeAssessments: number;
    totalEmployees: number;
    verifiedEmployees: number;
    totalVehicles: number;
    verifiedVehicles: number;
    lastMonthIncidents: number;
    lastSixMonthsIncidents: number;
  } | null;
  loading: boolean;
  error: string | null;
}

const DashboardStatsCards: React.FC<DashboardStatsCardsProps> = ({ stats, loading, error }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="border-none shadow-card">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading dashboard stats: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const verificationPercentage = stats.totalEmployees > 0 
    ? Math.round((stats.verifiedEmployees / stats.totalEmployees) * 100) 
    : 0;

  const vehicleVerificationPercentage = stats.totalVehicles > 0 
    ? Math.round((stats.verifiedVehicles / stats.totalVehicles) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {/* Open Incidents Card */}
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-medium">Open Incidents</CardTitle>
            <div className="bg-red-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
            </div>
          </div>
          <CardDescription>Require attention</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl md:text-3xl font-semibold text-primary-700">{stats.openIncidents}</p>
        </CardContent>
      </Card>

      {/* Active Assessments Card */}
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-medium">Active Assessments</CardTitle>
            <div className="bg-blue-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
              <FileCheck className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            </div>
          </div>
          <CardDescription>In progress</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl md:text-3xl font-semibold text-primary-700">{stats.activeAssessments}</p>
        </CardContent>
      </Card>

      {/* Employee Verification Card */}
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-medium">Employee Verification</CardTitle>
            <div className="bg-green-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
            </div>
          </div>
          <CardDescription>Verification status</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl md:text-3xl font-semibold text-primary-700">{verificationPercentage}%</p>
          <div className="h-2 w-full bg-gray-100 rounded-full mt-2 mb-1">
            <div 
              className="h-2 bg-green-500 rounded-full" 
              style={{width: `${verificationPercentage}%`}}
            ></div>
          </div>
          <p className="text-xs text-gray-500">
            {stats.verifiedEmployees} of {stats.totalEmployees} verified
          </p>
        </CardContent>
      </Card>

      {/* Vehicle Verification Card */}
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-medium">Vehicle Verification</CardTitle>
            <div className="bg-purple-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
              <Car className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
            </div>
          </div>
          <CardDescription>Vehicles verified</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl md:text-3xl font-semibold text-primary-700">{vehicleVerificationPercentage}%</p>
          <div className="h-2 w-full bg-gray-100 rounded-full mt-2 mb-1">
            <div 
              className="h-2 bg-purple-500 rounded-full" 
              style={{width: `${vehicleVerificationPercentage}%`}}
            ></div>
          </div>
          <p className="text-xs text-gray-500">
            {stats.verifiedVehicles} of {stats.totalVehicles} verified
          </p>
        </CardContent>
      </Card>

      {/* Last Month Incidents Card */}
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-medium">Last Month</CardTitle>
            <div className="bg-orange-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
              <Calendar className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
            </div>
          </div>
          <CardDescription>Incidents reported</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl md:text-3xl font-semibold text-primary-700">{stats.lastMonthIncidents}</p>
        </CardContent>
      </Card>

      {/* Last 6 Months Incidents Card */}
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg font-medium">Last 6 Months</CardTitle>
            <div className="bg-indigo-100 h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-indigo-600" />
            </div>
          </div>
          <CardDescription>Incidents reported</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl md:text-3xl font-semibold text-primary-700">{stats.lastSixMonthsIncidents}</p>
        </CardContent>
      </Card>

      {/* Summary Cards for remaining space */}
      <Card className="border-none shadow-card hover:shadow-card-hover transition-shadow sm:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg font-medium">System Overview</CardTitle>
          <CardDescription>Key metrics summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Employees</p>
              <p className="text-xl font-semibold text-primary-700">{stats.totalEmployees}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Vehicles</p>
              <p className="text-xl font-semibold text-primary-700">{stats.totalVehicles}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStatsCards;
