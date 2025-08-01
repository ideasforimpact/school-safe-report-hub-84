import { Incident } from '@/contexts/IncidentContext';

export interface ResolutionMetrics {
  resolutionRate: number;
  averageResolutionTime: number;
  totalIncidents: number;
  resolvedIncidents: number;
  pendingIncidents: number;
  overdueIncidents: number;
  previousPeriodResolutionRate?: number;
  resolutionTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface ResponseMetrics {
  averageResponseTime: number;
  averageAssignmentTime: number;
  unassignedCount: number;
  slaCompliance: number;
  escalatedCount: number;
}

export interface WorkloadMetrics {
  totalAssignees: number;
  averageWorkload: number;
  maxWorkload: number;
  workloadDistribution: Array<{
    assignee: string;
    count: number;
    percentage: number;
  }>;
}

export interface RiskMetrics {
  highRiskLocations: Array<{
    location: string;
    count: number;
    riskScore: number;
  }>;
  criticalIncidents: number;
  recurrentIssues: Array<{
    category: string;
    location: string;
    count: number;
  }>;
}

export function calculateResolutionMetrics(
  incidents: Incident[], 
  previousPeriodIncidents?: Incident[]
): ResolutionMetrics {
  const resolvedStatuses = ['resolved', 'closed', 'completed'];
  
  const resolvedIncidents = incidents.filter(incident => 
    resolvedStatuses.includes(incident.status?.toLowerCase() || '')
  ).length;
  
  const pendingIncidents = incidents.length - resolvedIncidents;
  
  // Calculate average resolution time (in days)
  const resolvedWithDates = incidents.filter(incident => {
    const status = incident.status?.toLowerCase() || '';
    return resolvedStatuses.includes(status) && incident.date && incident.updatedAt;
  });
  
  const totalResolutionTime = resolvedWithDates.reduce((sum, incident) => {
    const created = new Date(incident.date);
    const resolved = new Date(incident.updatedAt);
    return sum + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  }, 0);
  
  const averageResolutionTime = resolvedWithDates.length > 0 
    ? totalResolutionTime / resolvedWithDates.length 
    : 0;
  
  const resolutionRate = incidents.length > 0 ? (resolvedIncidents / incidents.length) * 100 : 0;
  
  // Calculate overdue incidents (open for more than 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const overdueIncidents = incidents.filter(incident => {
    const isOpen = !resolvedStatuses.includes(incident.status?.toLowerCase() || '');
    const createdDate = new Date(incident.date);
    return isOpen && createdDate < sevenDaysAgo;
  }).length;
  
  // Calculate trend
  let resolutionTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  let previousPeriodResolutionRate: number | undefined;
  
  if (previousPeriodIncidents && previousPeriodIncidents.length > 0) {
    const prevResolved = previousPeriodIncidents.filter(incident => 
      resolvedStatuses.includes(incident.status?.toLowerCase() || '')
    ).length;
    previousPeriodResolutionRate = (prevResolved / previousPeriodIncidents.length) * 100;
    
    const difference = resolutionRate - previousPeriodResolutionRate;
    if (difference > 5) resolutionTrend = 'increasing';
    else if (difference < -5) resolutionTrend = 'decreasing';
  }
  
  return {
    resolutionRate,
    averageResolutionTime,
    totalIncidents: incidents.length,
    resolvedIncidents,
    pendingIncidents,
    overdueIncidents,
    previousPeriodResolutionRate,
    resolutionTrend
  };
}

export function calculateResponseMetrics(incidents: Incident[]): ResponseMetrics {
  // Calculate average response time (creation to first assignment)
  const assignedIncidents = incidents.filter(incident => incident.owner);
  
  const totalResponseTime = assignedIncidents.reduce((sum, incident) => {
    const created = new Date(incident.date);
    const assigned = new Date(incident.createdAt); // Using createdAt as proxy for assignment time
    return sum + (assigned.getTime() - created.getTime()) / (1000 * 60 * 60);
  }, 0);
  
  const averageResponseTime = assignedIncidents.length > 0 
    ? totalResponseTime / assignedIncidents.length 
    : 0;
  
  const unassignedCount = incidents.filter(incident => !incident.owner).length;
  
  // Calculate SLA compliance (incidents resolved within 72 hours)
  const slaCompliantIncidents = incidents.filter(incident => {
    const resolvedStatuses = ['resolved', 'closed', 'completed'];
    if (!resolvedStatuses.includes(incident.status?.toLowerCase() || '')) return false;
    
    const created = new Date(incident.date);
    const resolved = new Date(incident.updatedAt);
    const hoursToResolve = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
    return hoursToResolve <= 72;
  }).length;
  
  const slaCompliance = incidents.length > 0 ? (slaCompliantIncidents / incidents.length) * 100 : 0;
  
  // Count escalated incidents (priority changed to higher)
  const escalatedCount = incidents.filter(incident => {
    // This would need audit log data to determine escalation
    // For now, using high priority as proxy
    return incident.priority === 'High' || incident.priority === 'Critical';
  }).length;
  
  return {
    averageResponseTime,
    averageAssignmentTime: averageResponseTime, // Same for now
    unassignedCount,
    slaCompliance,
    escalatedCount
  };
}

export function calculateWorkloadMetrics(incidents: Incident[]): WorkloadMetrics {
  const assigneeCount: { [key: string]: number } = {};
  
  incidents.forEach(incident => {
    if (incident.owner) {
      const assigneeName = typeof incident.owner === 'string' ? incident.owner : incident.owner.name || 'Unknown';
      assigneeCount[assigneeName] = (assigneeCount[assigneeName] || 0) + 1;
    }
  });
  
  const assignees = Object.keys(assigneeCount);
  const totalAssignees = assignees.length;
  const workloadCounts = Object.values(assigneeCount);
  
  const averageWorkload = totalAssignees > 0 
    ? workloadCounts.reduce((sum, count) => sum + count, 0) / totalAssignees 
    : 0;
  
  const maxWorkload = workloadCounts.length > 0 ? Math.max(...workloadCounts) : 0;
  
  const workloadDistribution = Object.entries(assigneeCount)
    .map(([assignee, count]) => ({
      assignee,
      count,
      percentage: incidents.length > 0 ? (count / incidents.length) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count);
  
  return {
    totalAssignees,
    averageWorkload,
    maxWorkload,
    workloadDistribution
  };
}

export function calculateRiskMetrics(incidents: Incident[]): RiskMetrics {
  // High-risk locations (more than average incident count)
  const locationCount: { [key: string]: number } = {};
  incidents.forEach(incident => {
    if (incident.location) {
      locationCount[incident.location] = (locationCount[incident.location] || 0) + 1;
    }
  });
  
  const avgIncidentsPerLocation = Object.values(locationCount).length > 0
    ? Object.values(locationCount).reduce((sum, count) => sum + count, 0) / Object.values(locationCount).length
    : 0;
  
  const highRiskLocations = Object.entries(locationCount)
    .filter(([_, count]) => count > avgIncidentsPerLocation)
    .map(([location, count]) => ({
      location,
      count,
      riskScore: count / avgIncidentsPerLocation
    }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);
  
  // Critical incidents
  const criticalIncidents = incidents.filter(incident => 
    incident.priority === 'Critical' || incident.priority === 'High'
  ).length;
  
  // Recurrent issues (same category and location)
  const issueKey: { [key: string]: number } = {};
  incidents.forEach(incident => {
    if (incident.category && incident.location) {
      const key = `${incident.category}-${incident.location}`;
      issueKey[key] = (issueKey[key] || 0) + 1;
    }
  });
  
  const recurrentIssues = Object.entries(issueKey)
    .filter(([_, count]) => count > 2)
    .map(([key, count]) => {
      const [category, location] = key.split('-');
      return { category, location, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  return {
    highRiskLocations,
    criticalIncidents,
    recurrentIssues
  };
}

export function calculatePeriodComparison(
  currentPeriod: Incident[],
  previousPeriod: Incident[]
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