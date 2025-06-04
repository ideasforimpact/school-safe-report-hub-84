
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
    newAssessments: number;
    totalEmployees: number;
    employeesWithDocuments: number;
    totalVehicles: number;
    vehiclesWithDocuments: number;
    lastMonthIncidents: number;
    lastSixMonthsIncidents: number;
  } | null;
  loading: boolean;
  error: string | null;
}

const DashboardStatsCards: React.FC<DashboardStatsCardsProps> = ({ stats, loading, error }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="border-none shadow-lg">
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

  const employeeDocumentPercentage = stats.totalEmployees > 0 
    ? Math.round((stats.employeesWithDocuments / stats.totalEmployees) * 100) 
    : 0;

  const vehicleDocumentPercentage = stats.totalVehicles > 0 
    ? Math.round((stats.vehiclesWithDocuments / stats.totalVehicles) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Open Incidents Card */}
      <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-red-50 to-red-100">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-red-800">Open Incidents</CardTitle>
            <div className="bg-red-200 h-12 w-12 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <CardDescription className="text-red-600">Require immediate attention</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-red-700">{stats.openIncidents}</p>
        </CardContent>
      </Card>

      {/* New Assessments Card */}
      <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-blue-800">New Assessments</CardTitle>
            <div className="bg-blue-200 h-12 w-12 rounded-full flex items-center justify-center">
              <FileCheck className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <CardDescription className="text-blue-600">Pending review</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-700">{stats.newAssessments}</p>
        </CardContent>
      </Card>

      {/* Employee Verification Card */}
      <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-green-800">Employee Verification</CardTitle>
            <div className="bg-green-200 h-12 w-12 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <CardDescription className="text-green-600">Document upload status</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-700">{employeeDocumentPercentage}%</p>
          <div className="h-2 w-full bg-green-200 rounded-full mt-2 mb-1">
            <div 
              className="h-2 bg-green-500 rounded-full transition-all duration-500" 
              style={{width: `${employeeDocumentPercentage}%`}}
            ></div>
          </div>
          <p className="text-xs text-green-600">
            {stats.employeesWithDocuments} of {stats.totalEmployees} employees
          </p>
        </CardContent>
      </Card>

      {/* Transport Safety Card */}
      <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-purple-800">Transport Safety</CardTitle>
            <div className="bg-purple-200 h-12 w-12 rounded-full flex items-center justify-center">
              <Car className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <CardDescription className="text-purple-600">Vehicle documentation</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-purple-700">{vehicleDocumentPercentage}%</p>
          <div className="h-2 w-full bg-purple-200 rounded-full mt-2 mb-1">
            <div 
              className="h-2 bg-purple-500 rounded-full transition-all duration-500" 
              style={{width: `${vehicleDocumentPercentage}%`}}
            ></div>
          </div>
          <p className="text-xs text-purple-600">
            {stats.vehiclesWithDocuments} of {stats.totalVehicles} vehicles
          </p>
        </CardContent>
      </Card>

      {/* Last Month Incidents Card */}
      <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-orange-800">Last Month</CardTitle>
            <div className="bg-orange-200 h-12 w-12 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <CardDescription className="text-orange-600">Incidents reported</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-orange-700">{stats.lastMonthIncidents}</p>
        </CardContent>
      </Card>

      {/* Last 6 Months Incidents Card */}
      <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-indigo-50 to-indigo-100">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-indigo-800">Last 6 Months</CardTitle>
            <div className="bg-indigo-200 h-12 w-12 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <CardDescription className="text-indigo-600">Incidents reported</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-indigo-700">{stats.lastSixMonthsIncidents}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStatsCards;
