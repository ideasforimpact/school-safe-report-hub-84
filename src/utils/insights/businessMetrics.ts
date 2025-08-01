interface IncidentRecord {
  id: string;
  ticket_id: string;
  type: string;
  category: string;
  description?: string;
  date: string;
  location: string;
  status: string;
  priority: string;
  reportedBy: string;
  owner?: string;
  facility?: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyTrendMetrics {
  currentMonth: {
    count: number;
    month: string;
  };
  previousMonth: {
    count: number;
    month: string;
  };
  percentageChange: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface FacilityRiskMetrics {
  topFacilities: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  totalFacilities: number;
  mostProblematic: string;
}

export interface ReportTypeMetrics {
  distribution: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  mostCommon: string;
  totalReports: number;
}

export interface AssignmentMetrics {
  employeesWithMostOpen: Array<{
    name: string;
    openCount: number;
    totalAssigned: number;
  }>;
  selfAssignmentRatio: number;
  totalOpenIncidents: number;
  averageOpenPerEmployee: number;
}

export const calculateMonthlyTrends = (incidents: IncidentRecord[]): MonthlyTrendMetrics => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
  const currentMonthIncidents = incidents.filter(incident => {
    const incidentDate = new Date(incident.date);
    return incidentDate.getMonth() === currentMonth && incidentDate.getFullYear() === currentYear;
  });
  
  const previousMonthIncidents = incidents.filter(incident => {
    const incidentDate = new Date(incident.date);
    return incidentDate.getMonth() === previousMonth && incidentDate.getFullYear() === previousYear;
  });
  
  const currentCount = currentMonthIncidents.length;
  const previousCount = previousMonthIncidents.length;
  
  const percentageChange = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0;
  
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (percentageChange > 5) trend = 'increasing';
  else if (percentageChange < -5) trend = 'decreasing';
  
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
};

export const calculateFacilityRisks = (incidents: IncidentRecord[]): FacilityRiskMetrics => {
  const facilityMap = new Map<string, number>();
  
  incidents.forEach(incident => {
    const facility = incident.facility || 'Unknown';
    facilityMap.set(facility, (facilityMap.get(facility) || 0) + 1);
  });
  
  const totalIncidents = incidents.length;
  const topFacilities = Array.from(facilityMap.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: (count / totalIncidents) * 100
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  return {
    topFacilities,
    totalFacilities: facilityMap.size,
    mostProblematic: topFacilities[0]?.name || 'None'
  };
};

export const calculateReportTypeDistribution = (incidents: IncidentRecord[]): ReportTypeMetrics => {
  const typeMap = new Map<string, number>();
  
  incidents.forEach(incident => {
    const type = incident.type || 'Unknown';
    typeMap.set(type, (typeMap.get(type) || 0) + 1);
  });
  
  const totalReports = incidents.length;
  const distribution = Array.from(typeMap.entries())
    .map(([type, count]) => ({
      type,
      count,
      percentage: (count / totalReports) * 100
    }))
    .sort((a, b) => b.count - a.count);
  
  return {
    distribution,
    mostCommon: distribution[0]?.type || 'None',
    totalReports
  };
};

export const calculateAssignmentWorkload = (incidents: IncidentRecord[]): AssignmentMetrics => {
  const openIncidents = incidents.filter(incident => 
    incident.status.toLowerCase().includes('open') || 
    incident.status.toLowerCase().includes('new') ||
    incident.status.toLowerCase().includes('pending')
  );
  
  const employeeMap = new Map<string, { open: number, total: number }>();
  let selfAssignments = 0;
  
  incidents.forEach(incident => {
    const assignee = incident.owner || 'Unassigned';
    const reporter = incident.reportedBy;
    
    if (!employeeMap.has(assignee)) {
      employeeMap.set(assignee, { open: 0, total: 0 });
    }
    
    const employee = employeeMap.get(assignee)!;
    employee.total += 1;
    
    if (openIncidents.some(open => open.id === incident.id)) {
      employee.open += 1;
    }
    
    if (assignee === reporter) {
      selfAssignments += 1;
    }
  });
  
  const employeesWithMostOpen = Array.from(employeeMap.entries())
    .map(([name, stats]) => ({
      name,
      openCount: stats.open,
      totalAssigned: stats.total
    }))
    .filter(emp => emp.name !== 'Unassigned')
    .sort((a, b) => b.openCount - a.openCount)
    .slice(0, 5);
  
  const selfAssignmentRatio = incidents.length > 0 ? (selfAssignments / incidents.length) * 100 : 0;
  const averageOpenPerEmployee = employeeMap.size > 0 ? openIncidents.length / employeeMap.size : 0;
  
  return {
    employeesWithMostOpen,
    selfAssignmentRatio,
    totalOpenIncidents: openIncidents.length,
    averageOpenPerEmployee
  };
};