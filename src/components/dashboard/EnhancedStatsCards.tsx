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
    studentsInvolved?: number;
    studentsInvolvedByCategory?: Array<{ category: string; count: number }>;
    activeAssessments: number;
    totalEmployees: number;
    employeesVerified: number;
    employeesFailed?: number;
    totalVehicles: number;
    vehiclesVerified?: number;
    activeVehicles: number;
    maintenanceVehicles: number;
    inactiveVehicles: number;
    incidentsLastMonth: number;
    incidentsLast6Months: number;
    totalAssessments: number;
    newAssessments: number;
    completedAssessments: number;
    draftAssessments: number;
    closedIncidents?: number;
    reopenedIncidents?: number;
    overdueAssessments?: number;
    submittedAssessments?: number;
    totalCustomForms?: number;
    formSubmissions30Days?: number;
    formSubmissions60Days?: number;
    formSubmissions90Days?: number;
    vehiclesToBeVerified?: number;
    vehiclesFailedVerification?: number;
    vehiclesWithDocuments?: number;
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
  console.log('🔍 EnhancedStatsCards - Raw stats received at:', new Date().toISOString(), stats);
  console.log('🔍 EnhancedStatsCards - Key values:');
  console.log('  - stats.totalEmployees:', stats.totalEmployees);
  console.log('  - stats.employeesVerified:', stats.employeesVerified);
  console.log('  - stats.totalVehicles:', stats.totalVehicles);
  console.log('  - stats.vehiclesVerified:', stats.vehiclesVerified);

  // Use provided incident data or calculate from monthly data as fallback
  const totalIncidents = (stats.openIncidents || 0) + (stats.closedIncidents || 0) + (stats.reopenedIncidents || 0);
  const closedIncidents = stats.closedIncidents || 0;
  
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



  // Calculate safety score based on multiple factors
  const safetyScore = Math.round(
    (employeeVerificationPercentage * 0.4) + 
    (vehicleDocumentationPercentage * 0.3) + 
    ((stats.openIncidents <= 5 ? 100 - (stats.openIncidents * 10) : 50) * 0.3)
  );

  const statsCards = [
    {
      title: 'Total Number of Open Incidents',
      value: stats.openIncidents || 0,
      description: 'Incident Overview',
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      gradient: 'from-blue-50 to-blue-100',
      showBreakdown: true,
      openIncidents: stats.openIncidents || 0,
      closedIncidents: stats.closedIncidents || 0,
      reopenedIncidents: stats.reopenedIncidents || 0
    },
    {
      title: 'Total Safe Employees',
      value: stats.totalEmployees || 0,
      description: 'Empolyee vetrification status',
      icon: ShieldCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      gradient: 'from-blue-50 to-blue-100',
      showEmployeeBreakdown: true,
      totalEmployees: stats.totalEmployees || 0,
      verifiedEmployees: stats.employeesVerified || 0,
      failedEmployees: stats.employeesFailed || 0,
      toBeVerified: stats.employeesVerified || 0
    },
    {
      title: 'Active Assessments',
      value: stats.activeAssessments || 0,
      description: `${stats.overdueAssessments || 0} Assessments overdue`,
      icon: FileCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      gradient: 'from-purple-50 to-purple-100',
      showAssessmentBreakdown: true,
      activeAssessments: stats.activeAssessments || 0,
      overdueAssessments: stats.overdueAssessments || 0,
      newAssessments: stats.newAssessments || 0,
      draftAssessments: stats.draftAssessments || 0,
      submittedAssessments: stats.submittedAssessments || 0,
      completedAssessments: 0 // Don't show completed in active assessments breakdown
    },
    {
      title: 'Number Of Grievances',
      value: stats.totalCustomForms || 0,
      description: 'Form submissions overview',
      icon: FileCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      gradient: 'from-purple-50 to-purple-100',
      showCustomFormsBreakdown: true,
      totalCustomForms: stats.totalCustomForms || 0,
      formSubmissions30Days: stats.formSubmissions30Days || 0,
      formSubmissions60Days: stats.formSubmissions60Days || 0,
      formSubmissions90Days: stats.formSubmissions90Days || 0
    },
    {
      title: 'Total Safety Vehicles',
      value: stats.totalVehicles || 0,
      description: 'Vehicle vetrification status',
      icon: Truck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      gradient: 'from-blue-50 to-blue-100',
      showVehicleVerificationBreakdown: true,
      totalVehicles: stats.totalVehicles || 0,
      vehiclesToBeVerified: stats.vehiclesToBeVerified || 0,
      vehiclesFailedVerification: stats.vehiclesFailedVerification || 0,
      vehiclesVerified: stats.vehiclesVerified || 0
    },
    {
      title: 'Number of Students Involved',
      value: stats.studentsInvolved || 0,
      description: 'Students involved in open incidents',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      gradient: 'from-orange-50 to-orange-100',
      showStudentsBreakdown: true,
      studentsInvolvedByCategory: stats.studentsInvolvedByCategory || []
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
                {(card as any).trend !== undefined && (
                  <span className={`text-sm ${(card as any).trend <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(card as any).trend >= 0 ? '+' : ''}{(card as any).trend.toFixed(1)}%
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-3">
                {card.description}
              </p>

              {/* Show breakdown for Total Number of Open Incidents card */}
              {(card as any).showBreakdown && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-red-600 font-medium">Closed Incidents:</span>
                    <span className="font-semibold text-red-600">{(card as any).closedIncidents}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-orange-600 font-medium">Reopened Incidens:</span>
                    <span className="font-semibold text-orange-600">{(card as any).reopenedIncidents}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-600 font-medium">Open Incidents:</span>
                    <span className="font-semibold text-green-600">{(card as any).openIncidents}</span>
                  </div>
                </div>
              )}

              {(card as any).showEmployeeBreakdown && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-600 font-medium">Employees verified:</span>
                    <span className="font-semibold text-green-600">{(card as any).verifiedEmployees}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-red-600 font-medium">Employees failed verification:</span>
                    <span className="font-semibold text-red-600">{(card as any).failedEmployees}</span>
                  </div>
                </div>
                                  )}

                    {(card as any).showVehicleVerificationBreakdown && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-600 font-medium">Vehicles verified:</span>
                          <span className="font-semibold text-green-600">{(card as any).vehiclesVerified}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-red-600 font-medium">Vehicles failed verification:</span>
                          <span className="font-semibold text-red-600">{(card as any).vehiclesFailedVerification}</span>
                        </div>
                      </div>
                    )}

                    {(card as any).showVehicleBreakdown && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-600 font-medium">Active:</span>
                          <span className="font-semibold text-green-600">{(card as any).activeVehicles}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-red-600 font-medium">Inactive:</span>
                          <span className="font-semibold text-red-600">{(card as any).inactiveVehicles}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-yellow-600 font-medium">Maintenance:</span>
                          <span className="font-semibold text-yellow-600">{(card as any).maintenanceVehicles}</span>
                        </div>
                      </div>
                    )}

                    {(card as any).showCustomFormsBreakdown && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 font-medium">Last 30 days:</span>
                          <span className="font-semibold text-gray-600">{(card as any).formSubmissions30Days}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-blue-600 font-medium">Last 60 days:</span>
                          <span className="font-semibold text-blue-600">{(card as any).formSubmissions60Days}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-purple-600 font-medium">Last 90 days:</span>
                          <span className="font-semibold text-purple-600">{(card as any).formSubmissions90Days}</span>
                        </div>
                      </div>
                    )}

                    {(card as any).showAssessmentBreakdown && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 font-medium">New:</span>
                          <span className="font-semibold text-gray-600">{(card as any).newAssessments}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-amber-600 font-medium">Draft:</span>
                          <span className="font-semibold text-amber-600">{(card as any).draftAssessments}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-blue-600 font-medium">Submitted:</span>
                          <span className="font-semibold text-blue-600">{(card as any).submittedAssessments}</span>
                        </div>
                      </div>
                    )}

                    {(card as any).showStudentsBreakdown && (
                      <div className="space-y-2">
                        {(card as any).studentsInvolvedByCategory.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-orange-600 font-medium">{item.category}:</span>
                            <span className="font-semibold text-orange-600">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    )}

              {/* Status indicators */}
              {(card as any).priority && (
                <div className="text-xs">
                  <span className={`font-medium ${card.color}`}>{(card as any).priority}</span>
                </div>
              )}

              {(card as any).status && (
                <div className="text-xs">
                  <span className={`font-medium ${card.color}`}>{(card as any).status}</span>
                </div>
              )}


              {(card as any).direction && (
                <div className="text-xs">
                  <span className={`font-medium ${card.color}`}>{(card as any).direction}</span>
                </div>
              )}

              {(card as any).performance && (
                <div className="text-xs">
                  <span className={`font-medium ${card.color}`}>{(card as any).performance}</span>
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