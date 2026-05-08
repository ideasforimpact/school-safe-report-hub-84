import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import { Car, ArrowLeft, Plus, Eye, Pencil, Trash2, CheckCircle2, XCircle, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { DateRange } from 'react-day-picker';
import { useNavigate } from 'react-router-dom';
import AddTrustedVehicleDialog from '@/components/visitor/AddTrustedVehicleDialog';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { isEmployeeSuperAdmin } from '@/store/employeeSelectors';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import { formatDate } from '@/lib/Dateformat';
import Loader from '@/components/common/Loader';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';

interface TrustedVehicle {
  id: string;
  vehicle_name: string;
  type: string;
  vehicle_no: string;
  name: string;
  validity_from: string;
  validity_to: string;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

const TrustedVehiclesPage = () => {
  const navigate = useNavigate();
  const { employeeData } = useAuth();
  const { state } = useEmployeeStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [vehicleToView, setVehicleToView] = useState<TrustedVehicle | null>(null);
  const [vehicleToEdit, setVehicleToEdit] = useState<TrustedVehicle | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<TrustedVehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [trustedVehicles, setTrustedVehicles] = useState<TrustedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all' | 'valid' | 'expired'
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Check if user has admin access to Visitor module
  const isSuperAdmin = isEmployeeSuperAdmin(state);
  
  const hasVisitorAdminAccess = useMemo(() => {
    if (isSuperAdmin) return true;
    
    // Find Visitor module by name (case-insensitive)
    const visitorModule = state.configuredModules?.find(
      module => module.name.toLowerCase() === 'visitor'
    );
    
    return visitorModule?.accessLevel?.is_admin === true;
  }, [isSuperAdmin, state.configuredModules]);

  const fetchTrustedVehicles = useCallback(async () => {
    if (!employeeData?.clientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('trusted_vehicle')
        .select('*')
        .eq('client_id', employeeData.clientId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTrustedVehicles((data || []) as TrustedVehicle[]);
    } catch (error: any) {
      console.error('Error fetching trusted vehicles:', error);
      toast.error(error?.message || 'Failed to fetch trusted vehicles');
    } finally {
      setLoading(false);
    }
  }, [employeeData?.clientId]);

  useEffect(() => {
    fetchTrustedVehicles();
  }, [fetchTrustedVehicles]);

  // Keep list in sync with realtime changes on trusted_vehicle table
  useRealTimeSubHook({
    channelName: 'trusted-vehicle-changes',
    table: 'trusted_vehicle',
    schema: 'public',
    events: ['INSERT', 'UPDATE', 'DELETE'],
    enabled: !!employeeData?.clientId,
    filter: employeeData?.clientId ? `client_id=eq.${employeeData.clientId}` : undefined,
    onPayload: () => {
      // Re-fetch whenever any trusted_vehicle row for this client changes
      fetchTrustedVehicles();
    },
  });

  const handleSaveSuccess = () => {
    setIsDialogOpen(false);
    setIsEditDialogOpen(false);
    setVehicleToEdit(null);
    fetchTrustedVehicles(); // Refresh the list
  };

  // Helper function to truncate text to 18 characters
  const truncateText = (text: string, maxLength: number = 18): string => {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  };

  // Helper function to truncate text for view dialog (20 chars)
  const truncateForView = (text: string, maxLength: number = 20): string => {
    if (!text || text.length <= maxLength) {
      return text || '-';
    }
    return text.substring(0, maxLength) + '...';
  };

  const getValidityStatus = (vehicle: TrustedVehicle) => {
    if (!vehicle.validity_to) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toDate = new Date(vehicle.validity_to);
    toDate.setHours(0, 0, 0, 0);

    // A vehicle is considered valid as long as its end date has not passed.
    // Even if the start date is in the future, it should be shown as "Valid"
    // until the end date crosses the current date.
    return toDate >= today;
  };

  // Filter vehicles based on search, status, and date range
  const filteredVehicles = useMemo(() => {
    return trustedVehicles.filter((vehicle) => {
      // Search filter - by name, type, vehicle name, or vehicle number
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          vehicle.name.toLowerCase().includes(searchLower) ||
          vehicle.type.toLowerCase().includes(searchLower) ||
          vehicle.vehicle_name.toLowerCase().includes(searchLower) ||
          vehicle.vehicle_no.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const isValid = getValidityStatus(vehicle);
        if (statusFilter === 'valid' && !isValid) {
          return false;
        }
        if (statusFilter === 'expired' && isValid) {
          return false;
        }
      }

      // Date range filter - filter by validity_from and validity_to
      if (dateRange?.from || dateRange?.to) {
        if (vehicle.validity_from) {
          const fromDate = new Date(vehicle.validity_from);
          fromDate.setHours(0, 0, 0, 0);
          
          if (dateRange.from && fromDate < dateRange.from) {
            return false;
          }
        }
        
        if (vehicle.validity_to && dateRange.to) {
          // Include the entire day for the "to" date
          const toDateEnd = new Date(vehicle.validity_to);
          toDateEnd.setHours(23, 59, 59, 999);
          const rangeToDateEnd = new Date(dateRange.to);
          rangeToDateEnd.setHours(23, 59, 59, 999);
          
          if (toDateEnd > rangeToDateEnd) {
            return false;
          }
        }
      }

      return true;
    });
  }, [trustedVehicles, searchTerm, statusFilter, dateRange]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange(undefined);
  };

  const activeFilterCount = [
    searchTerm,
    statusFilter !== 'all' ? statusFilter : '',
    dateRange?.from,
    dateRange?.to,
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  const handleDeleteConfirm = async () => {
    if (!vehicleToDelete || !employeeData?.clientId) return;

    try {
      setIsDeleting(true);

      const { data, error } = await supabase.functions.invoke('trusted-vehicle-management', {
        body: {
          action: 'delete',
          vehicle_id: vehicleToDelete.id,
          clientId: employeeData.clientId,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('Trusted vehicle deleted successfully');
      setVehicleToDelete(null);
      fetchTrustedVehicles();
    } catch (error: any) {
      console.error('Error deleting trusted vehicle:', error);
      toast.error(error?.message || 'Failed to delete trusted vehicle');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Layout>
      <div className="w-full py-6">
        <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-100 mx-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/visitors')}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Car className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-left">Trusted Vehicles</h1>
              <p className="text-gray-500 text-sm text-left">Manage trusted vehicles for visitors</p>
            </div>
          </div>
          {hasVisitorAdminAccess && !isReadOnlySwitchedContext &&(
            <Button 
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Trusted Vehicle
            </Button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 mx-6">
          {/* Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="w-[400px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by Name, Type, Vehicle Name, Vehicle Number"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="valid">Valid</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
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
                  <X className="h-4 w-4" />
                  Clear Filters ({activeFilterCount})
                </Button>
              )}
            </div>
            
            {/* Results count */}
            <div className="text-sm text-gray-600">
              <span>
                Showing {filteredVehicles.length} of {trustedVehicles.length} trusted vehicle(s)
              </span>
              {hasActiveFilters && (
                <span className="text-primary ml-2">Filters applied</span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader text="Loading trusted vehicles..." />
            </div>
          ) : filteredVehicles.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {hasActiveFilters ? 'No trusted vehicles match your filters' : 'No Trusted Vehicles'}
              </p>
            </div>
          </div>
          ) : (
            <div className="overflow-x-auto">
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Vehicle Name</TableHead>
                      <TableHead>Vehicle Number</TableHead>
                      <TableHead>Validity</TableHead>
                      <TableHead>Validity Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">
                          {vehicle.name.length > 18 ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-default">
                                  {truncateText(vehicle.name)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs break-words">{vehicle.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span>{vehicle.name}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {vehicle.type.length > 18 ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-default">
                                  {truncateText(vehicle.type)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs break-words">{vehicle.type}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span>{vehicle.type}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {vehicle.vehicle_name.length > 18 ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-default">
                                  {truncateText(vehicle.vehicle_name)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs break-words">{vehicle.vehicle_name}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span>{vehicle.vehicle_name}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {vehicle.vehicle_no.length > 18 ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-default">
                                  {truncateText(vehicle.vehicle_no)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs break-words">{vehicle.vehicle_no}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span>{vehicle.vehicle_no}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {vehicle.validity_from && vehicle.validity_to &&
                            `${formatDate(vehicle.validity_from)} - ${formatDate(vehicle.validity_to)}`}
                        </TableCell>

                        <TableCell>
                          {getValidityStatus(vehicle) ? (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-xs font-medium">Valid</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1 text-red-500">
                              <XCircle className="h-4 w-4" />
                              <span className="text-xs font-medium">Expired</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setVehicleToView(vehicle);
                                    setIsViewDialogOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View</p>
                              </TooltipContent>
                            </Tooltip>
                            {hasVisitorAdminAccess && !isReadOnlySwitchedContext && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setVehicleToEdit(vehicle);
                                      setIsEditDialogOpen(true);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {hasVisitorAdminAccess && !isReadOnlySwitchedContext && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setVehicleToDelete(vehicle);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>

      <AddTrustedVehicleDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSaveSuccess={handleSaveSuccess}
        clientId={employeeData?.clientId || null}
        employeeId={employeeData?.id || null}
        existingVehicleNumbers={trustedVehicles.map((v) => v.vehicle_no)}
        mode="create"
        initialVehicle={null}
      />

      {/* Edit Trusted Vehicle */}
      {vehicleToEdit && (
        <AddTrustedVehicleDialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) {
              setVehicleToEdit(null);
            }
          }}
          onSaveSuccess={handleSaveSuccess}
          clientId={employeeData?.clientId || null}
          employeeId={employeeData?.id || null}
          // Exclude the current vehicle's number so it can be kept unchanged
          existingVehicleNumbers={trustedVehicles
            .filter((v) => v.id !== vehicleToEdit.id)
            .map((v) => v.vehicle_no)}
          mode="edit"
          initialVehicle={{
            id: vehicleToEdit.id,
            name: vehicleToEdit.name,
            type: vehicleToEdit.type,
            vehicle_no: vehicleToEdit.vehicle_no,
            validity_from: vehicleToEdit.validity_from,
            validity_to: vehicleToEdit.validity_to,
            comments: vehicleToEdit.comments,
          }}
        />
      )}

      {/* View Trusted Vehicle */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-xl font-semibold">Trusted Vehicle Details</DialogTitle>
          </DialogHeader>
          {vehicleToView && (
            <TooltipProvider>
              <div className="flex flex-col flex-1 min-h-0">
                {/* Tabs */}
                <Tabs defaultValue="information" className="flex flex-col flex-1 min-h-0">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="information" className="text-sm">
                      Vehicle Information
                    </TabsTrigger>
                    <TabsTrigger value="comments" className="text-sm">
                      Comments
                      {vehicleToView.comments && (
                        <Badge variant="secondary" className="ml-2">
                          {vehicleToView.comments.trim().length > 0 ? 1 : 0}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="information" className="flex-1 overflow-y-auto no-scrollbar mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pr-2">
                      <div className="space-y-2.5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Visitor Name
                        </p>
                        <p className="text-sm font-medium text-gray-900 break-words leading-relaxed">
                          {vehicleToView.name || '-'}
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Type
                        </p>
                        <p className="text-sm font-medium text-gray-900 break-words leading-relaxed">
                          {vehicleToView.type || '-'}
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Vehicle Name
                        </p>
                        <p className="text-sm font-medium text-gray-900 break-words leading-relaxed">
                          {vehicleToView.vehicle_name || '-'}
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Vehicle Number
                        </p>
                        <p className="text-sm font-medium text-gray-900 break-words leading-relaxed">
                          {vehicleToView.vehicle_no || '-'}
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Validity Period
                        </p>
                        <p className="text-sm font-medium text-gray-900 break-words leading-relaxed">
                          {vehicleToView.validity_from && vehicleToView.validity_to &&
                            `${formatDate(vehicleToView.validity_from)} - ${formatDate(vehicleToView.validity_to)}`}
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Validity Status
                        </p>
                        <div className="pt-0.5">
                          {getValidityStatus(vehicleToView) ? (
                            <div className="inline-flex items-center gap-1.5 text-green-600">
                              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                              <span className="text-sm font-medium">Valid</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 text-red-500">
                              <XCircle className="h-4 w-4 flex-shrink-0" />
                              <span className="text-sm font-medium">Expired</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="comments" className="flex-1 overflow-y-auto no-scrollbar mt-0">
                    <div className="pr-2">
                      {vehicleToView.comments ? (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
                            {vehicleToView.comments}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-12 text-center">
                          <p className="text-sm text-gray-500">No comments available</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </TooltipProvider>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!vehicleToDelete} onOpenChange={(open) => !open && setVehicleToDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Trusted Vehicle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete this trusted vehicle?
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setVehicleToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default TrustedVehiclesPage;

