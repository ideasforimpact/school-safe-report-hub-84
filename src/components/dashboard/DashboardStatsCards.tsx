
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="border-none shadow-lg">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-16" />
              <Skeleton className="h-4 w-28 mt-2" />
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
    <div className="space-y-8">
      {/* Primary Stats - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Open Incidents Card */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-red-800">Open Incidents</CardTitle>
                <CardDescription className="text-red-600">Require attention</CardDescription>
              </div>
              <div className="bg-red-200 h-12 w-12 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-red-700">{stats.openIncidents}</p>
            <p className="text-sm text-red-600 mt-1">Active incidents</p>
          </CardContent>
        </Card>

        {/* Active Assessments Card */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-blue-800">New Assessments</CardTitle>
                <CardDescription className="text-blue-600">Pending completion</CardDescription>
              </div>
              <div className="bg-blue-200 h-12 w-12 rounded-full flex items-center justify-center">
                <FileCheck className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-700">{stats.activeAssessments}</p>
            <p className="text-sm text-blue-600 mt-1">New assessments</p>
          </CardContent>
        </Card>

        {/* Employee Verification Card */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-green-800">Employee Verification</CardTitle>
                <CardDescription className="text-green-600">Verification progress</CardDescription>
              </div>
              <div className="bg-green-200 h-12 w-12 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-700">{verificationPercentage}%</p>
            <div className="h-3 w-full bg-green-200 rounded-full mt-3 mb-2">
              <div 
                className="h-3 bg-green-500 rounded-full transition-all duration-500" 
                style={{width: `${verificationPercentage}%`}}
              ></div>
            </div>
            <p className="text-sm text-green-600">
              {stats.verifiedEmployees} of {stats.totalEmployees} verified
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats - Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Vehicle Verification Card */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-purple-800">Vehicle Verification</CardTitle>
                <CardDescription className="text-purple-600">Vehicles verified</CardDescription>
              </div>
              <div className="bg-purple-200 h-12 w-12 rounded-full flex items-center justify-center">
                <Car className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-purple-700">{vehicleVerificationPercentage}%</p>
            <div className="h-3 w-full bg-purple-200 rounded-full mt-3 mb-2">
              <div 
                className="h-3 bg-purple-500 rounded-full transition-all duration-500" 
                style={{width: `${vehicleVerificationPercentage}%`}}
              ></div>
            </div>
            <p className="text-sm text-purple-600">
              {stats.verifiedVehicles} of {stats.totalVehicles} verified
            </p>
          </CardContent>
        </Card>

        {/* Last Month Incidents Card */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-orange-800">Last Month</CardTitle>
                <CardDescription className="text-orange-600">Incidents reported</CardDescription>
              </div>
              <div className="bg-orange-200 h-12 w-12 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-orange-700">{stats.lastMonthIncidents}</p>
            <p className="text-sm text-orange-600 mt-1">Past 30 days</p>
          </CardContent>
        </Card>

        {/* Last 6 Months Incidents Card */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-indigo-50 to-indigo-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-indigo-800">Last 6 Months</CardTitle>
                <CardDescription className="text-indigo-600">Incidents reported</CardDescription>
              </div>
              <div className="bg-indigo-200 h-12 w-12 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-indigo-700">{stats.lastSixMonthsIncidents}</p>
            <p className="text-sm text-indigo-600 mt-1">Past 6 months</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStatsCards;
