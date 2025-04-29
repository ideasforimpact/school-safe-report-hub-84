
import { useState, useMemo } from 'react';
import { useIncidents } from '@/contexts/IncidentContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const Insights = () => {
  const { incidents } = useIncidents();
  const [dateFilter, setDateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Calculate current year and month for filtering
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

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
      }
      
      // Apply type filter
      if (typeFilter !== 'all' && incident.type !== typeFilter) {
        return false;
      }
      
      // Apply category filter
      if (categoryFilter !== 'all' && incident.category !== categoryFilter) {
        return false;
      }
      
      return true;
    });
  }, [incidents, dateFilter, typeFilter, categoryFilter, currentMonth, currentYear]);

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

  // Export data as CSV
  const exportToCSV = () => {
    // Prepare the CSV header
    const headers = [
      'ID',
      'Type',
      'Category',
      'Description',
      'Date',
      'Location',
      'Status',
      'People Involved',
      'Reported By',
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
        `"${incident.description.replace(/"/g, '""')}"`, // Escape quotes
        new Date(incident.date).toLocaleDateString(),
        incident.location,
        incident.status,
        `"${peopleInvolved}"`,
        incident.reportedBy.name,
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold">Insights & Reports</h1>
            <p className="text-gray-600 mt-1">Analyze incident data and trends</p>
          </div>
          
          <Button onClick={exportToCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export as CSV
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Filter Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </SelectContent>
              </Select>
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
          </div>
        </div>

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
        </div>

        <Card>
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
      </div>
    </Layout>
  );
};

export default Insights;
