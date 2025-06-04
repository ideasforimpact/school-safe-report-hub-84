
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, FileCheck, Users, Truck, Calendar, TrendingUp } from 'lucide-react';

interface DashboardStatsCardsProps {
  stats: {
    openIncidents: number;
    activeAssessments: number;
    totalEmployees: number;
    employeesVerified: number;
    totalVehicles: number;
    vehiclesWithDocuments: number;
    incidentsLastMonth: number;
    incidentsLast6Months: number;
  };
  loading: boolean;
}

const DashboardStatsCards = ({ stats, loading }: DashboardStatsCardsProps) => {
  const employeeVerificationPercentage = stats.totalEmployees > 0 
    ? Math.round((stats.employeesVerified / stats.totalEmployees) * 100) 
    : 0;

  const vehicleDocumentationPercentage = stats.totalVehicles > 0 
    ? Math.round((stats.vehiclesWithDocuments / stats.totalVehicles) * 100) 
    : 0;

  const statsCards = [
    {
      title: 'Open Incidents',
      value: stats.openIncidents,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      title: 'New Assessments',
      value: stats.activeAssessments,
      icon: FileCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Employee Verification',
      value: `${employeeVerificationPercentage}%`,
      subtitle: `${stats.employeesVerified} of ${stats.totalEmployees} employees`,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Transport Safety',
      value: `${vehicleDocumentationPercentage}%`,
      subtitle: `${stats.vehiclesWithDocuments} of ${stats.totalVehicles} vehicles`,
      icon: Truck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Incidents Last Month',
      value: stats.incidentsLastMonth,
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Incidents Last 6 Months',
      value: stats.incidentsLast6Months,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 w-6 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {statsCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className={`border-l-4 ${card.borderColor} hover:shadow-lg transition-shadow duration-200`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${card.color} mb-1`}>
                {card.value}
              </div>
              {card.subtitle && (
                <p className="text-xs text-gray-600">
                  {card.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStatsCards;
