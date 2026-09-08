import React, { useCallback, useMemo, useState } from 'react';
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
  AlertCircle,
  LucideIcon,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { incidentDataService } from '@/services/incident/incidentDataService';
import { IncidentRecord } from '@/services/incidentService';
import StudentsInvolvedTable from '@/components/incidents/StudentsInvolvedTable';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { isEmployeeSuperAdmin } from '@/store/employeeSelectors';
import { useModuleEnabled, useHasAnyDashboardModule } from '@/hooks/useModuleAccess';

type PersonInvolved = { name?: string; role?: string; notes?: string };

interface StatsCard {
  title: string;
  value: React.ReactNode;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  gradient: string;
  cardType: string;
  // trend
  trend?: number;
  // incident breakdown
  showBreakdown?: boolean;
  totalIncident?: number;
  openIncidents?: number;
  closedIncidents?: number;
  reopenedIncidents?: number;
  // employee breakdown
  showEmployeeBreakdown?: boolean;
  totalEmployees?: number;
  verifiedEmployees?: number;
  failedEmployees?: number;
  pendingEmployees?: number;
  toBeVerified?: number;
  // assessment breakdown
  showAssessmentBreakdown?: boolean;
  activeAssessments?: number;
  overdueAssessments?: number;
  newAssessments?: number;
  draftAssessments?: number;
  submittedAssessments?: number;
  completedAssessments?: number;
  // custom forms / grievances breakdown
  showCustomFormsBreakdown?: boolean;
  formSumitcount?: number;
  totalCustomForms?: number;
  formSubmissions30Days?: number;
  formSubmissions60Days?: number;
  formSubmissions90Days?: number;
  // vehicle verification breakdown
  showVehicleVerificationBreakdown?: boolean;
  totalVehicles?: number;
  vehiclesToBeVerified?: number;
  vehiclesFailedVerification?: number;
  vehiclesVerified?: number;
  totalPendingChallanAmount?: number;
  // vehicle status breakdown
  showVehicleBreakdown?: boolean;
  activeVehicles?: number;
  inactiveVehicles?: number;
  maintenanceVehicles?: number;
  // students breakdown
  showStudentsBreakdown?: boolean;
  studentsInvolvedByCategory?: Array<{ category: string; count: number }>;
  // status indicators
  priority?: string;
  status?: string;
  direction?: string;
  performance?: string;
}

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
    employeesPending?:number;
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
  const { state: employeeState } = useEmployeeStore();
  const { user, employeeData: authEmployeeData } = useAuth();
  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false);
  const [studentsDialogLoading, setStudentsDialogLoading] = useState(false);
  const [studentsDialogIncidents, setStudentsDialogIncidents] = useState<IncidentRecord[]>([]);

  const hasIncidentAdmin = useMemo(() => {
    const isSuperAdmin = isEmployeeSuperAdmin(employeeState);
    if (isSuperAdmin) return true;
    const incidentsModule = employeeState.configuredModules?.find(
      (module) => module.name.toLowerCase() === 'incidents'
    );
    return incidentsModule?.accessLevel?.is_admin === true;
  }, [employeeState]);

  // Hides dashboard cards for modules the employee doesn't have access to, not just
  // show them with 'N/A' — except when the employee has no real module at all (only
  // Dashboard, or nothing), where every card shows its N/A placeholder instead of the
  // whole section disappearing.
  const isModuleEnabled = useModuleEnabled();
  const hasAnyDashboardModule = useHasAnyDashboardModule();

  const loadStudentsInvolvedIncidents = useCallback(async () => {
    const clientId = employeeState.employeeData?.clientId || authEmployeeData?.clientId || user?.clientId;
    const employeeDataForFiltering = employeeState.employeeData || authEmployeeData;

    if (!clientId || !employeeDataForFiltering?.id) {
      setStudentsDialogIncidents([]);
      return;
    }

    setStudentsDialogLoading(true);
    try {
      const response = await incidentDataService.fetchIncidentsForClientWithFilters(
        clientId,
        false,
        employeeDataForFiltering,
        hasIncidentAdmin,
        { page: 1, pageSize: 10 },
        { status: 'Open' },
        true
      );

      const studentIncidents = response.data.filter((incident: IncidentRecord) => {
        const people: PersonInvolved[] | undefined =
          incident?.peopleInvolved ??
          (incident as IncidentRecord & { people_involved?: PersonInvolved[] })?.people_involved;
        return (
          Array.isArray(people) &&
          people.some((p: PersonInvolved) => (p?.role || '').toLowerCase() === 'student')
        );
      });

      setStudentsDialogIncidents(studentIncidents);
    } catch (error) {
      console.error('Failed to load students involved incidents:', error);
      setStudentsDialogIncidents([]);
    } finally {
      setStudentsDialogLoading(false);
    }
  }, [employeeState.employeeData, authEmployeeData, user?.clientId, hasIncidentAdmin]);

  // Module a card's click-through depends on — "students_involved" is an incident
  // breakdown, so it follows Incidents too. Cards for a disabled module render as
  // N/A/empty and must not navigate anywhere when clicked.
  const cardModule: Record<string, string> = {
    open_incidents: 'incidents',
    students_involved: 'incidents',
    safe_employees: 'employee verification',
    active_assessments: 'assessments',
    open_grievances: 'grievances',
    safety_vehicles: 'transport safety',
  };

  const handleCardClick = (cardType: string) => {
    if (!isModuleEnabled(cardModule[cardType])) return;

    if (cardType === 'students_involved') {
      setStudentsDialogOpen(true);
      loadStudentsInvolvedIncidents();
      return;
    }

    const baseUrl = window.location.origin;
    let targetUrl = '';
    
    switch (cardType) {
      case 'open_incidents':
        targetUrl = `${baseUrl}/incidents?filter=open`;
        break;
      case 'safe_employees':
        targetUrl = `${baseUrl}/employee-verification?filter=verified`;
        break;
      case 'active_assessments':
        targetUrl = `${baseUrl}/assessments?filter=active`;
        break;
      case 'open_grievances':
        targetUrl = `${baseUrl}/forms?filter=open`;
        break;
      case 'safety_vehicles':
        targetUrl = `${baseUrl}/transport-safety?filter=expired`;
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

  // Treat a module the employee doesn't have access to the same as "no data" —
  // the card stays visible but falls back to its existing empty ('N/A' / "No X data
  // available") rendering below, rather than leaking real client-wide numbers.
  const gatedStats = {
    ...stats,
    IncidentRecordsExist: stats.IncidentRecordsExist && isModuleEnabled('incidents'),
    EmployeeRecordsExist: stats.EmployeeRecordsExist && isModuleEnabled('employee verification'),
    AssessmentRecordsExist: stats.AssessmentRecordsExist && isModuleEnabled('assessments'),
    FormSubmissionRecordsExist: stats.FormSubmissionRecordsExist && isModuleEnabled('grievances'),
    VehicleRecordsExist: stats.VehicleRecordsExist && isModuleEnabled('transport safety'),
  };

  const statsCards: StatsCard[] = [
    {
      title: 'Total Number of Open Incidents',
      value: gatedStats.IncidentRecordsExist ? (<span className="flex items-end gap-1">
          <span className="text-3xl font-bold">
            {gatedStats.openIncidents || 0}
          </span>
        </span>) : 'N/A',
      description: gatedStats.IncidentRecordsExist ? 'Incident Overview' : 'No incident data available',
      icon: BarChart3,
      color: gatedStats.IncidentRecordsExist ? 'text-blue-600' : 'text-gray-500',
      bgColor: gatedStats.IncidentRecordsExist ? 'bg-blue-50' : 'bg-gray-50',
      gradient: gatedStats.IncidentRecordsExist ? 'from-blue-50 to-blue-100' : 'from-gray-50 to-gray-100',
      showBreakdown: gatedStats.IncidentRecordsExist,
      totalIncident: gatedStats.totalIncidents ? (gatedStats.totalIncidents || 0) : 0,
      openIncidents: gatedStats.IncidentRecordsExist ? (gatedStats.openIncidents || 0) : 0,
      closedIncidents: gatedStats.IncidentRecordsExist ? (gatedStats.closedIncidents || 0) : 0,
      reopenedIncidents: gatedStats.IncidentRecordsExist ? (gatedStats.reopenedIncidents || 0) : 0,
      cardType: 'open_incidents'
    },
    {
      title: 'Total Safe Employees',
      value: gatedStats.EmployeeRecordsExist ? (
        <span className="flex items-end gap-1">
          <span className="text-3xl font-bold">
            {gatedStats.employeesVerified || 0}
          </span>
          <span className="text-sm pb-1 text-muted-foreground">
            Verified
          </span>
        </span>
      ) : 'N/A',
      description: gatedStats.EmployeeRecordsExist ? 'Employee verification status' : 'No employee data available',
      icon: ShieldCheck,
      color: gatedStats.EmployeeRecordsExist ? 'text-blue-600' : 'text-gray-500',
      bgColor: gatedStats.EmployeeRecordsExist ? 'bg-blue-50' : 'bg-gray-50',
      gradient: gatedStats.EmployeeRecordsExist ? 'from-blue-50 to-blue-100' : 'from-gray-50 to-gray-100',
      showEmployeeBreakdown: gatedStats.EmployeeRecordsExist,
      totalEmployees: gatedStats.EmployeeRecordsExist ? (gatedStats.totalEmployees || 0) : 0,
      verifiedEmployees: gatedStats.EmployeeRecordsExist ? (gatedStats.employeesVerified || 0) : 0,
      failedEmployees: gatedStats.EmployeeRecordsExist ? (gatedStats.employeesFailed || 0) : 0,
      pendingEmployees: gatedStats.EmployeeRecordsExist ? (gatedStats.employeesPending || 0) : 0,
      toBeVerified: gatedStats.EmployeeRecordsExist ? (gatedStats.employeesVerified || 0) : 0,
      cardType: 'safe_employees'
    },
    {
      title: 'Active Assessments',
      value: gatedStats.AssessmentRecordsExist ?  (<span className="flex items-end gap-1">
          <span className="text-3xl font-bold">
            {gatedStats.activeAssessments || 0}
          </span>
          <span className="text-sm pb-1 text-muted-foreground">
            Active
          </span>
        </span>) : 'N/A',
      description: gatedStats.AssessmentRecordsExist 
        ? `${gatedStats.overdueAssessments || 0} Assessments overdue`
        : 'No assessment data available',
      icon: FileCheck,
      color: gatedStats.AssessmentRecordsExist ? 'text-purple-600' : 'text-gray-500',
      bgColor: gatedStats.AssessmentRecordsExist ? 'bg-purple-50' : 'bg-gray-50',
      gradient: gatedStats.AssessmentRecordsExist ? 'from-purple-50 to-purple-100' : 'from-gray-50 to-gray-100',
      showAssessmentBreakdown: gatedStats.AssessmentRecordsExist,
      activeAssessments: gatedStats.AssessmentRecordsExist ? (gatedStats.activeAssessments || 0) : 0,
      overdueAssessments: gatedStats.AssessmentRecordsExist ? (gatedStats.overdueAssessments || 0) : 0,
      newAssessments: gatedStats.AssessmentRecordsExist ? (gatedStats.newAssessments || 0) : 0,
      draftAssessments: gatedStats.AssessmentRecordsExist ? (gatedStats.draftAssessments || 0) : 0,
      submittedAssessments: gatedStats.AssessmentRecordsExist ? (gatedStats.submittedAssessments || 0) : 0,
      completedAssessments:gatedStats.AssessmentRecordsExist ? (gatedStats.completedAssessments || 0) : 0, // Don't show completed in active assessments breakdown
      cardType: 'active_assessments'
    },
    {
      title: 'Number Of Open Grievances',
      value: gatedStats.FormSubmissionRecordsExist ? (<span className="flex items-end gap-1">
          <span className="text-3xl font-bold">
            {gatedStats.totalUnacknowledged || 0}
          </span>
          <span className="text-sm pb-1 text-muted-foreground">
            Pending
          </span>
        </span>) : 'N/A',
      description: gatedStats.FormSubmissionRecordsExist ? 'Grievances overview' : 'No grievance data available',
      icon: FileCheck,
      color: gatedStats.FormSubmissionRecordsExist ? 'text-purple-600' : 'text-gray-500',
      bgColor: gatedStats.FormSubmissionRecordsExist ? 'bg-purple-50' : 'bg-gray-50',
      gradient: gatedStats.FormSubmissionRecordsExist ? 'from-purple-50 to-purple-100' : 'from-gray-50 to-gray-100',
      showCustomFormsBreakdown: gatedStats.FormSubmissionRecordsExist,
      formSumitcount: gatedStats.FormSubmissionRecordsExist ? (gatedStats.formAknowledged || 0) : 0,
      totalCustomForms: gatedStats.FormSubmissionRecordsExist ? (gatedStats.formSubmissions30Days || 0) : 0,
      formSubmissions30Days: gatedStats.FormSubmissionRecordsExist ? (gatedStats.formSubmissions30Days || 0) : 0,
      formSubmissions60Days: gatedStats.FormSubmissionRecordsExist ? (gatedStats.formSubmissions60Days || 0) : 0,
      formSubmissions90Days: gatedStats.FormSubmissionRecordsExist ? (gatedStats.formSubmissions90Days || 0) : 0,
      cardType: 'open_grievances'
    },
    {
      title: 'Total Safety Vehicles',
      value: gatedStats.VehicleRecordsExist ?  (<span className="flex items-end gap-1">
          <span className="text-3xl font-bold">
            {gatedStats.vehiclesFailedVerification || 0}
          </span>
          <span className="text-sm pb-1 text-muted-foreground">
            Non-Compliant
          </span>
        </span>) : 'N/A',
      description: gatedStats.VehicleRecordsExist ? 'Vehicle verification status' : 'No vehicle data available',
      icon: Truck,
      color: gatedStats.VehicleRecordsExist ? 'text-blue-600' : 'text-gray-500',
      bgColor: gatedStats.VehicleRecordsExist ? 'bg-blue-50' : 'bg-gray-50',
      gradient: gatedStats.VehicleRecordsExist ? 'from-blue-50 to-blue-100' : 'from-gray-50 to-gray-100',
      showVehicleVerificationBreakdown: gatedStats.VehicleRecordsExist,
      totalVehicles: gatedStats.VehicleRecordsExist ? (gatedStats.totalVehicles || 0) : 0,
      vehiclesToBeVerified: gatedStats.VehicleRecordsExist ? (gatedStats.vehiclesToBeVerified || 0) : 0,
      vehiclesFailedVerification: gatedStats.VehicleRecordsExist ? (gatedStats.vehiclesFailedVerification || 0) : 0,
      totalPendingChallanAmount: gatedStats.VehicleRecordsExist ? (gatedStats.totalPendingChallanAmount || 0): 0,
      vehiclesVerified: gatedStats.VehicleRecordsExist ? (gatedStats.vehiclesVerified || 0) : 0,
      cardType: 'safety_vehicles'
    },
    {
      title: 'Number of Students Involved',
      value: gatedStats.IncidentRecordsExist ? (gatedStats.studentsInvolved || 0) : 'N/A',
      description: gatedStats.IncidentRecordsExist ? 'Students involved in incidents' : 'No incident data available',
      icon: Users,
      color: gatedStats.IncidentRecordsExist ? 'text-orange-600' : 'text-gray-500',
      bgColor: gatedStats.IncidentRecordsExist ? 'bg-orange-50' : 'bg-gray-50',
      gradient: gatedStats.IncidentRecordsExist ? 'from-orange-50 to-orange-100' : 'from-gray-50 to-gray-100',
      showStudentsBreakdown: gatedStats.IncidentRecordsExist,
      studentsInvolvedByCategory: gatedStats.IncidentRecordsExist ? (gatedStats.studentsInvolvedByCategory || []) : [],
      cardType: 'students_involved'
    }
  ];

  // Only show a card for a module the employee actually has access to — unless they
  // have no real module at all, in which case show every card as its N/A placeholder
  // rather than leaving the page blank.
  const visibleStatsCards = hasAnyDashboardModule
    ? statsCards.filter((card) => isModuleEnabled(cardModule[card.cardType]))
    : statsCards;

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: visibleStatsCards.length || 6 }).map((_, index) => (
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
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {visibleStatsCards.map((card, index) => {
          const Icon = card.icon;
          const isClickable = isModuleEnabled(cardModule[card.cardType]);
          return (
            <Card
              key={index}
              className={`bg-gradient-to-br ${card.gradient} border-l-4 border-primary transition-all duration-300 ${
                isClickable ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer' : 'cursor-default'
              }`}
              onClick={() => handleCardClick(card.cardType)}
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
                  {card.trend !== undefined && (
                    <span className={`text-sm ${card.trend <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {card.trend >= 0 ? '+' : ''}{card.trend.toFixed(1)}%
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  {card.description}
                </p>

              {/* Show breakdown for Total Number of Open Incidents card */}
              {card.showBreakdown && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-600 font-medium">Total Incidents:</span>
                    <span className="font-semibold text-blue-600 ">{card.totalIncident}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-red-600 font-medium">Closed Incidents:</span>
                    <span className="font-semibold text-red-600">{card.closedIncidents}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-orange-600 font-medium">Reopened Incidents:</span>
                    <span className="font-semibold text-orange-600">{card.reopenedIncidents}</span>
                  </div>
                </div>
              )}

              {/* Show N/A breakdown when no incident data exists */}
              {!card.showBreakdown && card.value === 'N/A' && card.title === 'Total Number of Open Incidents' && (
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

              {card.showEmployeeBreakdown && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-600 font-medium">Total Employees:</span>
                    <span className="font-semibold text-blue-600">{card.totalEmployees}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-orange-600 font-medium">Pending verifications:</span>
                    <span className="font-semibold text-orange-600">{card.pendingEmployees}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-red-600 font-medium">Employees failed verification:</span>
                    <span className="font-semibold text-red-600">{card.failedEmployees}</span>
                  </div>
                </div>
              )}

              {/* Show N/A breakdown for employees when no data exists */}
              {!card.showEmployeeBreakdown && card.value === 'N/A' && card.title === 'Total Safe Employees' && (
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

                    {card.showVehicleVerificationBreakdown && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-blue-600 font-medium">Total Vehicles:</span>
                          <span className="font-semibold text-blue-600">{card.totalVehicles}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-600 font-medium">Compliant:</span>
                          <span className="font-semibold text-green-600">{card.vehiclesVerified}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-orange-600 font-medium">Pending Challan Amount:</span>
                          <span className="font-medium text-orange-600">    ₹{card.totalPendingChallanAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {/* Show N/A breakdown for vehicles when no data exists */}
                    {!card.showVehicleVerificationBreakdown && card.value === 'N/A' && card.title === 'Total Safety Vehicles' && (
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

                    {card.showVehicleBreakdown && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-600 font-medium">Active:</span>
                          <span className="font-semibold text-green-600">{card.activeVehicles}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-red-600 font-medium">Inactive:</span>
                          <span className="font-semibold text-red-600">{card.inactiveVehicles}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-yellow-600 font-medium">Maintenance:</span>
                          <span className="font-semibold text-yellow-600">{card.maintenanceVehicles}</span>
                        </div>
                      </div>
                    )}

                    {card.showCustomFormsBreakdown && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-600 font-medium">Acknowledged:</span>
                          <span className="font-semibold text-green-600">{card.formSumitcount}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 font-medium">Last 30 days:</span>
                          <span className="font-semibold text-gray-600">{card.formSubmissions30Days}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-blue-600 font-medium">Last 60 days:</span>
                          <span className="font-semibold text-blue-600">{card.formSubmissions60Days}</span>
                        </div>
                      </div>
                    )}

                    {/* Show N/A breakdown for grievances when no data exists */}
                    {!card.showCustomFormsBreakdown && card.value === 'N/A' && card.title === 'Number Of Open Grievances' && (
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

                    {card.showAssessmentBreakdown && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-red-600 font-medium">New:</span>
                          <span className="font-semibold text-red-600">{card.newAssessments}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-red-600 font-medium">Overdue:</span>
                          <span className="font-semibold text-red-600">{card.overdueAssessments}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 font-medium">Draft:</span>
                          <span className="font-semibold text-gray-600">{card.draftAssessments}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-orange-600 font-medium">Submitted:</span>
                          <span className="font-semibold text-orange-600">{card.submittedAssessments}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-600 font-medium">Completed:</span>
                          <span className="font-semibold text-green-600">{card.completedAssessments}</span>
                        </div>
                      </div>
                    )}

                    {/* Show N/A breakdown for assessments when no data exists */}
                    {!card.showAssessmentBreakdown && card.value === 'N/A' && card.title === 'Active Assessments' && (
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

                    {card.showStudentsBreakdown && (
                      <div className="space-y-2">
                        {card.studentsInvolvedByCategory.map((item: { category: string; count: number }, index: number) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-orange-600 font-medium">{item.category}:</span>
                            <span className="font-semibold text-orange-600">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show N/A breakdown for students when no data exists */}
                    {!card.showStudentsBreakdown && card.value === 'N/A' && card.title === 'Number of Students Involved' && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium">No categories available:</span>
                          <span className="font-semibold text-gray-500">—</span>
                        </div>
                      </div>
                    )}

              {/* Status indicators */}
                {card.priority && (
                  <div className="text-xs">
                    <span className={`font-medium ${card.color}`}>{card.priority}</span>
                  </div>
                )}

                {card.status && (
                  <div className="text-xs">
                    <span className={`font-medium ${card.color}`}>{card.status}</span>
                  </div>
                )}


                {card.direction && (
                  <div className="text-xs">
                    <span className={`font-medium ${card.color}`}>{card.direction}</span>
                  </div>
                )}

                {card.performance && (
                  <div className="text-xs">
                    <span className={`font-medium ${card.color}`}>{card.performance}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={studentsDialogOpen} onOpenChange={setStudentsDialogOpen}>
        <AlertDialogContent className="max-w-7xl max-h-[85vh] overflow-y-auto no-scrollbar">
          <AlertDialogHeader>
            <AlertDialogTitle>Students Involved</AlertDialogTitle>
          </AlertDialogHeader>
          <StudentsInvolvedTable incidents={studentsDialogIncidents} loading={studentsDialogLoading} />
          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              onClick={() => setStudentsDialogOpen(false)}
            >
              Close
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EnhancedStatsCards;