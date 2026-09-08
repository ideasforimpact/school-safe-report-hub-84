
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { isModuleAdmin } from '@/store/employeeSelectors';

interface DashboardStats {
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
  totalPendingChallanAmount?: number;
  monthlyIncidentsData: Array<{
    month: string;
    open: number;
    closed: number;
    total: number;
  }>;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    openIncidents: 0,
    openIncidentOlder7days: 0,
    studentsInvolved: 0,
    studentsInvolvedByCategory: [],
    activeAssessments: 0,
    totalEmployees: 0,
    employeesVerified: 0,
    employeesFailed: 0,
    totalVehicles: 0,
    vehiclesVerified: 0,
    activeVehicles: 0,
    maintenanceVehicles: 0,
    inactiveVehicles: 0,
    incidentsLastMonth: 0,
    incidentsLast6Months: 0,
    totalAssessments: 0,
    newAssessments: 0,
    completedAssessments: 0,
    draftAssessments: 0,
    closedIncidents: 0,
    reopenedIncidents: 0,
    overdueAssessments: 0,
    submittedAssessments: 0,
    totalCustomForms: 0,
    formSubmissions30Days: 0,
    formSubmissions60Days: 0,
    formSubmissions90Days: 0,
    totalUnacknowledged: 0,
    vehiclesToBeVerified: 0,
    vehiclesFailedVerification: 0,
    vehiclesWithDocuments: 0,
    totalPendingChallanAmount: 0,
    monthlyIncidentsData: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, employeeData } = useAuth();
  const { state } = useEmployeeStore();
  // Redux's activeClientId/clientId reflect a super admin's switched client (see
  // HeaderClientSwitcher); employeeData/user only ever hold the home client, so
  // using them alone left the dashboard showing home-client stats after a switch
  // while other modules (e.g. Employee Verification) correctly followed the switch.
  const clientId = state.activeClientId || state.clientId || employeeData?.clientId || user?.clientId;
  const hasIncidentAdmin = isModuleAdmin(state, 'incidents');
  const hasAssessmentAdmin = isModuleAdmin(state, 'assessments');
  const hasTransportSafetyAdmin = isModuleAdmin(state, 'transport safety');
  const hasEmployeeVerificationAdmin = isModuleAdmin(state, 'employee verification');
  const hasGrievanceAdmin = isModuleAdmin(state, 'grievances');
  // Keyed on the admin flags too — configuredModules can finish loading slightly after
  // clientId (both resolve async post-login), so a re-run once the real admin flags are
  // in must still be allowed to fetch, not be skipped as "already fetched for this client".
  const fetchedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchKey = `${clientId}:${hasIncidentAdmin}:${hasAssessmentAdmin}:${hasTransportSafetyAdmin}:${hasEmployeeVerificationAdmin}:${hasGrievanceAdmin}`;
    const fetchStats = async () => {
      if (!clientId) return;
      if (fetchedKeyRef.current === fetchKey) return;
      fetchedKeyRef.current = fetchKey;

      try {
        setLoading(true);
        setError(null);

        console.log('Fetching dashboard stats for client:', clientId);

        // Prepare request body with employee information for role-based filtering.
        // Module-level Admin (not just org-wide super admin) unlocks full client-wide
        // visibility for that module's card — matches how each module's own page scopes
        // its data (see useIncidentPermissions / useAssessmentAccess / the transport-safety
        // and employee-verification access hooks).
        const requestBody = {
          client_id: clientId,
          employee_id: employeeData?.id || null,
          is_super_admin: employeeData?.isSuperAdmin || false,
          has_incident_admin: hasIncidentAdmin,
          has_assessment_admin: hasAssessmentAdmin,
          has_transport_safety_admin: hasTransportSafetyAdmin,
          has_employee_verification_admin: hasEmployeeVerificationAdmin,
          has_grievance_admin: hasGrievanceAdmin,
        };

        console.log('Dashboard stats request:', requestBody);

        const { data, error } = await supabase.functions.invoke('dashboard-stats', {
          body: requestBody
        });

        if (error) {
          throw error;
        }

        console.log('Dashboard stats received:', data);
        setStats(data);

      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [clientId, employeeData?.id, employeeData?.isSuperAdmin, hasIncidentAdmin, hasAssessmentAdmin, hasTransportSafetyAdmin, hasEmployeeVerificationAdmin, hasGrievanceAdmin]);

  return {
    stats,
    loading,
    error
  };
};
