import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { useEmployeeStore } from '@/store/EmployeeContext';

export interface MonthlyTrends {
  currentMonth: {
    count: number;
    month: string;
  };
  previousMonth: {
    count: number;
    month: string;
  };
  percentageChange: number;
  trend: 'increase' | 'decrease' | 'stable';
}

export interface FacilityRisk {
  topFacilities: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  totalIncidents: number;
}

export interface ReportTypeDistribution {
  types: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  totalIncidents: number;
}

export interface AssignmentWorkload {
  topAssignees: Array<{
    name: string;
    openCount: number;
    selfAssigned: number;
    assignedByOthers: number;
    totalAssigned: number;
  }>;
  totalOpenIncidents: number;
  selfAssignmentRate: number;
}

export const useNewInsightsData = () => {
  const { state: employeeState } = useEmployeeStore();
  const { user, employeeData: authEmployeeData } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get client ID from employee data
  const clientId = employeeState.clientId || authEmployeeData?.clientId;

  // Fetch incidents data
  useEffect(() => {
    const fetchData = async () => {
      if (!clientId) return;

      try {
        setIsLoading(true);

        // Fetch incidents with joins for better data
        const { data: incidentsData, error } = await supabase
          .from('incidents')
          .select(`
            *,
            facility:facilities(name),
            category:incident_categories(name),
            subcategory:incident_subcategories(name),
            type:incident_report_types(name),
            status:incident_status(name),
            assigned_to_user:employees!incidents_assigned_to_fkey(first_name, last_name),
            created_by_user:employees!incidents_created_by_fkey(first_name, last_name)
          `)
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setIncidents(incidentsData || []);
      } catch (error) {
        console.error('Error fetching incidents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [clientId]);

  // Calculate monthly trends
  const monthlyTrends = useMemo((): MonthlyTrends => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthIncidents = incidents.filter(incident => {
      const incidentDate = new Date(incident.created_at);
      return incidentDate.getMonth() === currentMonth && incidentDate.getFullYear() === currentYear;
    });

    const previousMonthIncidents = incidents.filter(incident => {
      const incidentDate = new Date(incident.created_at);
      return incidentDate.getMonth() === previousMonth && incidentDate.getFullYear() === previousYear;
    });

    const currentCount = currentMonthIncidents.length;
    const previousCount = previousMonthIncidents.length;
    
    const percentageChange = previousCount > 0 
      ? ((currentCount - previousCount) / previousCount) * 100 
      : currentCount > 0 ? 100 : 0;

    let trend: 'increase' | 'decrease' | 'stable' = 'stable';
    if (percentageChange > 5) trend = 'increase';
    else if (percentageChange < -5) trend = 'decrease';

    return {
      currentMonth: {
        count: currentCount,
        month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      },
      previousMonth: {
        count: previousCount,
        month: new Date(previousYear, previousMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      },
      percentageChange,
      trend
    };
  }, [incidents]);

  // Calculate facility risk
  const facilityRisk = useMemo((): FacilityRisk => {
    const facilityCount: Record<string, number> = {};
    
    incidents.forEach(incident => {
      const facilityName = incident.facility?.name || 'Unknown Facility';
      facilityCount[facilityName] = (facilityCount[facilityName] || 0) + 1;
    });

    const topFacilities = Object.entries(facilityCount)
      .map(([name, count]) => ({
        name,
        count,
        percentage: incidents.length > 0 ? (count / incidents.length) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      topFacilities,
      totalIncidents: incidents.length
    };
  }, [incidents]);

  // Calculate report type distribution
  const reportTypeDistribution = useMemo((): ReportTypeDistribution => {
    const typeCount: Record<string, number> = {};
    
    incidents.forEach(incident => {
      const typeName = incident.type?.name || 'Unknown Type';
      typeCount[typeName] = (typeCount[typeName] || 0) + 1;
    });

    const types = Object.entries(typeCount)
      .map(([name, count]) => ({
        name,
        count,
        percentage: incidents.length > 0 ? (count / incidents.length) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    return {
      types,
      totalIncidents: incidents.length
    };
  }, [incidents]);

  // Calculate assignment workload
  const assignmentWorkload = useMemo((): AssignmentWorkload => {
    const openIncidents = incidents.filter(incident => 
      incident.status?.name !== 'Resolved' && incident.status?.name !== 'Closed'
    );

    const assigneeStats: Record<string, {
      openCount: number;
      selfAssigned: number;
      assignedByOthers: number;
      totalAssigned: number;
    }> = {};

    let totalSelfAssigned = 0;
    let totalAssigned = 0;

    incidents.forEach(incident => {
      const assignedToName = incident.assigned_to_user 
        ? `${incident.assigned_to_user.first_name} ${incident.assigned_to_user.last_name}`
        : null;
      
      const createdByName = incident.created_by_user 
        ? `${incident.created_by_user.first_name} ${incident.created_by_user.last_name}`
        : null;

      if (assignedToName) {
        if (!assigneeStats[assignedToName]) {
          assigneeStats[assignedToName] = {
            openCount: 0,
            selfAssigned: 0,
            assignedByOthers: 0,
            totalAssigned: 0
          };
        }

        assigneeStats[assignedToName].totalAssigned++;
        totalAssigned++;

        // Check if incident is still open
        if (incident.status?.name !== 'Resolved' && incident.status?.name !== 'Closed') {
          assigneeStats[assignedToName].openCount++;
        }

        // Check if self-assigned
        if (incident.assigned_to === incident.created_by) {
          assigneeStats[assignedToName].selfAssigned++;
          totalSelfAssigned++;
        } else {
          assigneeStats[assignedToName].assignedByOthers++;
        }
      }
    });

    const topAssignees = Object.entries(assigneeStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.openCount - a.openCount)
      .slice(0, 5);

    const selfAssignmentRate = totalAssigned > 0 ? (totalSelfAssigned / totalAssigned) * 100 : 0;

    return {
      topAssignees,
      totalOpenIncidents: openIncidents.length,
      selfAssignmentRate
    };
  }, [incidents]);

  // Filter application handler
  const onFilterApply = (filterType: string, value: string) => {
    // This could navigate to the main incidents page with filters applied
    // For now, just log the filter application
    console.log(`Applying filter: ${filterType} = ${value}`);
  };

  return {
    monthlyTrends,
    facilityRisk,
    reportTypeDistribution,
    assignmentWorkload,
    isLoading,
    onFilterApply
  };
};