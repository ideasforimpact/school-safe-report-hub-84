import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import { visitorService, Visitor } from '@/services/visitor/visitorService';
import { Search, Eye, RefreshCw, LogIn, Car, ArrowLeft, Download } from 'lucide-react';
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
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { VISITOR_LIST_CONSTANTS, truncateVisitorName } from '@/constant/visitorConstant';

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
  // 'all' | 'trusted_vehicle' | <visitor_vehicle_type.id>
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all');
  
  // Initialize date range with current date (today)
  const getTodayDateRange = (): DateRange => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      from: today,
      to: today,
    };
  };
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>(getTodayDateRange());
  
  // Trusted vehicles state
  const [trustedVehicles, setTrustedVehicles] = useState<Array<{
    id: string;
    vehicle_no: string;
    validity_from: string;
    validity_to: string;
  }>>([]);

  // Visitor vehicle types (from visitor_vehicle_type table)
  const [visitorVehicleTypes, setVisitorVehicleTypes] = useState<Array<{
    id: string;
    key: string;
    name: string;
    active: boolean;
  }>>([]);

  // Quick lookup map: vehicle_type id -> metadata
  const visitorVehicleTypeMap = useMemo(() => {
    const map: Record<string, { id: string; key: string; name: string; active: boolean }> = {};
    visitorVehicleTypes.forEach((type) => {
      map[type.id] = type;
    });
    return map;
  }, [visitorVehicleTypes]);

  // Ordered list for dropdown: Filter out Two Wheeler and Four Wheeler, only show Walk In and others
  const orderedVisitorVehicleTypes = useMemo(() => {
    const order = ['walk_in'];
    const excludeKeys = ['two_wheeler', 'four_wheeler']; // Exclude these from dropdown
    const byKey: Record<string, typeof visitorVehicleTypes[number]> = {};
    visitorVehicleTypes.forEach((t) => {
      byKey[t.key] = t;
    });

    const result: typeof visitorVehicleTypes = [];

    // Add Walk In first if it exists
    order.forEach((key) => {
      const item = byKey[key];
      if (item) {
        result.push(item);
      }
    });

    // Append any remaining types not in the predefined order and not excluded
    visitorVehicleTypes.forEach((t) => {
      if (!order.includes(t.key) && !excludeKeys.includes(t.key)) {
        result.push(t);
      }
    });

    return result;
  }, [visitorVehicleTypes]);

  // Toast deduplication - prevent multiple toasts for the same event within 2 seconds
  const lastToastRef = useRef<{ message: string; timestamp: number } | null>(null);
  const TOAST_DEBOUNCE_MS = 2000; // 2 seconds

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const now = Date.now();
    const lastToast = lastToastRef.current;

    // Check if this is a duplicate toast within the debounce window
    if (lastToast && lastToast.message === message && (now - lastToast.timestamp) < TOAST_DEBOUNCE_MS) {
      console.log('[Toast] Duplicate toast prevented:', message);
      return;
    }

    // Update the last toast reference
    lastToastRef.current = { message, timestamp: now };

    // Show the toast
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else {
      toast.info(message);
    }
  }, []);

  // Get client_id and employee_id from auth context
  const clientId = employeeData?.clientId;
  const employeeId = employeeData?.id;

  // Fetch visitors function
  const fetchVisitors = useCallback(async () => {
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
  }, [clientId, employeeId]);

  // Fetch trusted vehicles
  const fetchTrustedVehicles = useCallback(async () => {
    if (!clientId) {
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('trusted_vehicle')
        .select('id, vehicle_no, validity_from, validity_to')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching trusted vehicles:', error);
        return;
      }

      setTrustedVehicles((data || []) as Array<{
        id: string;
        vehicle_no: string;
        validity_from: string;
        validity_to: string;
      }>);
    } catch (error: any) {
      console.error('Error fetching trusted vehicles:', error);
    }
  }, [clientId]);

  // Fetch visitors on component mount and when clientId or employeeId changes
  useEffect(() => {
    if (clientId) {
      fetchVisitors();
      fetchTrustedVehicles();
    }
  }, [clientId, fetchVisitors, fetchTrustedVehicles]);

  // Fetch visitor vehicle types for dynamic filter options
  const fetchVisitorVehicleTypes = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('visitor_vehicle_type')
        .select('id, key, name, active')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching visitor vehicle types:', error);
        return;
      }

      setVisitorVehicleTypes((data || []) as Array<{
        id: string;
        key: string;
        name: string;
        active: boolean;
      }>);
    } catch (error) {
      console.error('Error fetching visitor vehicle types:', error);
    }
  }, []);

  useEffect(() => {
    fetchVisitorVehicleTypes();
  }, [fetchVisitorVehicleTypes]);

  // Handle realtime visitor updates
  const handleVisitorUpdate = useCallback(async (payload: any) => {
    console.log('[Realtime] Visitor update payload received:', payload);
    
    const updatedVisitor = payload.new;
    const oldVisitor = payload.old;
    const eventType = payload.eventType || (payload.new && !payload.old ? 'INSERT' : payload.old && !payload.new ? 'DELETE' : 'UPDATE');

    // Determine event type
    const isDelete = eventType === 'DELETE' || (!updatedVisitor && oldVisitor);
    const isInsert = eventType === 'INSERT' || (updatedVisitor && !oldVisitor);
    const isUpdate = eventType === 'UPDATE' || (updatedVisitor && oldVisitor);

    // For DELETE events, check old visitor; otherwise check new visitor
    const visitorToCheck = updatedVisitor || oldVisitor;
    
    // Filter by client_id and employee_id
    if (!visitorToCheck) {
      console.log('[Realtime] No visitor data in payload, skipping');
      return;
    }

    if (visitorToCheck.client_id !== clientId) {
      console.log('[Realtime] Client ID mismatch, skipping:', {
        payloadClientId: visitorToCheck.client_id,
        currentClientId: clientId
      });
      return;
    }

    // If employee_id filter is needed and doesn't match, skip
    if (employeeId && visitorToCheck.employee_id !== employeeId) {
      console.log('[Realtime] Employee ID mismatch, skipping:', {
        payloadEmployeeId: visitorToCheck.employee_id,
        currentEmployeeId: employeeId
      });
      return;
    }

    console.log('[Realtime] Processing visitor update:', {
      eventType,
      isInsert,
      isUpdate,
      isDelete,
      visitorId: visitorToCheck.id
    });

    try {
      if (isDelete) {
        // Remove deleted visitor
        setVisitors((prevVisitors) => {
          const filtered = prevVisitors.filter((v) => v.id !== oldVisitor.id);
          console.log('[Realtime] Visitor deleted, new count:', filtered.length);
          return filtered;
        });
        showToast('Visitor removed', 'info');
      } else if (isInsert) {
        console.log('[Realtime] Inserting new visitor:', updatedVisitor.id);
        // Try to fetch the complete visitor with KYC details
        // If it fails (might be a race condition), refresh the list
        try {
          const fullVisitor = await visitorService.getVisitorById(updatedVisitor.id, clientId);
          console.log('[Realtime] Fetched full visitor data:', fullVisitor);
          
          // Add new visitor at the beginning (most recent first)
          setVisitors((prevVisitors) => {
            // Check if visitor already exists (avoid duplicates)
            const exists = prevVisitors.some(v => v.id === fullVisitor.id);
            if (exists) {
              console.log('[Realtime] Visitor already exists, updating instead');
              return prevVisitors.map((v) => (v.id === fullVisitor.id ? fullVisitor : v));
            }
            console.log('[Realtime] Adding new visitor to list');
            return [fullVisitor, ...prevVisitors];
          });
          showToast('Visitor updated', 'success');
        } catch (fetchError) {
          console.error('[Realtime] Error fetching new visitor, refreshing list:', fetchError);
          // If fetching fails, refresh the entire list
          await fetchVisitors();
          showToast('Visitor updated', 'success');
        }
      } else if (isUpdate) {
        console.log('[Realtime] Updating visitor:', updatedVisitor.id);
        // Fetch the complete visitor with KYC details
        try {
          const fullVisitor = await visitorService.getVisitorById(updatedVisitor.id, clientId);
          console.log('[Realtime] Fetched updated visitor data:', fullVisitor);
          
          // Update existing visitor
          setVisitors((prevVisitors) => {
            const exists = prevVisitors.some(v => v.id === fullVisitor.id);
            if (exists) {
              return prevVisitors.map((v) => (v.id === fullVisitor.id ? fullVisitor : v));
            } else {
              // If visitor doesn't exist in list, add it
              console.log('[Realtime] Visitor not in list, adding');
              return [fullVisitor, ...prevVisitors];
            }
          });
          showToast('Visitor updated', 'info');
        } catch (fetchError) {
          console.error('[Realtime] Error fetching updated visitor, refreshing list:', fetchError);
          // If fetching fails, refresh the entire list
          await fetchVisitors();
          showToast('Visitor updated', 'info');
        }
      }
    } catch (error) {
      console.error('[Realtime] Error handling visitor update:', error);
      // Refresh the entire list on error
      await fetchVisitors();
    }
  }, [clientId, employeeId, fetchVisitors, showToast]);

  // Handle realtime visitor_kyc updates
  const handleVisitorKycUpdate = useCallback(async (payload: any) => {
    console.log('[Realtime] Visitor KYC update payload received:', payload);
    
    const updatedKyc = payload.new;
    const oldKyc = payload.old;

    // For DELETE events, use old record; otherwise use new record
    const kycToCheck = updatedKyc || oldKyc;

    // Filter by client_id and employee_id
    if (!kycToCheck) {
      console.log('[Realtime] No KYC data in payload, skipping');
      return;
    }

    if (kycToCheck.client_id !== clientId) {
      console.log('[Realtime] Client ID mismatch for KYC, skipping');
      return;
    }

    // If employee_id filter is needed and doesn't match, skip
    if (employeeId && kycToCheck.employee_id !== employeeId) {
      console.log('[Realtime] Employee ID mismatch for KYC, skipping');
      return;
    }

    try {
      // Fetch the visitor with updated KYC details
      const visitorId = updatedKyc?.visitor_id || oldKyc?.visitor_id;
      if (visitorId) {
        console.log('[Realtime] Fetching visitor with updated KYC:', visitorId);
        const fullVisitor = await visitorService.getVisitorById(visitorId, clientId);
        console.log('[Realtime] Fetched visitor with KYC:', fullVisitor);

        // Update the visitors list
        setVisitors((prevVisitors) => {
          const exists = prevVisitors.some(v => v.id === fullVisitor.id);
          if (exists) {
            return prevVisitors.map((v) => 
              v.id === fullVisitor.id ? fullVisitor : v
            );
          } else {
            // If visitor doesn't exist in list, add it
            console.log('[Realtime] Visitor not in list, adding with KYC');
            return [fullVisitor, ...prevVisitors];
          }
        });

        showToast('Visitor updated', 'info');
      } else {
        console.log('[Realtime] No visitor_id in KYC payload');
      }
    } catch (error) {
      console.error('[Realtime] Error handling visitor KYC update:', error);
      // Refresh the entire list on error
      await fetchVisitors();
    }
  }, [clientId, employeeId, fetchVisitors, showToast]);

  // Set up realtime subscription for visitors table
  // Filter by employee_id if available (more specific), otherwise by client_id
  useRealTimeSubHook({
    channelName: `visitors-${clientId}-${employeeId || 'all'}`,
    events: '*',
    table: 'visitors',
    filter: employeeId 
      ? `employee_id=eq.${employeeId}` 
      : clientId 
        ? `client_id=eq.${clientId}` 
        : undefined,
    enabled: !!(clientId || employeeId),
    onPayload: handleVisitorUpdate,
  });

  // Set up realtime subscription for visitor_kyc table
  // Filter by employee_id if available (more specific), otherwise by client_id
  useRealTimeSubHook({
    channelName: `visitor-kyc-${clientId}-${employeeId || 'all'}`,
    events: '*',
    table: 'visitor_kyc',
    filter: employeeId 
      ? `employee_id=eq.${employeeId}` 
      : clientId 
        ? `client_id=eq.${clientId}` 
        : undefined,
    enabled: !!(clientId || employeeId),
    onPayload: handleVisitorKycUpdate,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchVisitors();
    setIsRefreshing(false);
  };

  // Helper function to check if a trusted vehicle is valid (current date is within validity period)
  const isTrustedVehicleValid = useCallback((validity_from: string, validity_to: string): boolean => {
    if (!validity_from || !validity_to) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fromDate = new Date(validity_from);
    const toDate = new Date(validity_to);
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(0, 0, 0, 0);

    return today >= fromDate && today <= toDate;
  }, []);

  // Filter visitors based on search, vehicle type, status filter, and date range
  const { filteredVisitors, totalFilteredCount } = useMemo(() => {
    const filtered = visitors.filter((visitor) => {
      // Search filter - by name or vehicle number
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          visitor.name.toLowerCase().includes(searchLower) ||
          (visitor.vehicle_no && visitor.vehicle_no.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Vehicle type filter
      if (vehicleTypeFilter === 'trusted_vehicle') {
        // Trusted vehicle filter logic
        if (!visitor.vehicle_no) {
          return false; // Visitor must have a vehicle number
        }

        // Check if visitor's vehicle number matches any valid trusted vehicle
        const matchesTrustedVehicle = trustedVehicles.some((trustedVehicle) => {
          // Case-insensitive comparison of vehicle numbers (normalize spaces and special characters)
          const visitorVehicleNo = visitor.vehicle_no?.trim().replace(/\s+/g, '').toUpperCase();
          const trustedVehicleNo = trustedVehicle.vehicle_no?.trim().replace(/\s+/g, '').toUpperCase();
          
          // Must match vehicle number exactly (after normalization)
          if (!visitorVehicleNo || !trustedVehicleNo || visitorVehicleNo !== trustedVehicleNo) {
            return false;
          }

          // Check if the trusted vehicle is currently valid (within validity period)
          return isTrustedVehicleValid(trustedVehicle.validity_from, trustedVehicle.validity_to);
        });

        if (!matchesTrustedVehicle) {
          return false;
        }
      } else if (vehicleTypeFilter !== 'all') {
        // Regular vehicle type filter based on visitor_vehicle_type.id
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

    const totalCount = filtered.length;
    // Limit to maximum display count
    const displayed = filtered.slice(0, VISITOR_LIST_CONSTANTS.MAX_DISPLAY_COUNT);

    return {
      filteredVisitors: displayed,
      totalFilteredCount: totalCount
    };
  }, [visitors, searchTerm, vehicleTypeFilter, dateRange, trustedVehicles, isTrustedVehicleValid]);

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

  // Helper function to format time from date string
  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm:ss');
    } catch (error) {
      return '-';
    }
  };

  // Helper function to format date only (without time)
  const formatDateOnly = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Helper function to get vehicle type name
  const getVehicleTypeName = (vehicleType: string | null | undefined): string => {
    if (!vehicleType) return '-';
    
    const typeMeta = visitorVehicleTypeMap[vehicleType];
    if (typeMeta) {
      return typeMeta.name;
    }
    
    // Fallback for legacy types
    if (vehicleType === 'two_wheeler') return 'Two Wheeler';
    if (vehicleType === 'four_wheeler') return 'Four Wheeler';
    
    return vehicleType;
  };

  // Export visitors to Excel
  const handleExport = useCallback(() => {
    try {
      if (filteredVisitors.length === 0) {
        toast.error('No visitors to export');
        return;
      }

      // Prepare export data with only required columns
      const exportData = filteredVisitors.map(visitor => {
        // Get Aadhar details if KYC is done
        const aadharKyc = visitor.visitor_kyc?.find(kyc => {
          const docType = (kyc.document_type || '').toLowerCase();
          return docType === 'aadhar' || docType === 'aadhaar';
        });
        const aadharDetails = aadharKyc?.document_no || '-';

        // Format entry date and times
        const entryDate = formatDateOnly(visitor.created_at);
        const inTime = formatTime(visitor.created_at);
        const exitTime = visitor.is_exit ? formatTime(visitor.updated_at) : '-';

        // Base visitor data with only required columns
        const row: any = {
          'Type': getVehicleTypeName(visitor.vehicle_type),
          'Visitor Name': visitor.name || '-',
          'Vehicle number': visitor.vehicle_no || '-',
          'Phone number': visitor.mobile_no || '-',
          'Purpose': visitor.purpose || '-',
          'Whom to meet': visitor.whom_to_meet || '-',
          'Date': entryDate,
          'In Time': inTime,
          'Exit Time': exitTime,
          'Aadhar details': aadharDetails,
        };

        return row;
      });

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths for better readability
      const columnWidths = [
        { wch: 15 }, // Type
        { wch: 25 }, // Visitor Name
        { wch: 18 }, // Vehicle number
        { wch: 15 }, // Phone number
        { wch: 30 }, // Purpose
        { wch: 25 }, // Whom to meet
        { wch: 15 }, // Date
        { wch: 12 }, // In Time
        { wch: 12 }, // Exit Time
        { wch: 20 }, // Aadhar details
      ];
      
      worksheet['!cols'] = columnWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Visitors');

      // Generate filename with current date
      const today = format(new Date(), 'yyyy-MM-dd');
      const filename = `visitors_export_${today}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);
      
      toast.success(`Exported ${filteredVisitors.length} visitor(s) successfully`);
    } catch (error: any) {
      console.error('Error exporting visitors:', error);
      toast.error(error?.message || 'Failed to export visitors');
    }
  }, [filteredVisitors, visitorVehicleTypeMap]);

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
              <ArrowLeft className="h-4 w-4 mr-2" />
              List Trusted Vehicles
            </Button>
            <Button 
              onClick={handleExport}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
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
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Vehicle Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {/* Dynamic visitor vehicle types from visitor_vehicle_type table in required order */}
                  {orderedVisitorVehicleTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                  {/* Special filter for trusted vehicles - commented out */}
                  {/* <SelectItem value="trusted_vehicle">Trusted Vehicles</SelectItem> */}
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
                Showing {filteredVisitors.length} of {totalFilteredCount} visitors
                {totalFilteredCount > VISITOR_LIST_CONSTANTS.MAX_DISPLAY_COUNT && (
                  <span className="text-gray-500"> (limited to {VISITOR_LIST_CONSTANTS.MAX_DISPLAY_COUNT})</span>
                )}
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
                          (() => {
                            const typeMeta = visitorVehicleTypeMap[visitor.vehicle_type];
                            const typeKey = typeMeta?.key;

                            if (!typeKey) {
                              return <span className="text-gray-400">-</span>;
                            }

                            return (
                              <VehicleTypeIcon
                                type={typeKey}
                                size={24}
                                className={
                                  typeKey === 'two_wheeler'
                                    ? 'text-blue-600'
                                    : typeKey === 'four_wheeler'
                                    ? 'text-green-600'
                                    : 'text-gray-600'
                                }
                              />
                            );
                          })()
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium" title={visitor.name}>
                        {truncateVisitorName(visitor.name)}
                      </TableCell>
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


