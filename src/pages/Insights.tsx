import { useState, useMemo } from 'react';
import { useIncidents } from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFacilities } from '@/contexts/FacilityContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format, startOfYear, startOfMonth, isBefore, isAfter } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InsightsFilters from '@/components/insights/InsightsFilters';
import ChartsTab from '@/components/insights/tabs/ChartsTab';
import PeopleTab from '@/components/insights/tabs/PeopleTab';
import { COLORS, downloadCSV, prepareIncidentsExport, preparePeopleExport, PersonData } from '@/utils/insightsUtils';
import { filterByDateRange, DateRangeFilter } from '@/utils/dateRangeUtils';
import TimeSeriesAnalysis from '@/components/insights/charts/TimeSeriesAnalysis';
import HeatmapChart from '@/components/insights/charts/HeatmapChart';
import RiskAssessmentChart from '@/components/insights/charts/RiskAssessmentChart';
import IncidentDetailsCard from '@/components/insights/charts/IncidentDetailsCard';

const Insights = () => {
  const { incidents } = useIncidents();
  const { users, isAdmin } = useAuth();
  const { facilities } = useFacilities();
  
  // Current date info
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  // Active tab state
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Filters
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('month');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState('all');
  const [facilityFilter, setFacilityFilter] = useState('all');
  const [personFilter, setPersonFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined
  });

  // Get all unique subcategories from incidents
  const availableSubcategories = useMemo(() => {
    const subcategories = new Set<string>();
    incidents.forEach(incident => {
      if (incident.subcategory) {
        subcategories.add(incident.subcategory);
      }
    });
    return Array.from(subcategories).sort();
  }, [incidents]);

  // Get all unique people involved in incidents
  const peopleInvolved = useMemo(() => {
    const people = new Set<string>();
    incidents.forEach(incident => {
      if (incident.peopleInvolved) {
        incident.peopleInvolved.forEach(person => {
          if (person && person.name) {
            people.add(person.name);
          }
        });
      }
    });
    return Array.from(people).sort();
  }, [incidents]);

  // Apply filters
  const filteredIncidents = useMemo(() => {
    // First apply date filtering
    let result = filterByDateRange(incidents, dateFilter, dateRange);
    
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
  }, [incidents, dateFilter, typeFilter, categoryFilter, subcategoryFilter, facilityFilter, personFilter, roleFilter, dateRange, isAdmin]);

  // Prepare data for charts
  const categoryData = useMemo(() => {
    const categoryCounts = filteredIncidents.reduce((acc, incident) => {
      const { category } = incident;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredIncidents]);

  // Subcategory data
  const subcategoryData = useMemo(() => {
    const subcategoryCounts = filteredIncidents.reduce((acc, incident) => {
      const { subcategory } = incident;
      if (subcategory) { // Add null check for subcategory
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
  }, [filteredIncidents]);

  // Other chart data preparations
  const typeData = useMemo(() => {
    const typeCounts = filteredIncidents.reduce((acc, incident) => {
      const { type } = incident;
      if (type) { // Add null check for type
        acc[type] = (acc[type] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(typeCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredIncidents]);

  const statusData = useMemo(() => {
    const statusCounts = filteredIncidents.reduce((acc, incident) => {
      const { status } = incident;
      if (status) { // Add null check for status
        acc[status] = (acc[status] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredIncidents]);

  // Time series data (monthly)
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const timeSeriesData = useMemo(() => {
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
    filteredIncidents.forEach(incident => {
      const date = new Date(incident.date);
      const month = monthNames[date.getMonth()];
      
      if (monthlyData[month]) {
        monthlyData[month].count += 1;
      }
    });
    
    return Object.values(monthlyData);
  }, [filteredIncidents]);

  // Location data
  const locationData = useMemo(() => {
    const locationCounts = filteredIncidents.reduce((acc, incident) => {
      const { location } = incident;
      if (location) { // Add null check for location
        acc[location] = (acc[location] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(locationCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredIncidents]);

  // Facility data for admin view
  const facilityData = useMemo(() => {
    if (!isAdmin) return [];
    
    const facilityCounts = filteredIncidents.reduce((acc, incident) => {
      const facilityName = incident.facility || 'Unspecified';
      acc[facilityName] = (acc[facilityName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(facilityCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredIncidents, isAdmin]);

  // User assignment data - show who incidents are assigned to
  const assigneeData = useMemo(() => {
    const ownerCounts = filteredIncidents.reduce((acc, incident) => {
      const ownerName = incident.owner?.name || 'Unassigned';
      acc[ownerName] = (acc[ownerName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(ownerCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredIncidents]);

  // Extract people involved data from incidents for the people report
  const peopleData = useMemo(() => {
    const peopleMap = new Map();
    
    filteredIncidents.forEach(incident => {
      if (!incident.peopleInvolved) return; // Add null check for peopleInvolved
      
      incident.peopleInvolved.forEach(person => {
        // Use string key instead of object
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
  }, [filteredIncidents]);
  
  // Role distribution data
  const roleDistributionData = useMemo(() => {
    const roleCounts = new Map();
    
    peopleData.forEach(person => {
      const role = person.role || 'Unknown';
      roleCounts.set(role, (roleCounts.get(role) || 0) + 1);
    });
    
    return Array.from(roleCounts.entries()).map(([name, value]) => ({ name, value }));
  }, [peopleData]);

  // Heatmap data - shows when and where incidents occur
  const heatmapData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const locationMap = new Map<string, Map<string, number>>();
    
    // Initialize data structure
    filteredIncidents.forEach(incident => {
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
  }, [filteredIncidents]);

  // Risk assessment data - shows each category's risk score
  const riskData = useMemo(() => {
    const categoryRiskMap = new Map<string, { count: number, severity: number, incidents: any[] }>();
    
    filteredIncidents.forEach(incident => {
      const category = incident.category;
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
  }, [filteredIncidents]);

  // Export data as CSV
  const exportToCSV = () => {
    const csvContent = prepareIncidentsExport(filteredIncidents);
    downloadCSV(csvContent, `incident-report-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // Export people report as CSV
  const exportPeopleReportCSV = () => {
    const csvContent = preparePeopleExport(peopleData as PersonData[]);
    downloadCSV(csvContent, `people-incident-report-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from) {
      setDateFilter('custom');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold">Insights & Reports</h1>
            <p className="text-gray-600 mt-1">Analyze incident data and trends</p>
          </div>
          
          <div className="flex space-x-2">
            {activeTab === "charts" && (
              <Button onClick={exportToCSV} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export as CSV
              </Button>
            )}
            
            {activeTab === "people" && (
              <Button onClick={exportPeopleReportCSV} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export People Report
              </Button>
            )}
          </div>
        </div>

        {/* Filter section */}
        <InsightsFilters
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          subcategoryFilter={subcategoryFilter}
          setSubcategoryFilter={setSubcategoryFilter}
          facilityFilter={facilityFilter}
          setFacilityFilter={setFacilityFilter}
          personFilter={personFilter}
          setPersonFilter={setPersonFilter}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          dateRange={dateRange}
          handleDateRangeChange={handleDateRangeChange}
          availableSubcategories={availableSubcategories}
          peopleInvolved={peopleInvolved}
          facilities={facilities}
          isAdmin={isAdmin}
        />

        {/* Tabs content */}
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-[500px]">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="charts">Charts & Analytics</TabsTrigger>
            <TabsTrigger value="people">People Report</TabsTrigger>
          </TabsList>
          
          {/* Dashboard tab content */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Enhanced time series analysis */}
              <TimeSeriesAnalysis data={timeSeriesData} />
              
              {/* Risk assessment matrix */}
              <RiskAssessmentChart data={riskData} />
              
              {/* Heatmap showing when and where incidents occur */}
              <HeatmapChart 
                data={heatmapData} 
                title="Incident Hotspots"
                description="Heatmap showing when and where incidents occur most frequently"
              />
              
              {/* Incident details - most recent incidents */}
              <IncidentDetailsCard 
                incidents={filteredIncidents.slice(0, 10)} 
                title="Recent Incidents"
                description="Most recently reported incidents matching your filters"
              />
            </div>
          </TabsContent>
          
          {/* Charts tab content */}
          <TabsContent value="charts">
            <ChartsTab 
              categoryData={categoryData}
              typeData={typeData}
              subcategoryData={subcategoryData}
              timeSeriesData={timeSeriesData}
              locationData={locationData}
              facilityData={facilityData}
              assigneeData={assigneeData}
              statusData={statusData}
              isAdmin={isAdmin}
              colors={COLORS}
            />
          </TabsContent>
          
          {/* People tab content */}
          <TabsContent value="people">
            <PeopleTab 
              roleDistributionData={roleDistributionData}
              peopleData={peopleData as PersonData[]}
              colors={COLORS}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Insights;
