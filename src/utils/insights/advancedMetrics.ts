// Enhanced incident type that matches the transformed data from useInsightsData
export interface EnhancedIncident {
  id: string;
  ticketId: string;
  type: string;
  category: string;
  subcategory: string;
  description: string;
  date: Date;
  location: string;
  peopleInvolved: Array<{
    name: string;
    role: string;
    type: string;
  }>;
  status: string;
  reportedBy: { id: string; name: string };
  owner?: { id: string; name: string };
  facility: string;
  createdAt: Date;
  updatedAt: Date;
  priority: string;
}

export interface ResolutionMetrics {
  resolutionRate: number;
  averageResolutionTime: number;
  totalIncidents: number;
  resolvedIncidents: number;
  pendingIncidents: number;
  overdueIncidents: number;
  previousPeriodResolutionRate?: number;
  resolutionTrend: 'increasing' | 'decreasing' | 'stable';
  improvementTips: string[];
}

export interface ResponseMetrics {
  averageResponseTime: number;
  averageAssignmentTime: number;
  unassignedCount: number;
  slaCompliance: number;
  escalatedCount: number;
  peakResponseHours: Array<{ hour: number; count: number }>;
  responseEfficiencyScore: number;
}

export interface WorkloadMetrics {
  totalAssignees: number;
  averageWorkload: number;
  maxWorkload: number;
  workloadDistribution: Array<{
    assignee: string;
    count: number;
    percentage: number;
    efficiency: 'light' | 'balanced' | 'heavy' | 'overloaded';
  }>;
  teamBalance: 'balanced' | 'unbalanced';
  capacityUtilization: number;
}

export interface RiskMetrics {
  highRiskLocations: Array<{
    location: string;
    count: number;
    riskScore: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  criticalIncidents: number;
  recurrentIssues: Array<{
    category: string;
    location: string;
    count: number;
    frequency: string;
  }>;
  riskTrends: {
    weekOverWeek: number;
    monthOverMonth: number;
  };
  priorityDistribution: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
}

export function calculateResolutionMetrics(
  incidents: EnhancedIncident[], 
  previousPeriodIncidents?: EnhancedIncident[]
): ResolutionMetrics {
  // Broader status matching to catch actual data
  const resolvedStatuses = ['resolved', 'closed', 'completed', 'fixed', 'done', 'close'];
  
  const resolvedIncidents = incidents.filter(incident => {
    const status = incident.status?.toLowerCase() || '';
    return resolvedStatuses.some(s => status.includes(s));
  }).length;
  
  const pendingIncidents = incidents.length - resolvedIncidents;
  
  // Calculate average resolution time (in days) using actual incident dates
  const resolvedWithDates = incidents.filter(incident => {
    const status = incident.status?.toLowerCase() || '';
    return resolvedStatuses.some(s => status.includes(s)) && incident.date && incident.updatedAt;
  });
  
  const totalResolutionTime = resolvedWithDates.reduce((sum, incident) => {
    const created = new Date(incident.date);
    const resolved = new Date(incident.updatedAt);
    return sum + Math.abs(resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  }, 0);
  
  const averageResolutionTime = resolvedWithDates.length > 0 
    ? totalResolutionTime / resolvedWithDates.length 
    : 0;
  
  const resolutionRate = incidents.length > 0 ? (resolvedIncidents / incidents.length) * 100 : 0;
  
  // Calculate overdue incidents (open for more than 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const overdueIncidents = incidents.filter(incident => {
    const status = incident.status?.toLowerCase() || '';
    const isOpen = !resolvedStatuses.some(s => status.includes(s));
    const createdDate = new Date(incident.date);
    return isOpen && createdDate < sevenDaysAgo;
  }).length;
  
  // Calculate trend
  let resolutionTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  let previousPeriodResolutionRate: number | undefined;
  
  if (previousPeriodIncidents && previousPeriodIncidents.length > 0) {
    const prevResolved = previousPeriodIncidents.filter(incident => {
      const status = incident.status?.toLowerCase() || '';
      return resolvedStatuses.some(s => status.includes(s));
    }).length;
    previousPeriodResolutionRate = (prevResolved / previousPeriodIncidents.length) * 100;
    
    const difference = resolutionRate - previousPeriodResolutionRate;
    if (difference > 5) resolutionTrend = 'increasing';
    else if (difference < -5) resolutionTrend = 'decreasing';
  }

  // Generate improvement tips based on metrics
  const improvementTips: string[] = [];
  if (resolutionRate < 70) {
    improvementTips.push('Focus on resolving pending incidents to improve resolution rate');
  }
  if (averageResolutionTime > 5) {
    improvementTips.push('Consider streamlining resolution processes to reduce response time');
  }
  if (overdueIncidents > incidents.length * 0.2) {
    improvementTips.push('Address overdue incidents to prevent customer satisfaction issues');
  }
  
  return {
    resolutionRate,
    averageResolutionTime,
    totalIncidents: incidents.length,
    resolvedIncidents,
    pendingIncidents,
    overdueIncidents,
    previousPeriodResolutionRate,
    resolutionTrend,
    improvementTips
  };
}

export function calculateResponseMetrics(incidents: EnhancedIncident[]): ResponseMetrics {
  // Calculate average response time (creation to assignment)
  const assignedIncidents = incidents.filter(incident => incident.owner && incident.owner.name);
  
  const totalResponseTime = assignedIncidents.reduce((sum, incident) => {
    const created = new Date(incident.date);
    const updated = new Date(incident.updatedAt);
    return sum + Math.abs(updated.getTime() - created.getTime()) / (1000 * 60 * 60);
  }, 0);
  
  const averageResponseTime = assignedIncidents.length > 0 
    ? totalResponseTime / assignedIncidents.length 
    : 0;
  
  const unassignedCount = incidents.filter(incident => !incident.owner || !incident.owner.name).length;
  
  // Calculate SLA compliance with broader status matching
  const resolvedStatuses = ['resolved', 'closed', 'completed', 'fixed', 'done', 'close'];
  const resolvedIncidents = incidents.filter(incident => {
    const status = incident.status?.toLowerCase() || '';
    return resolvedStatuses.some(s => status.includes(s));
  });
  
  const slaCompliantIncidents = resolvedIncidents.filter(incident => {
    const created = new Date(incident.date);
    const resolved = new Date(incident.updatedAt);
    const hoursToResolve = Math.abs(resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
    
    // Dynamic SLA based on priority
    const priority = incident.priority?.toLowerCase() || 'medium';
    let slaHours = 72; // Default for medium/low
    if (priority.includes('critical') || priority.includes('high')) {
      slaHours = 24; // 24 hours for high/critical
    }
    
    return hoursToResolve <= slaHours;
  }).length;
  
  const slaCompliance = resolvedIncidents.length > 0 ? (slaCompliantIncidents / resolvedIncidents.length) * 100 : 0;
  
  // Count escalated incidents (high/critical priority) with case-insensitive matching
  const escalatedCount = incidents.filter(incident => {
    const priority = incident.priority?.toLowerCase() || '';
    return priority.includes('high') || priority.includes('critical') || priority.includes('urgent');
  }).length;

  // Calculate peak response hours
  const hourCounts: { [hour: number]: number } = {};
  incidents.forEach(incident => {
    const hour = new Date(incident.date).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const peakResponseHours = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Calculate response efficiency score (0-100)
  const responseEfficiencyScore = Math.min(100, 
    (slaCompliance * 0.4) + 
    ((unassignedCount === 0 ? 100 : Math.max(0, 100 - (unassignedCount / incidents.length) * 100)) * 0.3) +
    ((averageResponseTime <= 4 ? 100 : Math.max(0, 100 - (averageResponseTime - 4) * 10)) * 0.3)
  );
  
  return {
    averageResponseTime,
    averageAssignmentTime: averageResponseTime,
    unassignedCount,
    slaCompliance,
    escalatedCount,
    peakResponseHours,
    responseEfficiencyScore
  };
}

export function calculateWorkloadMetrics(incidents: EnhancedIncident[]): WorkloadMetrics {
  const assigneeCount: { [key: string]: number } = {};
  
  // Only count open/active incidents for current workload
  const activeIncidents = incidents.filter(incident => {
    const status = incident.status?.toLowerCase() || '';
    const resolvedStatuses = ['resolved', 'closed', 'completed', 'fixed', 'done', 'close'];
    return !resolvedStatuses.some(s => status.includes(s));
  });
  
  activeIncidents.forEach(incident => {
    if (incident.owner && incident.owner.name) {
      const assigneeName = incident.owner.name;
      assigneeCount[assigneeName] = (assigneeCount[assigneeName] || 0) + 1;
    }
  });
  
  const assignees = Object.keys(assigneeCount);
  const totalAssignees = Math.max(assignees.length, 1); // Avoid division by zero
  const workloadCounts = Object.values(assigneeCount);
  
  const averageWorkload = totalAssignees > 0 
    ? workloadCounts.reduce((sum, count) => sum + count, 0) / totalAssignees 
    : 0;
  
  const maxWorkload = workloadCounts.length > 0 ? Math.max(...workloadCounts) : 0;

  // Determine efficiency levels and team balance
  const getEfficiencyLevel = (count: number): 'light' | 'balanced' | 'heavy' | 'overloaded' => {
    if (count <= averageWorkload * 0.5) return 'light';
    if (count <= averageWorkload * 1.2) return 'balanced';
    if (count <= averageWorkload * 2) return 'heavy';
    return 'overloaded';
  };
  
  const workloadDistribution = Object.entries(assigneeCount)
    .map(([assignee, count]) => ({
      assignee,
      count,
      percentage: activeIncidents.length > 0 ? (count / activeIncidents.length) * 100 : 0,
      efficiency: getEfficiencyLevel(count)
    }))
    .sort((a, b) => b.count - a.count);

  // Team balance assessment
  const teamBalance: 'balanced' | 'unbalanced' = maxWorkload > averageWorkload * 2.5 ? 'unbalanced' : 'balanced';
  
  // Capacity utilization (percentage of active incidents assigned vs total active)
  const assignedActiveIncidents = activeIncidents.filter(incident => incident.owner && incident.owner.name).length;
  const capacityUtilization = activeIncidents.length > 0 ? (assignedActiveIncidents / activeIncidents.length) * 100 : 0;
  
  return {
    totalAssignees,
    averageWorkload,
    maxWorkload,
    workloadDistribution,
    teamBalance,
    capacityUtilization
  };
}

export function calculateRiskMetrics(incidents: EnhancedIncident[]): RiskMetrics {
  // High-risk locations analysis
  const locationCount: { [key: string]: number } = {};
  const recentIncidents = incidents.filter(incident => {
    const incidentDate = new Date(incident.date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return incidentDate >= thirtyDaysAgo;
  });

  incidents.forEach(incident => {
    if (incident.location) {
      locationCount[incident.location] = (locationCount[incident.location] || 0) + 1;
    }
  });
  
  const avgIncidentsPerLocation = Object.values(locationCount).length > 0
    ? Object.values(locationCount).reduce((sum, count) => sum + count, 0) / Object.values(locationCount).length
    : 1;
  
  const highRiskLocations = Object.entries(locationCount)
    .filter(([_, count]) => count > avgIncidentsPerLocation)
    .map(([location, count]) => ({
      location,
      count,
      riskScore: Math.round((count / avgIncidentsPerLocation) * 100) / 100,
      trend: 'stable' as 'increasing' | 'decreasing' | 'stable' // Simplified for now
    }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);
  
  // Critical incidents analysis with case-insensitive matching
  const criticalIncidents = incidents.filter(incident => {
    const priority = incident.priority?.toLowerCase() || '';
    return priority.includes('critical') || priority.includes('high') || priority.includes('urgent');
  }).length;
  
  // Priority distribution
  const priorityCount: { [key: string]: number } = {};
  incidents.forEach(incident => {
    if (incident.priority) {
      priorityCount[incident.priority] = (priorityCount[incident.priority] || 0) + 1;
    }
  });

  const priorityDistribution = Object.entries(priorityCount)
    .map(([priority, count]) => ({
      priority,
      count,
      percentage: incidents.length > 0 ? Math.round((count / incidents.length) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);
  
  // Recurrent issues with frequency analysis
  const issueKey: { [key: string]: { count: number; dates: Date[] } } = {};
  incidents.forEach(incident => {
    if (incident.category && incident.location) {
      const key = `${incident.category}-${incident.location}`;
      if (!issueKey[key]) {
        issueKey[key] = { count: 0, dates: [] };
      }
      issueKey[key].count += 1;
      issueKey[key].dates.push(new Date(incident.date));
    }
  });
  
  const getFrequency = (dates: Date[]): string => {
    if (dates.length < 2) return 'Isolated';
    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
    const totalDays = (sortedDates[sortedDates.length - 1].getTime() - sortedDates[0].getTime()) / (1000 * 60 * 60 * 24);
    const avgDaysBetween = totalDays / (dates.length - 1);
    
    if (avgDaysBetween <= 7) return 'Weekly';
    if (avgDaysBetween <= 30) return 'Monthly';
    return 'Sporadic';
  };

  const recurrentIssues = Object.entries(issueKey)
    .filter(([_, data]) => data.count >= 2)
    .map(([key, data]) => {
      const [category, location] = key.split('-');
      return { 
        category, 
        location, 
        count: data.count,
        frequency: getFrequency(data.dates)
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Risk trends (simplified calculations)
  const currentWeekIncidents = incidents.filter(incident => {
    const incidentDate = new Date(incident.date);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return incidentDate >= oneWeekAgo;
  }).length;

  const previousWeekIncidents = incidents.filter(incident => {
    const incidentDate = new Date(incident.date);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return incidentDate >= twoWeeksAgo && incidentDate < oneWeekAgo;
  }).length;

  const weekOverWeek = previousWeekIncidents > 0 
    ? Math.round(((currentWeekIncidents - previousWeekIncidents) / previousWeekIncidents) * 100)
    : 0;

  const riskTrends = {
    weekOverWeek,
    monthOverMonth: 0 // Simplified for now
  };
  
  return {
    highRiskLocations,
    criticalIncidents,
    recurrentIssues,
    riskTrends,
    priorityDistribution
  };
}

export function calculatePeriodComparison(
  currentPeriod: EnhancedIncident[],
  previousPeriod: EnhancedIncident[]
) {
  const current = calculateResolutionMetrics(currentPeriod);
  const previous = calculateResolutionMetrics(previousPeriod);
  
  return {
    incidentCountChange: ((current.totalIncidents - previous.totalIncidents) / previous.totalIncidents) * 100,
    resolutionRateChange: current.resolutionRate - previous.resolutionRate,
    resolutionTimeChange: current.averageResolutionTime - previous.averageResolutionTime,
    trend: current.resolutionTrend
  };
}