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
import { useNavigate } from 'react-router-dom';

interface EnhancedStatsCardsProps {
  stats: {
    totalIncidents:number;
    formAknowledged:number;
    openIncidents: number;
    openIncidentOlder7days?: number;
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
    totalUnacknowledged?: number;
    vehiclesToBeVerified?: number;
    vehiclesFailedVerification?: number;
    vehiclesWithDocuments?: number;
    totalPendingChallanAmount: number;
    monthlyIncidentsData: Array<{
      month: string;
      open: number;
      closed: number;
      total: number;
    }>;
    // Add existence checks
    IncidentRecordsExist: boolean;
    AssessmentRecordsExist: boolean;
    VehicleRecordsExist: boolean;
    EmployeeRecordsExist: boolean;
    FormSubmissionRecordsExist: boolean;
  };
  loading: boolean;
}

const EnhancedStatsCards = ({ stats, loading }: EnhancedStatsCardsProps) => {
  const navigate = useNavigate();

  const handleCardClick = (cardType: string) => {
    const baseUrl = window.location.origin;
    let targetUrl = '';
    
    switch (cardType) {
      case 'open_incidents':
        targetUrl = `${baseUrl}/incidents?filter=open`;
        break;
      case 'safe_employees':
        targetUrl = `${baseUrl}/employee-verification?filter=pending`;
        break;
      case 'active_assessments':
        targetUrl = `${baseUrl}/assessments?filter=new`;
        break;
      case 'open_grievances':
        targetUrl = `${baseUrl}/forms?filter=open`;
        break;
      case 'safety_vehicles':
        targetUrl = `${baseUrl}/transport-safety?filter=expired`;
        break;
      case 'students_involved':
        targetUrl = `${baseUrl}/incidents?filter=students_involved`;
        break;
      default:
        return;
    }
    
    // Open in new tab
    window.open(targetUrl, '_blank');
  };

  console.log('🔍 EnhancedStatsCards - Raw stats received at:', new Date().toISOString(), stats);
  console.log('🔍 EnhancedStatsCards - Key values:');
  console.log('  - stats.totalEmployees:', stats.totalEmployees);
  console.log('  - stats.employeesVerified:', stats.employeesVerified);
  console.log('  - stats.totalVehicles:', stats.totalVehicles);
  console.log('  - stats.vehiclesVerified:', stats.vehiclesVerified);
  console.log('  - stats.totalUnacknowledged:', stats.totalUnacknowledged);

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
      value: stats.IncidentRecordsExist ? (<span className="flex items-end gap-1">
          <span className="text-3xl font-bold">
            {stats.openIncidents || 0}
          </span>
        </span>) : 'N/A',
      description: stats.IncidentRecordsExist ? 'Incident Overview' : 'No incident data available',
      icon: BarChart3,
      color: stats.IncidentRecordsExist ? 'text-blue-600' : 'text-gray-500',
      bgColor: stats.IncidentRecordsExist ? 'bg-blue-50' : 'bg-gray-50',
      gradient: stats.IncidentRecordsExist ? 'from-blue-50 to-blue-100' : 'from-gray-50 to-gray-100',
      showBreakdown: stats.IncidentRecordsExist,
      totalIncident: stats.totalIncidents ? (stats.totalIncidents || 0) : 0,
      openIncidents: stats.IncidentRecordsExist ? (stats.openIncidents || 0) : 0,
      closedIncidents: stats.IncidentRecordsExist ? (stats.closedIncidents || 0) : 0,
      reopenedIncidents: stats.IncidentRecordsExist ? (stats.reopenedIncidents || 0) : 0,
      cardType: 'open_incidents'
    },
    {
      title: 'Total Safe Employees',
      value: stats.EmployeeRecordsExist ? (
        <span className="flex items-end gap-1">
          <span className="text-3xl font-bold">
            {stats.employeesVerified || 0}
          </span>
          <span className="text-sm pb-1 text-muted-foreground">
            Verified
          </span>
        </span>
      ) : 'N/A',
      description: stats.EmployeeRecordsExist ? 'Employee verification status' : 'No employee data available',
      icon: ShieldCheck,
      color: stats.EmployeeRecordsExist ? 'text-blue-600' : 'text-gray-500',
      bgColor: stats.EmployeeRecordsExist ? 'bg-blue-50' : 'bg-gray-50',
      gradient: stats.EmployeeRecordsExist ? 'from-blue-50 to-blue-100' : 'from-gray-50 to-gray-100',
      showEmployeeBreakdown: stats.EmployeeRecordsExist,
      totalEmployees: stats.EmployeeRecordsExist ? (stats.totalEmployees || 0) : 0,
      verifiedEmployees: stats.EmployeeRecordsExist ? (stats.employeesVerified || 0) : 0,
      failedEmployees: stats.EmployeeRecordsExist ? (stats.employeesFailed || 0) : 0,
      toBeVerified: stats.EmployeeRecordsExist ? (stats.employeesVerified || 0) : 0,
      cardType: 'safe_employees'
    },
    {
      title: 'Active Assessments',
      value: stats.AssessmentRecordsExist ?  (<span className="flex items-end gap-1">
          <span className="text-3xl font-bold">
            {stats.activeAssessments || 0}
          </span>
          <span className="text-sm pb-1 text-muted-foreground">
            Active
          </span>
        </span>) : 'N/A',
      description: stats.AssessmentRecordsExist 
        ? `${stats.overdueAssessments || 0} Assessments overdue`
        : 'No assessment data available',
      icon: FileCheck,
      color: stats.AssessmentRecordsExist ? 'text-purple-600' : 'text-gray-500',
      bgColor: stats.AssessmentRecordsExist ? 'bg-purple-50' : 'bg-gray-50',
      gradient: stats.AssessmentRecordsExist ? 'from-purple-50 to-purple-100' : 'from-gray-50 to-gray-100',
      showAssessmentBreakdown: stats.AssessmentRecordsExist,
      activeAssessments: stats.AssessmentRecordsExist ? (stats.activeAssessments || 0) : 0,
      overdueAssessments: stats.AssessmentRecordsExist ? (stats.overdueAssessments || 0) : 0,
      newAssessments: stats.AssessmentRecordsExist ? (stats.newAssessments || 0) : 0,
      draftAssessments: stats.AssessmentRecordsExist ? (stats.draftAssessments || 0) : 0,
      submittedAssessments: stats.AssessmentRecordsExist ? (stats.submittedAssessments || 0) : 0,
      completedAssessments:stats.AssessmentRecordsExist ? (stats.completedAssessments || 0) : 0, // Don't show completed in active assessments breakdown
      cardType: 'active_assessments'
    },
    {
      title: 'Number Of Open Grievances',
      value: stats.FormSubmissionRecordsExist ? (<span className="flex items-end gap-1">
          <span className="text-3xl font-bold">
            {stats.totalUnacknowledged || 0}
          </span>
          <span className="text-sm pb-1 text-muted-foreground">
            Pending
          </span>
        </span>) : 'N/A',
      description: stats.FormSubmissionRecordsExist ? 'Grievances overview' : 'No grievance data available',
      icon: FileCheck,
      color: stats.FormSubmissionRecordsExist ? 'text-purple-600' : 'text-gray-500',
      bgColor: stats.FormSubmissionRecordsExist ? 'bg-purple-50' : 'bg-gray-50',
      gradient: stats.FormSubmissionRecordsExist ? 'from-purple-50 to-purple-100' : 'from-gray-50 to-gray-100',
      showCustomFormsBreakdown: stats.FormSubmissionRecordsExist,
      formSumitcount: stats.FormSubmissionRecordsExist ? (stats.formAknowledged || 0) : 0,
      totalCustomForms: stats.FormSubmissionRecordsExist ? (stats.formSubmissions30Days || 0) : 0,
      formSubmissions30Days: stats.FormSubmissionRecordsExist ? (stats.formSubmissions30Days || 0) : 0,
      formSubmissions60Days: stats.FormSubmissionRecordsExist ? (stats.formSubmissions60Days || 0) : 0,
      formSubmissions90Days: stats.FormSubmissionRecordsExist ? (stats.formSubmissions90Days || 0) : 0,
      cardType: 'open_grievances'
    },
    {
      title: 'Total Safety Vehicles',
      value: stats.VehicleRecordsExist ?  (<span className="flex items-end gap-1">
          <span className="text-3xl font-bold">
            {stats.vehiclesFailedVerification || 0}
          </span>
          <span className="text-sm pb-1 text-muted-foreground">
            Non-Compliant
          </span>
        </span>) : 'N/A',
      description: stats.VehicleRecordsExist ? 'Vehicle verification status' : 'No vehicle data available',
      icon: Truck,
      color: stats.VehicleRecordsExist ? 'text-blue-600' : 'text-gray-500',
      bgColor: stats.VehicleRecordsExist ? 'bg-blue-50' : 'bg-gray-50',
      gradient: stats.VehicleRecordsExist ? 'from-blue-50 to-blue-100' : 'from-gray-50 to-gray-100',
      showVehicleVerificationBreakdown: stats.VehicleRecordsExist,
      totalVehicles: stats.VehicleRecordsExist ? (stats.totalVehicles || 0) : 0,
      vehiclesToBeVerified: stats.VehicleRecordsExist ? (stats.vehiclesToBeVerified || 0) : 0,
      vehiclesFailedVerification: stats.VehicleRecordsExist ? (stats.vehiclesFailedVerification || 0) : 0,
      totalPendingChallanAmount: stats.VehicleRecordsExist ? (stats.totalPendingChallanAmount || 0): 0,
      vehiclesVerified: stats.VehicleRecordsExist ? (stats.vehiclesVerified || 0) : 0,
      cardType: 'safety_vehicles'
    },
    {
      title: 'Number of Students Involved',
      value: stats.IncidentRecordsExist ? (stats.studentsInvolved || 0) : 'N/A',
      description: stats.IncidentRecordsExist ? 'Students involved in incidents' : 'No incident data available',
      icon: Users,
      color: stats.IncidentRecordsExist ? 'text-orange-600' : 'text-gray-500',
      bgColor: stats.IncidentRecordsExist ? 'bg-orange-50' : 'bg-gray-50',
      gradient: stats.IncidentRecordsExist ? 'from-orange-50 to-orange-100' : 'from-gray-50 to-gray-100',
      showStudentsBreakdown: stats.IncidentRecordsExist,
      studentsInvolvedByCategory: stats.IncidentRecordsExist ? (stats.studentsInvolvedByCategory || []) : [],
      cardType: 'students_involved'
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
          <Card 
            key={index} 
            className={`bg-gradient-to-br ${card.gradient} border-l-4 border-primary hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
            onClick={() => handleCardClick((card as any).cardType)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor} shadow-sm`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`font-bold ${card.color} mb-2 flex items-center space-x-2`}>
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
                    <span className="text-blue-600 font-medium">Total Incidents:</span>
                    <span className="font-semibold text-blue-600 ">{(card as any).totalIncident}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-red-600 font-medium">Closed Incidents:</span>
                    <span className="font-semibold text-red-600">{(card as any).closedIncidents}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-orange-600 font-medium">Reopened Incidents:</span>
                    <span className="font-semibold text-orange-600">{(card as any).reopenedIncidents}</span>
                  </div>
                </div>
              )}

              {/* Show N/A breakdown when no incident data exists */}
              {!(card as any).showBreakdown && card.value === 'N/A' && card.title === 'Total Number of Open Incidents' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Closed Incidents:</span>
                    <span className="font-semibold text-gray-500">—</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Reopened Incidents:</span>
                    <span className="font-semibold text-gray-500">—</span>
                  </div>
                </div>
              )}

              {(card as any).showEmployeeBreakdown && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-600 font-medium">Total Employees:</span>
                    <span className="font-semibold text-blue-600">{(card as any).totalEmployees}</span>
                  </div>
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

              {/* Show N/A breakdown for employees when no data exists */}
              {!(card as any).showEmployeeBreakdown && card.value === 'N/A' && card.title === 'Total Safe Employees' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Employees verified:</span>
                    <span className="font-semibold text-gray-500">—</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Employees failed verification:</span>
                    <span className="font-semibold text-gray-500">—</span>
                  </div>
                </div>
              )}

                    {(card as any).showVehicleVerificationBreakdown && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-blue-600 font-medium">Total Vehicles:</span>
                          <span className="font-semibold text-blue-600">{(card as any).totalVehicles}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-600 font-medium">Compliant:</span>
                          <span className="font-semibold text-green-600">{(card as any).vehiclesVerified}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-orange-600 font-medium">Pending Challan Amount:</span>
                          <span className="font-medium text-orange-600">    ₹{(card as any).totalPendingChallanAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {/* Show N/A breakdown for vehicles when no data exists */}
                    {!(card as any).showVehicleVerificationBreakdown && card.value === 'N/A' && card.title === 'Total Safety Vehicles' && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium">Vehicles verified:</span>
                          <span className="font-semibold text-gray-500">—</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium">Vehicles with issues:</span>
                          <span className="font-semibold text-gray-500">—</span>
                        </div>
                         <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium">Total Pending Challan:</span>
                          <span className="font-medium text-orange-500">—</span>
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
                          <span className="text-green-600 font-medium">Acknowledged:</span>
                          <span className="font-semibold text-green-600">{(card as any).formSumitcount}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 font-medium">Last 30 days:</span>
                          <span className="font-semibold text-gray-600">{(card as any).formSubmissions30Days}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-blue-600 font-medium">Last 60 days:</span>
                          <span className="font-semibold text-blue-600">{(card as any).formSubmissions60Days}</span>
                        </div>
                      </div>
                    )}

                    {/* Show N/A breakdown for grievances when no data exists */}
                    {!(card as any).showCustomFormsBreakdown && card.value === 'N/A' && card.title === 'Number Of Open Grievances' && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium">Last 30 days:</span>
                          <span className="font-semibold text-gray-500">—</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium">Last 60 days:</span>
                          <span className="font-semibold text-gray-500">—</span>
                        </div>
                      </div>
                    )}

                    {(card as any).showAssessmentBreakdown && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-red-600 font-medium">Overdue:</span>
                          <span className="font-semibold text-red-600">{(card as any).overdueAssessments}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 font-medium">Draft:</span>
                          <span className="font-semibold text-gray-600">{(card as any).draftAssessments}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-orange-600 font-medium">Submitted:</span>
                          <span className="font-semibold text-orange-600">{(card as any).submittedAssessments}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-600 font-medium">Completed:</span>
                          <span className="font-semibold text-green-600">{(card as any).completedAssessments}</span>
                        </div>
                      </div>
                    )}

                    {/* Show N/A breakdown for assessments when no data exists */}
                    {!(card as any).showAssessmentBreakdown && card.value === 'N/A' && card.title === 'Active Assessments' && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium">New:</span>
                          <span className="font-semibold text-gray-500">—</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium">Submitted:</span>
                          <span className="font-semibold text-gray-500">—</span>
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

                    {/* Show N/A breakdown for students when no data exists */}
                    {!(card as any).showStudentsBreakdown && card.value === 'N/A' && card.title === 'Number of Students Involved' && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium">No categories available:</span>
                          <span className="font-semibold text-gray-500">—</span>
                        </div>
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