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

export interface PriorityDistribution {
  priorities: Array<{
    name: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  totalIncidents: number;
}

export interface CategoryBreakdown {
  categories: Array<{
    name: string;
    count: number;
    resolvedCount: number;
    percentage: number;
  }>;
  totalIncidents: number;
}

export interface StatusOverview {
  statuses: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  totalIncidents: number;
}

export interface TopContributors {
  contributors: Array<{
    name: string;
    count: number;
    type: 'reporter' | 'assignee';
  }>;
  totalReports: number;
}

export interface MonthlyTrendsArea {
  monthlyData: Array<{
    month: string;
    incidents: number;
    closed: number;
    open: number;
  }>;
  totalIncidents: number;
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
            priority:incident_priorities(name, color),
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

  // Calculate priority distribution
  const priorityDistribution = useMemo((): PriorityDistribution => {
    const priorityCount: Record<string, { count: number; color: string }> = {};
    
    incidents.forEach(incident => {
      const priorityName = incident.priority?.name || 'No Priority';
      const priorityColor = incident.priority?.color || '#9b87f5';
      
      if (!priorityCount[priorityName]) {
        priorityCount[priorityName] = { count: 0, color: priorityColor };
      }
      priorityCount[priorityName].count++;
    });

    const priorities = Object.entries(priorityCount)
      .map(([name, { count, color }]) => ({
        name,
        count,
        color,
        percentage: incidents.length > 0 ? (count / incidents.length) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    return {
      priorities,
      totalIncidents: incidents.length
    };
  }, [incidents]);

  // Calculate category breakdown
  const categoryBreakdown = useMemo((): CategoryBreakdown => {
    const categoryStats: Record<string, { count: number; resolvedCount: number }> = {};
    
    incidents.forEach(incident => {
      const categoryName = incident.category?.name || 'Unknown Category';
      const isResolved = incident.status?.name === 'Resolved' || incident.status?.name === 'Closed';
      
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = { count: 0, resolvedCount: 0 };
      }
      
      categoryStats[categoryName].count++;
      if (isResolved) {
        categoryStats[categoryName].resolvedCount++;
      }
    });

    const categories = Object.entries(categoryStats)
      .map(([name, { count, resolvedCount }]) => ({
        name,
        count,
        resolvedCount,
        percentage: incidents.length > 0 ? (count / incidents.length) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    return {
      categories,
      totalIncidents: incidents.length
    };
  }, [incidents]);

  // Calculate status overview
  const statusOverview = useMemo((): StatusOverview => {
    const statusCount: Record<string, number> = {};
    
    incidents.forEach(incident => {
      const statusName = incident.status?.name || 'Unknown Status';
      statusCount[statusName] = (statusCount[statusName] || 0) + 1;
    });

    const statuses = Object.entries(statusCount)
      .map(([name, count]) => ({
        name,
        count,
        percentage: incidents.length > 0 ? (count / incidents.length) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    return {
      statuses,
      totalIncidents: incidents.length
    };
  }, [incidents]);

  // Calculate top contributors
  const topContributors = useMemo((): TopContributors => {
    const reporterCount: Record<string, number> = {};
    const assigneeCount: Record<string, number> = {};
    
    incidents.forEach(incident => {
      // Count reporters
      const reporterName = incident.created_by_user 
        ? `${incident.created_by_user.first_name} ${incident.created_by_user.last_name}`
        : 'Unknown Reporter';
      reporterCount[reporterName] = (reporterCount[reporterName] || 0) + 1;
      
      // Count assignees
      if (incident.assigned_to_user) {
        const assigneeName = `${incident.assigned_to_user.first_name} ${incident.assigned_to_user.last_name}`;
        assigneeCount[assigneeName] = (assigneeCount[assigneeName] || 0) + 1;
      }
    });

    const topReporters = Object.entries(reporterCount)
      .map(([name, count]) => ({ name, count, type: 'reporter' as const }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const topAssignees = Object.entries(assigneeCount)
      .map(([name, count]) => ({ name, count, type: 'assignee' as const }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const contributors = [...topReporters, ...topAssignees];

    return {
      contributors,
      totalReports: incidents.length
    };
  }, [incidents]);

  // Calculate monthly trends area data
  const monthlyTrendsArea = useMemo((): MonthlyTrendsArea => {
    const monthlyData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      const monthIncidents = incidents.filter(incident => {
        const incidentDate = new Date(incident.created_at);
        return incidentDate.getMonth() === date.getMonth() && 
               incidentDate.getFullYear() === date.getFullYear();
      });

      const closedIncidents = monthIncidents.filter(incident => 
        incident.status?.name === 'Resolved' || incident.status?.name === 'Closed'
      );
      
      const openIncidents = monthIncidents.filter(incident => 
        incident.status?.name !== 'Resolved' && incident.status?.name !== 'Closed'
      );

      monthlyData.push({
        month: monthLabel,
        incidents: monthIncidents.length,
        closed: closedIncidents.length,
        open: openIncidents.length
      });
    }

    return {
      monthlyData,
      totalIncidents: incidents.length
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
    priorityDistribution,
    categoryBreakdown,
    statusOverview,
    topContributors,
    monthlyTrendsArea,
    isLoading,
    onFilterApply
  };
};