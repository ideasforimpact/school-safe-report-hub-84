import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  FileCheck, 
  Users, 
  Truck, 
  TrendingUp, 
  TrendingDown,
  Clock,
  ShieldCheck,
  BarChart3,
  AlertCircle
} from 'lucide-react';

interface EnhancedStatsCardsProps {
  stats: {
    openIncidents: number;
    activeAssessments: number;
    totalEmployees: number;
    employeesVerified: number;
    totalVehicles: number;
    vehiclesWithDocuments: number;
    incidentsLastMonth: number;
    incidentsLast6Months: number;
    monthlyIncidentsData: Array<{
      month: string;
      open: number;
      closed: number;
      total: number;
    }>;
  };
  loading: boolean;
}

const EnhancedStatsCards = ({ stats, loading }: EnhancedStatsCardsProps) => {
  // Calculate trend indicators
  const currentMonthIncidents = stats.monthlyIncidentsData?.[stats.monthlyIncidentsData.length - 1]?.total || 0;
  const previousMonthIncidents = stats.monthlyIncidentsData?.[stats.monthlyIncidentsData.length - 2]?.total || 0;
  const incidentTrend = previousMonthIncidents > 0 
    ? ((currentMonthIncidents - previousMonthIncidents) / previousMonthIncidents) * 100 
    : 0;

  // Calculate percentages
  const employeeVerificationPercentage = stats.totalEmployees > 0 
    ? Math.round((stats.employeesVerified / stats.totalEmployees) * 100) 
    : 0;

  const vehicleDocumentationPercentage = stats.totalVehicles > 0 
    ? Math.round((stats.vehiclesWithDocuments / stats.totalVehicles) * 100) 
    : 0;

  // Calculate average response time (mock calculation for demo)
  const avgResponseTime = stats.openIncidents > 0 ? Math.round(24 + Math.random() * 48) : 12;

  // Calculate safety score based on multiple factors
  const safetyScore = Math.round(
    (employeeVerificationPercentage * 0.4) + 
    (vehicleDocumentationPercentage * 0.3) + 
    ((stats.openIncidents <= 5 ? 100 - (stats.openIncidents * 10) : 50) * 0.3)
  );

  const statsCards = [
    {
      title: 'Open Incidents',
      value: stats.openIncidents,
      description: `${stats.openIncidents} incidents require attention`,
      icon: AlertTriangle,
      color: stats.openIncidents > 5 ? 'text-red-600' : stats.openIncidents > 2 ? 'text-orange-600' : 'text-green-600',
      bgColor: stats.openIncidents > 5 ? 'bg-red-50' : stats.openIncidents > 2 ? 'bg-orange-50' : 'bg-green-50',
      gradient: stats.openIncidents > 5 ? 'from-red-50 to-red-100' : stats.openIncidents > 2 ? 'from-orange-50 to-orange-100' : 'from-green-50 to-green-100',
      trend: incidentTrend,
      priority: stats.openIncidents > 5 ? 'High Priority' : stats.openIncidents > 2 ? 'Medium Priority' : 'Low Priority'
    },
    {
      title: 'Employee Safety Score',
      value: `${safetyScore}%`,
      description: `${stats.employeesVerified}/${stats.totalEmployees} employees verified`,
      icon: ShieldCheck,
      color: safetyScore >= 90 ? 'text-green-600' : safetyScore >= 70 ? 'text-yellow-600' : 'text-red-600',
      bgColor: safetyScore >= 90 ? 'bg-green-50' : safetyScore >= 70 ? 'bg-yellow-50' : 'bg-red-50',
      gradient: safetyScore >= 90 ? 'from-green-50 to-green-100' : safetyScore >= 70 ? 'from-yellow-50 to-yellow-100' : 'from-red-50 to-red-100',
      percentage: employeeVerificationPercentage,
      status: safetyScore >= 90 ? 'Excellent' : safetyScore >= 70 ? 'Good' : 'Needs Attention'
    },
    {
      title: 'Incident Trends',
      value: currentMonthIncidents,
      description: `${incidentTrend >= 0 ? '+' : ''}${incidentTrend.toFixed(1)}% vs last month`,
      icon: incidentTrend >= 0 ? TrendingUp : TrendingDown,
      color: incidentTrend <= 0 ? 'text-green-600' : incidentTrend <= 10 ? 'text-yellow-600' : 'text-red-600',
      bgColor: incidentTrend <= 0 ? 'bg-green-50' : incidentTrend <= 10 ? 'bg-yellow-50' : 'bg-red-50',
      gradient: incidentTrend <= 0 ? 'from-green-50 to-green-100' : incidentTrend <= 10 ? 'from-yellow-50 to-yellow-100' : 'from-red-50 to-red-100',
      trend: incidentTrend,
      direction: incidentTrend <= 0 ? 'Improving' : 'Increasing'
    },
    {
      title: 'Assessment Status',
      value: stats.activeAssessments,
      description: `${stats.activeAssessments} active safety assessments`,
      icon: FileCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      gradient: 'from-blue-50 to-blue-100',
      status: stats.activeAssessments > 0 ? 'In Progress' : 'Up to Date'
    },
    {
      title: 'Transport Safety',
      value: `${vehicleDocumentationPercentage}%`,
      description: `${stats.vehiclesWithDocuments}/${stats.totalVehicles} vehicles compliant`,
      icon: Truck,
      color: vehicleDocumentationPercentage >= 90 ? 'text-green-600' : vehicleDocumentationPercentage >= 70 ? 'text-yellow-600' : 'text-red-600',
      bgColor: vehicleDocumentationPercentage >= 90 ? 'bg-green-50' : vehicleDocumentationPercentage >= 70 ? 'bg-yellow-50' : 'bg-red-50',
      gradient: vehicleDocumentationPercentage >= 90 ? 'from-green-50 to-green-100' : vehicleDocumentationPercentage >= 70 ? 'from-yellow-50 to-yellow-100' : 'from-red-50 to-red-100',
      percentage: vehicleDocumentationPercentage,
      status: vehicleDocumentationPercentage >= 90 ? 'Compliant' : vehicleDocumentationPercentage >= 70 ? 'Mostly Compliant' : 'Non-Compliant'
    },
    {
      title: 'Response Time',
      value: `${avgResponseTime}h`,
      description: `Average incident response time`,
      icon: Clock,
      color: avgResponseTime <= 24 ? 'text-green-600' : avgResponseTime <= 48 ? 'text-yellow-600' : 'text-red-600',
      bgColor: avgResponseTime <= 24 ? 'bg-green-50' : avgResponseTime <= 48 ? 'bg-yellow-50' : 'bg-red-50',
      gradient: avgResponseTime <= 24 ? 'from-green-50 to-green-100' : avgResponseTime <= 48 ? 'from-yellow-50 to-yellow-100' : 'from-red-50 to-red-100',
      target: '< 24h',
      performance: avgResponseTime <= 24 ? 'On Target' : avgResponseTime <= 48 ? 'Acceptable' : 'Needs Improvement'
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
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
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
          <Card key={index} className={`bg-gradient-to-br ${card.gradient} border-l-4 border-primary hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor} shadow-sm`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${card.color} mb-2 flex items-center space-x-2`}>
                <span>{card.value}</span>
                {card.trend !== undefined && (
                  <span className={`text-sm ${card.trend <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {card.trend >= 0 ? '+' : ''}{card.trend.toFixed(1)}%
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-3">
                {card.description}
              </p>

              {/* Progress bar for percentage-based metrics */}
              {card.percentage !== undefined && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      card.percentage >= 90 ? 'bg-green-500' : 
                      card.percentage >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${card.percentage}%` }}
                  ></div>
                </div>
              )}

              {/* Status indicators */}
              {card.status && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Status:</span>
                  <span className={`font-medium ${card.color}`}>{card.status}</span>
                </div>
              )}

              {card.priority && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Priority:</span>
                  <span className={`font-medium ${card.color}`}>{card.priority}</span>
                </div>
              )}

              {card.direction && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Trend:</span>
                  <span className={`font-medium ${card.color}`}>{card.direction}</span>
                </div>
              )}

              {card.performance && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Performance:</span>
                  <span className={`font-medium ${card.color}`}>{card.performance}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default EnhancedStatsCards;