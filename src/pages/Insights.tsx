import { useState, useMemo } from 'react';
import { useIncidents } from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFacilities } from '@/contexts/FacilityContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Download, Calendar } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { format, startOfYear, startOfMonth, isBefore, isAfter } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const Insights = () => {
  const { incidents } = useIncidents();
  const { users, isAdmin } = useAuth();
  const { facilities } = useFacilities();
  
  // Current date info
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  // Calculate default date range
  const defaultFrom = startOfMonth(currentDate);
  const defaultTo = currentDate;
  
  // Active tab state
  const [activeTab, setActiveTab] = useState("charts");
  
  // Filters
  const [dateFilter, setDateFilter] = useState('all');
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
          if (person.name) {
            people.add(person.name);
          }
        });
      }
    });
    return Array.from(people).sort();
  }, [incidents]);

  // Apply filters
  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const incidentDate = new Date(incident.date);
      
      // Apply date filter
      if (dateFilter === 'month') {
        if (
          incidentDate.getMonth() !== currentMonth ||
          incidentDate.getFullYear() !== currentYear
        ) {
          return false;
        }
      } else if (dateFilter === 'year') {
        if (incidentDate.getFullYear() !== currentYear) {
          return false;
        }
      } else if (dateFilter === 'custom' && dateRange) {
        // Apply custom date range if selected
        if (dateRange.from && isBefore(incidentDate, dateRange.from)) {
          return false;
        }
        if (dateRange.to && isAfter(incidentDate, dateRange.to)) {
          return false;
        }
      }
      
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
  }, [incidents, dateFilter, typeFilter, categoryFilter, subcategoryFilter, facilityFilter, personFilter, roleFilter, currentMonth, currentYear, dateRange, isAdmin]);

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
      acc[subcategory] = (acc[subcategory] || 0) + 1;
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
      acc[type] = (acc[type] || 0) + 1;
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
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredIncidents]);

  // Time series data (monthly)
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
      acc[location] = (acc[location] || 0) + 1;
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
      incident.peopleInvolved.forEach(person => {
        const key = person.name;
        if (!peopleMap.has(key)) {
          peopleMap.set(key, {
            name: person.name,
            id: person.id || 'Unknown', 
            role: person.role,
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
          subcategory: incident.subcategory,
          status: incident.status
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

  // Export data as CSV
  const exportToCSV = () => {
    // Prepare the CSV header
    const headers = [
      'ID',
      'Type',
      'Category',
      'Subcategory',
      'Description',
      'Date',
      'Location',
      'Status',
      'People Involved',
      'Reported By',
      'Owner',
      'Actions Taken'
    ].join(',');
    
    // Prepare the CSV rows
    const rows = filteredIncidents.map(incident => {
      const peopleInvolved = incident.peopleInvolved
        .map(p => `${p.name} (${p.role})${p.notes ? ` - ${p.notes}` : ''}`)
        .join('; ');
      
      const actions = incident.actions
        ? incident.actions
            .map(a => `${a.description} by ${a.responsiblePerson} on ${new Date(a.date).toLocaleDateString()}`)
            .join('; ')
        : '';
      
      return [
        incident.id,
        incident.type,
        incident.category,
        incident.subcategory,
        `"${incident.description.replace(/"/g, '""')}"`, // Escape quotes
        new Date(incident.date).toLocaleDateString(),
        incident.location,
        incident.status,
        `"${peopleInvolved}"`,
        incident.reportedBy?.name || 'Unknown',
        incident.owner?.name || 'Unassigned',
        `"${actions}"`
      ].join(',');
    }).join('\n');
    
    // Combine header and rows
    const csvContent = `${headers}\n${rows}`;
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `incident-report-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export people report as CSV
  const exportPeopleReportCSV = () => {
    // Create headers for the CSV
    const headers = [
      'Name',
      'ID',
      'Role',
      'Incident Count',
      'Incident IDs',
      'Incident Dates',
      'Categories'
    ].join(',');
    
    // Create rows for each person
    const rows = peopleData.map(person => {
      const incidentIds = person.incidents.map(i => i.id).join('; ');
      const incidentDates = person.incidents.map(i => new Date(i.date).toLocaleDateString()).join('; ');
      const categories = person.incidents.map(i => i.category).join('; ');
      
      return [
        `"${person.name}"`,
        person.id,
        person.role,
        person.count,
        `"${incidentIds}"`,
        `"${incidentDates}"`,
        `"${categories}"`
      ].join(',');
    }).join('\n');
    
    // Combine headers and rows
    const csvContent = `${headers}\n${rows}`;
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `people-incident-report-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Filter Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              {dateFilter === 'custom' && (
                <div className="mt-2">
                  <DatePickerWithRange 
                    date={dateRange} 
                    onChange={handleDateRangeChange} 
                  />
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Incident Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Incident">Incident</SelectItem>
                  <SelectItem value="Near Miss">Near Miss</SelectItem>
                  <SelectItem value="Unsafe Condition">Unsafe Condition</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Physical Injury">Physical Injury</SelectItem>
                  <SelectItem value="Bullying">Bullying</SelectItem>
                  <SelectItem value="Tech Misuse">Tech Misuse</SelectItem>
                  <SelectItem value="Property Damage">Property Damage</SelectItem>
                  <SelectItem value="Health Concern">Health Concern</SelectItem>
                  <SelectItem value="Security Breach">Security Breach</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Subcategory</label>
              <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcategories</SelectItem>
                  {availableSubcategories.map((subcategory) => (
                    <SelectItem key={subcategory} value={subcategory}>
                      {subcategory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium mb-1">Facility</label>
                <Select value={facilityFilter} onValueChange={setFacilityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select facility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Facilities</SelectItem>
                    {facilities.map((facility) => (
                      <SelectItem key={facility} value={facility}>
                        {facility}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Person filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Person</label>
              <Select value={personFilter} onValueChange={setPersonFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All People</SelectItem>
                  {peopleInvolved.map((person) => (
                    <SelectItem key={person} value={person}>
                      {person}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Role filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                  <SelectItem value="Teacher">Teacher</SelectItem>
                  <SelectItem value="Administrator">Administrator</SelectItem>
                  <SelectItem value="Visitor">Visitor</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tabs content */}
        <Tabs defaultValue="charts" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-[400px]">
            <TabsTrigger value="charts">Charts & Analytics</TabsTrigger>
            <TabsTrigger value="people">People Report</TabsTrigger>
          </TabsList>
          
          {/* Charts tab content */}
          <TabsContent value="charts" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Incidents by Category</CardTitle>
                  <CardDescription>
                    Distribution of incidents across different categories
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No data available for the selected filters
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Incidents by Type</CardTitle>
                  <CardDescription>
                    Compare occurrence of incidents, near misses, and unsafe conditions
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  {typeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={typeData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No data available for the selected filters
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Incidents Over Time</CardTitle>
                  <CardDescription>
                    Monthly trend of reported incidents
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#3b82f6"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Incident Location</CardTitle>
                  <CardDescription>
                    Distribution of incidents by location
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  {locationData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={locationData} layout="vertical">
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#0ea5e9" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No data available for the selected filters
                    </div>
                  )}
                </CardContent>
              </Card>

              {isAdmin && facilityData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Incidents by Facility</CardTitle>
                    <CardDescription>
                      Distribution of incidents across different facilities
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-64">
                    {facilityData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={facilityData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {facilityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No data available for the selected filters
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Subcategories</CardTitle>
                  <CardDescription>
                    Most common specific types of incidents reported
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  {subcategoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subcategoryData} layout="vertical">
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={150} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No data available for the selected filters
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Incident Ownership</CardTitle>
                  <CardDescription>
                    Distribution of incidents by assigned owner
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  {assigneeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={assigneeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {assigneeData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No data available for the selected filters
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Incident Status Overview</CardTitle>
                <CardDescription>
                  Current status distribution of all reported incidents
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.name === 'Open' 
                                ? '#ef4444' 
                                : entry.name === 'In Progress' 
                                ? '#f59e0b' 
                                : '#22c55e'
                            } 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available for the selected filters
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* People tab content */}
          <TabsContent value="people" className="mt-4">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Role Distribution</CardTitle>
                  <CardDescription>
                    Distribution of incidents by role of people involved
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  {roleDistributionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={roleDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {roleDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No data available for the selected filters
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>People Involved in Incidents</CardTitle>
                  <CardDescription>
                    Detailed breakdown of incidents by person
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Incidents</TableHead>
                        <TableHead>Last Incident</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {peopleData.length > 0 ? (
                        peopleData.map((person) => {
                          // Find the most recent incident
                          const sortedIncidents = [...person.incidents].sort(
                            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                          );
                          const mostRecent = sortedIncidents[0];
                          
                          return (
                            <TableRow key={person.name + person.role}>
                              <TableCell className="font-medium">{person.name}</TableCell>
                              <TableCell>{person.id}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  person.role === 'Student' 
                                    ? 'bg-blue-100 text-blue-800'
                                    : person.role === 'Staff' || person.role === 'Teacher'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {person.role || 'Unknown'}
                                </span>
                              </TableCell>
                              <TableCell>{person.incidents.length}</TableCell>
                              <TableCell>{mostRecent ? new Date(mostRecent.date).toLocaleDateString() : 'N/A'}</TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            No data available for the selected filters
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Insights;
