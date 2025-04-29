
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useIncidents, 
  IncidentType, 
  IncidentCategory,
  IncidentStatus 
} from '@/contexts/IncidentContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, Search, Calendar } from 'lucide-react';

const IncidentsList = () => {
  const { incidents } = useIncidents();
  const navigate = useNavigate();
  
  // Filter states
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  });

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      category: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      search: '',
    });
  };

  // Apply filters to incidents
  const filteredIncidents = incidents.filter(incident => {
    // Filter by type
    if (filters.type && incident.type !== filters.type) return false;
    
    // Filter by category
    if (filters.category && incident.category !== filters.category) return false;
    
    // Filter by status
    if (filters.status && incident.status !== filters.status) return false;
    
    // Filter by date range
    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom);
      const incidentDate = new Date(incident.date);
      if (incidentDate < dateFrom) return false;
    }
    
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      // Set time to end of day
      dateTo.setHours(23, 59, 59, 999);
      const incidentDate = new Date(incident.date);
      if (incidentDate > dateTo) return false;
    }
    
    // Filter by search text
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      // Search in description
      if (incident.description.toLowerCase().includes(searchLower)) return true;
      // Search in category
      if (incident.category.toLowerCase().includes(searchLower)) return true;
      // Search in people involved
      if (incident.peopleInvolved.some(p => 
        p.name.toLowerCase().includes(searchLower) || 
        (p.notes && p.notes.toLowerCase().includes(searchLower))
      )) return true;
      
      return false;
    }
    
    return true;
  });

  // Sort by newest first
  const sortedIncidents = [...filteredIncidents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeClass = (status: IncidentStatus) => {
    switch(status) {
      case 'Open':
        return 'bg-red-100 text-red-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">All Incidents</h1>
            <p className="text-gray-600 mt-1">
              View and manage reported incidents
            </p>
          </div>
          
          <Button onClick={() => navigate('/report')}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Report New
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="search"
                  placeholder="Search incidents..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              
              <Select 
                value={filters.type} 
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="Incident">Incident</SelectItem>
                  <SelectItem value="Near Miss">Near Miss</SelectItem>
                  <SelectItem value="Unsafe Condition">Unsafe Condition</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={filters.category} 
                onValueChange={(value) => handleFilterChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="Physical Injury">Physical Injury</SelectItem>
                  <SelectItem value="Bullying">Bullying</SelectItem>
                  <SelectItem value="Tech Misuse">Tech Misuse</SelectItem>
                  <SelectItem value="Property Damage">Property Damage</SelectItem>
                  <SelectItem value="Health Concern">Health Concern</SelectItem>
                  <SelectItem value="Security Breach">Security Breach</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={filters.status} 
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm">From:</span>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-auto"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm">To:</span>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-auto"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          {sortedIncidents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedIncidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell>{incident.type}</TableCell>
                      <TableCell>{incident.category}</TableCell>
                      <TableCell>{formatDate(incident.date)}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate">
                          {incident.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(incident.status)}`}>
                          {incident.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/incidents/${incident.id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">No incidents found matching your filters</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default IncidentsList;
