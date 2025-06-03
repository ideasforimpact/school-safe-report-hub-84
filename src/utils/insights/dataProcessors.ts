
import { Incident } from '@/types/incident';
import { DateRangeFilter, filterByDateRange } from '../dateRangeUtils';
import { DateRange } from 'react-day-picker';

// Process category data
export const processCategoryData = (incidents: Incident[]) => {
  const categoryCounts = incidents.reduce((acc, incident) => {
    const { category } = incident;
    if (category) {
      acc[category] = (acc[category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value,
  }));
};

// Process subcategory data
export const processSubcategoryData = (incidents: Incident[]) => {
  const subcategoryCounts = incidents.reduce((acc, incident) => {
    const { subcategory } = incident;
    if (subcategory) {
      acc[subcategory] = (acc[subcategory] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  // Sort by count and limit to top 10 for readability
  return Object.entries(subcategoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({
      name,
      value,
    }));
};

// Process type data
export const processTypeData = (incidents: Incident[]) => {
  const typeCounts = incidents.reduce((acc, incident) => {
    const { type } = incident;
    if (type) {
      acc[type] = (acc[type] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(typeCounts).map(([name, value]) => ({
    name,
    value,
  }));
};

// Process status data
export const processStatusData = (incidents: Incident[]) => {
  const statusCounts = incidents.reduce((acc, incident) => {
    const { status } = incident;
    if (status) {
      acc[status] = (acc[status] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }));
};

// Process time series data
export const processTimeSeriesData = (incidents: Incident[]) => {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Initialize with all months
  const monthlyData: Record<string, { month: string, count: number }> = {};
  
  // Initialize all months with zero count
  for (let i = 0; i < 12; i++) {
    monthlyData[monthNames[i]] = {
      month: monthNames[i],
      count: 0
    };
  }
  
  // Count incidents per month
  incidents.forEach(incident => {
    const date = new Date(incident.date);
    const month = monthNames[date.getMonth()];
    
    if (monthlyData[month]) {
      monthlyData[month].count += 1;
    }
  });
  
  return Object.values(monthlyData);
};

// Process location data
export const processLocationData = (incidents: Incident[]) => {
  const locationCounts = incidents.reduce((acc, incident) => {
    const { location } = incident;
    if (location) {
      acc[location] = (acc[location] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(locationCounts).map(([name, value]) => ({
    name,
    value,
  }));
};

// Process facility data
export const processFacilityData = (incidents: Incident[], isAdmin: boolean) => {
  if (!isAdmin) return [];
  
  const facilityCounts = incidents.reduce((acc, incident) => {
    const facilityName = incident.facility || 'Unspecified';
    acc[facilityName] = (acc[facilityName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(facilityCounts).map(([name, value]) => ({
    name,
    value,
  }));
};

// Process assignee data
export const processAssigneeData = (incidents: Incident[]) => {
  const ownerCounts = incidents.reduce((acc, incident) => {
    const ownerName = incident.owner?.name || 'Unassigned';
    acc[ownerName] = (acc[ownerName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(ownerCounts).map(([name, value]) => ({
    name,
    value,
  }));
};

// Process people data
export interface PersonDataType {
  name: string;
  id: string;
  role: string;
  incidents: Array<{
    id: string;
    date: string;
    type: string;
    category: string;
    subcategory: string;
    status: string;
  }>;
  count: number;
}

export const processPeopleData = (incidents: Incident[]): PersonDataType[] => {
  const peopleMap = new Map();
  
  incidents.forEach(incident => {
    if (!incident.peopleInvolved) return;
    
    incident.peopleInvolved.forEach(person => {
      const key = person.name || 'Unknown';
      
      if (!peopleMap.has(key)) {
        peopleMap.set(key, {
          name: person.name || 'Unknown',
          id: person.id || 'Unknown', 
          role: person.role || 'Unknown',
          incidents: [],
          count: 0
        });
      }
      
      const personData = peopleMap.get(key);
      personData.count++;
      personData.incidents.push({
        id: incident.id,
        date: incident.date,
        type: incident.type,
        category: incident.category,
        subcategory: incident.subcategory || '',
        status: incident.status || 'Unknown'
      });
    });
  });
  
  return Array.from(peopleMap.values());
};

// Process role distribution data
export const processRoleDistributionData = (peopleData: PersonDataType[]) => {
  const roleCounts = new Map();
  
  peopleData.forEach(person => {
    const role = person.role || 'Unknown';
    roleCounts.set(role, (roleCounts.get(role) || 0) + 1);
  });
  
  return Array.from(roleCounts.entries()).map(([name, value]) => ({ name, value }));
};

// Process heatmap data
export const processHeatmapData = (incidents: Incident[]) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const locationMap = new Map<string, Map<string, number>>();
  
  // Initialize data structure
  incidents.forEach(incident => {
    const location = incident.location || 'Unknown';
    if (!locationMap.has(location)) {
      const dayMap = new Map<string, number>();
      days.forEach(day => dayMap.set(day, 0));
      locationMap.set(location, dayMap);
    }
    
    // Increment count for the location and day
    const date = new Date(incident.date);
    const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1]; // Convert to 0 = Monday format
    const dayMap = locationMap.get(location);
    if (dayMap) {
      dayMap.set(dayName, (dayMap.get(dayName) || 0) + 1);
    }
  });
  
  // Convert to the format needed by the heatmap
  return Array.from(locationMap.entries())
    .map(([name, dayMap]) => ({
      name,
      values: Array.from(dayMap.entries()).map(([day, value]) => ({
        day,
        value
      }))
    }))
    // Take only top 7 locations for readability
    .sort((a, b) => {
      const sumA = a.values.reduce((sum, v) => sum + v.value, 0);
      const sumB = b.values.reduce((sum, v) => sum + v.value, 0);
      return sumB - sumA;
    })
    .slice(0, 7);
};

// Process risk assessment data
export const processRiskData = (incidents: Incident[]) => {
  const categoryRiskMap = new Map<string, { count: number, severity: number, incidents: any[] }>();
  
  incidents.forEach(incident => {
    const category = incident.category;
    if (!category) return;
    
    if (!categoryRiskMap.has(category)) {
      categoryRiskMap.set(category, { count: 0, severity: 0, incidents: [] });
    }
    
    const data = categoryRiskMap.get(category);
    if (data) {
      data.count++;
      data.incidents.push(incident);
      
      // Calculate severity based on priority
      let severityScore = 3; // Default medium severity
      if (incident.priority === 'Critical') severityScore = 5;
      else if (incident.priority === 'High') severityScore = 4;
      else if (incident.priority === 'Medium') severityScore = 3;
      else if (incident.priority === 'Low') severityScore = 2;
      
      // Accumulate severity
      data.severity += severityScore;
    }
  });
  
  // Calculate average severity and frequency for each category
  const maxCount = Math.max(1, ...Array.from(categoryRiskMap.values()).map(v => v.count));
  
  return Array.from(categoryRiskMap.entries()).map(([name, data]) => ({
    name,
    // Normalize frequency to 0-5 scale
    frequency: Math.min(5, Math.round((data.count / maxCount) * 5)),
    // Average severity on 0-5 scale
    severity: Math.min(5, Math.round(data.severity / data.count)),
    count: data.count
  }));
};

// Apply all filters to incidents
export const applyFilters = (
  incidents: Incident[],
  dateFilter: DateRangeFilter,
  dateRange: DateRange | undefined,
  typeFilter: string,
  categoryFilter: string,
  subcategoryFilter: string,
  facilityFilter: string,
  personFilter: string,
  roleFilter: string,
  isAdmin: boolean
) => {
  // First apply date filtering if implemented
  let result = incidents;
  if (typeof filterByDateRange === 'function') {
    result = filterByDateRange(incidents, dateFilter, dateRange);
  }
  
  // Then apply the rest of the filters
  return result.filter(incident => {
    // Apply type filter
    if (typeFilter !== 'all' && incident.type !== typeFilter) {
      return false;
    }
    
    // Apply category filter
    if (categoryFilter !== 'all' && incident.category !== categoryFilter) {
      return false;
    }
    
    // Apply subcategory filter
    if (subcategoryFilter !== 'all' && incident.subcategory !== subcategoryFilter) {
      return false;
    }
    
    // Apply facility filter (only for admin users)
    if (isAdmin && facilityFilter !== 'all' && incident.facility !== facilityFilter) {
      return false;
    }
    
    // Apply person filter
    if (personFilter !== 'all') {
      const foundPerson = incident.peopleInvolved?.some(p => p.name === personFilter);
      if (!foundPerson) {
        return false;
      }
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      const foundRole = incident.peopleInvolved?.some(p => p.role === roleFilter);
      if (!foundRole) {
        return false;
      }
    }
    
    return true;
  });
};

// Extract unique subcategories and people involved from incidents
export const extractUniqueValues = (incidents: Incident[]) => {
  // Get unique subcategories
  const subcategories = new Set<string>();
  // Get unique people involved
  const people = new Set<string>();
  
  incidents.forEach(incident => {
    if (incident.subcategory) {
      subcategories.add(incident.subcategory);
    }
    
    if (incident.peopleInvolved) {
      incident.peopleInvolved.forEach(person => {
        if (person && person.name) {
          people.add(person.name);
        }
      });
    }
  });
  
  return {
    availableSubcategories: Array.from(subcategories).sort(),
    peopleInvolved: Array.from(people).sort()
  };
};
