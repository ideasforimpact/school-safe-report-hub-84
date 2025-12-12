import React, { useEffect, useState, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import { visitorService, Visitor } from '@/services/visitor/visitorService';
import { Search, Eye, RefreshCw, LogIn, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import VehicleTypeIcon from '@/components/transport-safety/VehicleTypeIcon';
import { format } from 'date-fns';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import VisitorDetailDialog from '@/components/visitor/VisitorDetailDialog';

const VisitorsPage = () => {
  const { employeeData } = useAuth();
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Dialog state
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Get client_id and employee_id from auth context
  const clientId = employeeData?.clientId;
  const employeeId = employeeData?.id;

  // Fetch visitors on component mount and when clientId changes
  useEffect(() => {
    if (clientId) {
    fetchVisitors();
    }
  }, [clientId]);

  const fetchVisitors = async () => {
    if (!clientId) {
      toast.error('Client ID is required to fetch visitors');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await visitorService.getVisitors(clientId, employeeId);
      setVisitors(data);
    } catch (error: any) {
      console.error('Error fetching visitors:', error);
      toast.error(error?.message || 'Failed to fetch visitors');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchVisitors();
    setIsRefreshing(false);
  };

  // Filter visitors based on search, vehicle type, and date range
  const filteredVisitors = useMemo(() => {
    return visitors.filter((visitor) => {
      // Search filter - by name or vehicle number
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          visitor.name.toLowerCase().includes(searchLower) ||
          (visitor.vehicle_no && visitor.vehicle_no.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Vehicle type filter
      if (vehicleTypeFilter !== 'all') {
        if (visitor.vehicle_type !== vehicleTypeFilter) {
          return false;
        }
      }

      // Date range filter
      if (dateRange?.from || dateRange?.to) {
        const entryDate = new Date(visitor.created_at);
        
        if (dateRange.from && entryDate < dateRange.from) {
          return false;
        }
        
        if (dateRange.to) {
          // Include the entire day for the "to" date
          const toDateEnd = new Date(dateRange.to);
          toDateEnd.setHours(23, 59, 59, 999);
          if (entryDate > toDateEnd) {
            return false;
          }
        }
      }

      return true;
    });
  }, [visitors, searchTerm, vehicleTypeFilter, dateRange]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setVehicleTypeFilter('all');
    setDateRange(undefined);
  };

  const hasActiveFilters = searchTerm || vehicleTypeFilter !== 'all' || dateRange;

  const formatEntryDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Layout>
      <div className="w-full py-6">
        <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-100 mx-6">
          <div className="flex items-center space-x-4">
            <LogIn className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-left">Visitors</h1>
              <p className="text-gray-500 text-sm text-left">Manage and track visitor entries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => navigate('/visitors/trusted-vehicles')}
            >
              <Car className="h-4 w-4 mr-2" />
              Add Trusted Vehicles
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh} 
              title="Refresh visitors"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 mx-6">
          <h2 className="text-lg font-medium mb-4 text-left">Visitors</h2>
          
          {/* Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="w-[400px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by Visitor Name, Vehicle No"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Vehicle Type Filter */}
              <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Vehicle Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  <SelectItem value="two_wheeler">Two Wheeler</SelectItem>
                  <SelectItem value="four_wheeler">Four Wheeler</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <div className="w-[300px]">
                <DatePickerWithRange
                  date={dateRange}
                  onChange={setDateRange}
                />
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="flex items-center gap-1"
                >
                  Clear Filters
                </Button>
              )}
            </div>
            
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>
                Showing {filteredVisitors.length} of {visitors.length} visitors
              </span>
              {hasActiveFilters && (
                <span className="text-primary">Filters applied</span>
              )}
            </div>
          </div>

          {/* Visitors Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Loading visitors...</p>
              </div>
            </div>
          ) : filteredVisitors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No visitors found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Visitor Name</TableHead>
                    <TableHead>Vehicle No</TableHead>
                    <TableHead>Entry Status</TableHead>
                    <TableHead>Entry Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisitors.map((visitor) => (
                    <TableRow key={visitor.id}>
                      <TableCell>
                        {visitor.vehicle_type ? (
                          <VehicleTypeIcon 
                            type={visitor.vehicle_type} 
                            size={24} 
                            className={
                              visitor.vehicle_type === 'two_wheeler' 
                                ? 'text-blue-600' 
                                : visitor.vehicle_type === 'four_wheeler'
                                ? 'text-green-600'
                                : 'text-gray-600'
                            }
                          />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{visitor.name}</TableCell>
                      <TableCell>{visitor.vehicle_no || '-'}</TableCell>
                      <TableCell>
                        {visitor.is_exit ? (
                          <Badge variant="destructive" className="bg-red-500 text-white">
                            OUT
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-500 text-white">
                            IN
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatEntryDate(visitor.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedVisitorId(visitor.id);
                            setIsDialogOpen(true);
                          }}
                          title="View visitor details"
                        >
                          <Eye className="h-4 w-4 text-green-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Visitor Detail Dialog */}
      <VisitorDetailDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        visitorId={selectedVisitorId}
        clientId={clientId || null}
      />
    </Layout>
  );
};

export default VisitorsPage;


