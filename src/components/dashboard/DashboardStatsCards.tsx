
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
    vehiclesVerified?: number;
    incidentsLastMonth: number;
    incidentsLast6Months: number;
    // Add existence checks
    IncidentRecordsExist: boolean;
    AssessmentRecordsExist: boolean;
    VehicleRecordsExist: boolean;
    EmployeeRecordsExist: boolean;
    FormSubmissionRecordsExist: boolean;
  };
  loading: boolean;
}

const DashboardStatsCards = ({ stats, loading }: DashboardStatsCardsProps) => {
  const employeeVerificationPercentage = stats.EmployeeRecordsExist && stats.totalEmployees > 0 
    ? Math.round((stats.employeesVerified / stats.totalEmployees) * 100) 
    : 0;

  const vehicleDocumentationPercentage = stats.VehicleRecordsExist && stats.totalVehicles > 0 
    ? Math.round((stats.vehiclesWithDocuments / stats.totalVehicles) * 100) 
    : 0;

  const statsCards = [
    {
      title: 'Total Number of Open Incidents',
      value: stats.IncidentRecordsExist ? stats.openIncidents : 'N/A',
      subValues: stats.IncidentRecordsExist ? [
        { label: 'Closed Incidents:', value: '0' },
        { label: 'Reopened Incidents:', value: '0' }
      ] : [
        { label: 'Closed Incidents:', value: '—' },
        { label: 'Reopened Incidents:', value: '—' }
      ],
      icon: AlertTriangle,
      color: stats.IncidentRecordsExist ? 'text-red-600' : 'text-gray-500',
      bgColor: stats.IncidentRecordsExist ? 'bg-red-50' : 'bg-gray-50',
      borderColor: stats.IncidentRecordsExist ? 'border-red-200' : 'border-gray-200'
    },
    {
      title: 'Total Safe Employees',
      value: stats.EmployeeRecordsExist ? `${stats.employeesVerified}/${stats.totalEmployees}` : 'N/A',
      subValues: stats.EmployeeRecordsExist ? [
        { label: 'Employees verified:', value: stats.employeesVerified.toString() },
        { label: 'Employees failed verification:', value: '0' }
      ] : [
        { label: 'Employees verified:', value: '—' },
        { label: 'Employees failed verification:', value: '—' }
      ],
      icon: Users,
      color: stats.EmployeeRecordsExist ? 'text-green-600' : 'text-gray-500',
      bgColor: stats.EmployeeRecordsExist ? 'bg-green-50' : 'bg-gray-50',
      borderColor: stats.EmployeeRecordsExist ? 'border-green-200' : 'border-gray-200'
    },
    {
      title: 'Active Assessments',
      value: stats.AssessmentRecordsExist ? stats.activeAssessments : 'N/A',
      subValues: stats.AssessmentRecordsExist ? [
        { label: 'New:', value: '1' },
        { label: 'Submitted:', value: '0' }
      ] : [
        { label: 'New:', value: '—' },
        { label: 'Submitted:', value: '—' }
      ],
      icon: FileCheck,
      color: stats.AssessmentRecordsExist ? 'text-blue-600' : 'text-gray-500',
      bgColor: stats.AssessmentRecordsExist ? 'bg-blue-50' : 'bg-gray-50',
      borderColor: stats.AssessmentRecordsExist ? 'border-blue-200' : 'border-gray-200'
    },
    {
      title: 'Number Of Open Grievances',
      value: stats.FormSubmissionRecordsExist ? '0' : 'N/A',
      subValues: stats.FormSubmissionRecordsExist ? [
        { label: 'Last 30 days:', value: '0' },
        { label: 'Last 60 days:', value: '0' }
      ] : [
        { label: 'Last 30 days:', value: '—' },
        { label: 'Last 60 days:', value: '—' }
      ],
      icon: Calendar,
      color: stats.FormSubmissionRecordsExist ? 'text-orange-600' : 'text-gray-500',
      bgColor: stats.FormSubmissionRecordsExist ? 'bg-orange-50' : 'bg-gray-50',
      borderColor: stats.FormSubmissionRecordsExist ? 'border-orange-200' : 'border-gray-200'
    },
    {
      title: 'Total Safety Vehicles',
      value: stats.VehicleRecordsExist ? `${stats.vehiclesVerified || 0}/${stats.totalVehicles}` : 'N/A',
      subValues: stats.VehicleRecordsExist ? [
        { label: 'Vehicles verified:', value: (stats.vehiclesVerified || 0).toString() },
        { label: 'Vehicles with issues:', value: '0' }
      ] : [
        { label: 'Vehicles verified:', value: '—' },
        { label: 'Vehicles with issues:', value: '—' }
      ],
      icon: Truck,
      color: stats.VehicleRecordsExist ? 'text-purple-600' : 'text-gray-500',
      bgColor: stats.VehicleRecordsExist ? 'bg-purple-50' : 'bg-gray-50',
      borderColor: stats.VehicleRecordsExist ? 'border-purple-200' : 'border-gray-200'
    },
    {
      title: 'Number of Students Involved',
      value: stats.IncidentRecordsExist ? '0' : 'N/A',
      icon: TrendingUp,
      color: stats.IncidentRecordsExist ? 'text-indigo-600' : 'text-gray-500',
      bgColor: stats.IncidentRecordsExist ? 'bg-indigo-50' : 'bg-gray-50',
      borderColor: stats.IncidentRecordsExist ? 'border-indigo-200' : 'border-gray-200'
    }
  ];
  console.log(statsCards,"statsCardsx");
  

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
              <div className={`text-3xl font-bold ${card.color} mb-2`}>
                {card.value}
              </div>
              {card.subValues && (
                <div className="space-y-1">
                  {card.subValues.map((subValue, subIndex) => (
                    <p key={subIndex} className="text-sm text-gray-600">
                      <span className="font-bold">{subValue.label}</span>
                      <span className={`ml-1 ${card.value === 'N/A' ? 'text-gray-500' : ''}`}>
                        {subValue.value}
                      </span>
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStatsCards;
