
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useIncidents, 
  IncidentType, 
  IncidentCategory,
  IncidentStatus,
  subcategories,
  nearMissSubcategories,
  unsafeConditionSubcategories
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
import { AlertTriangle, Search, Calendar, Edit, Ticket } from 'lucide-react';

const IncidentsList = () => {
  const { incidents } = useIncidents();
  const navigate = useNavigate();
  
  // Filter states
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    subcategory: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    search: '',
    priority: '',
  });

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);

  // Update available categories when type changes
  useEffect(() => {
    if (!filters.type) {
      setAvailableCategories([]);
      return;
    }

    if (filters.type === 'Incident') {
      setAvailableCategories(Object.keys(subcategories));
    } else if (filters.type === 'Near Miss') {
      setAvailableCategories(Object.keys(nearMissSubcategories));
    } else if (filters.type === 'Unsafe Condition') {
      setAvailableCategories(Object.keys(unsafeConditionSubcategories));
    } else {
      setAvailableCategories([]);
    }
  }, [filters.type]);

  // Update available subcategories when type or category changes
  useEffect(() => {
    if (!filters.type || !filters.category) {
      setAvailableSubcategories([]);
      return;
    }

    if (filters.type === 'Incident') {
      setAvailableSubcategories(subcategories[filters.category as IncidentCategory] || []);
    } else if (filters.type === 'Near Miss') {
      setAvailableSubcategories(nearMissSubcategories[filters.category] || []);
    } else if (filters.type === 'Unsafe Condition') {
      setAvailableSubcategories(unsafeConditionSubcategories[filters.category] || []);
    } else {
      setAvailableSubcategories([]);
    }
  }, [filters.type, filters.category]);

  // Reset category and subcategory when type changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      category: '',
      subcategory: ''
    }));
  }, [filters.type]);

  // Reset subcategory when category changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      subcategory: ''
    }));
  }, [filters.category]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      category: '',
      subcategory: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      search: '',
      priority: '',
    });
  };

  // Apply filters to incidents
  const filteredIncidents = incidents.filter(incident => {
    // Filter by type
    if (filters.type && incident.type !== filters.type) return false;
    
    // Filter by category
    if (filters.category && incident.category !== filters.category) return false;
    
    // Filter by subcategory
    if (filters.subcategory && incident.subcategory !== filters.subcategory) return false;
    
    // Filter by status
    if (filters.status && incident.status !== filters.status) return false;
    
    // Filter by priority
    if (filters.priority && incident.priority !== filters.priority) return false;
    
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
      // Search in ticket ID
      if (incident.ticketId.toLowerCase().includes(searchLower)) return true;
      // Search in description
      if (incident.description.toLowerCase().includes(searchLower)) return true;
      // Search in category
      if (incident.category.toLowerCase().includes(searchLower)) return true;
      // Search in subcategory
      if (incident.subcategory && incident.subcategory.toLowerCase().includes(searchLower)) return true;
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

  const getPriorityBadgeClass = (priority: string | undefined) => {
    switch(priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="search"
                  placeholder="Search incidents or ticket ID..."
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select 
                value={filters.category} 
                onValueChange={(value) => handleFilterChange('category', value)}
                disabled={availableCategories.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {availableCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={filters.subcategory} 
                onValueChange={(value) => handleFilterChange('subcategory', value)}
                disabled={availableSubcategories.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Subcategory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Subcategories</SelectItem>
                  {availableSubcategories.map(subcategory => (
                    <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={filters.priority} 
                onValueChange={(value) => handleFilterChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priorities</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
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
              
              <Button variant="outline" onClick={clearFilters} className="ml-auto">
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          {sortedIncidents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedIncidents.map((incident) => (
                    <TableRow key={incident.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/incidents/${incident.id}`)}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Ticket className="h-4 w-4 mr-2 text-blue-600" />
                          {incident.ticketId}
                        </div>
                      </TableCell>
                      <TableCell>{incident.type}</TableCell>
                      <TableCell>{incident.category}</TableCell>
                      <TableCell>{formatDate(incident.date)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityBadgeClass(incident.priority)}`}>
                          {incident.priority || 'Medium'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(incident.status)}`}>
                          {incident.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/incidents/${incident.id}`);
                            }}
                          >
                            View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/incidents/${incident.id}/edit`);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
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
