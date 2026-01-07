import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Layout from '@/components/layout/Layout';
import { visitorService, Visitor } from '@/services/visitor/visitorService';
import { Search, Eye, RefreshCw, LogIn, Car, ArrowLeft, Download, ShieldCheck } from 'lucide-react';
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
  
  // Trusted vehicles state (for filtering)
  const [trustedVehicles, setTrustedVehicles] = useState<Array<{
    id: string;
    vehicle_no: string;
    validity_from: string;
    validity_to: string;
  }>>([]);

  // Unified list item type (combines visitors and trusted vehicles)
  interface UnifiedListItem {
    id: string;
    name: string;
    vehicle_no: string | null;
    vehicle_type: string | null;
    created_at: string;
    in_time: string | null; // For trusted vehicles: in_time, for visitors: created_at
    exit_time: string | null;
    is_trusted_vehicle: boolean;
    // For visitors only
    visitor_id?: string;
    // For trusted vehicles only
    trusted_vehicle_id?: string;
  }

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

  // Unified list state (combines visitors and trusted vehicles)
  const [unifiedList, setUnifiedList] = useState<UnifiedListItem[]>([]);

  // Transform function to create unified list from visitors and trusted vehicles
  const transformToUnifiedList = useCallback((visitors: Visitor[], trustedVehiclesData: any[]): UnifiedListItem[] => {
    const unified: UnifiedListItem[] = [];

    // Add visitors
    visitors.forEach((visitor) => {
      unified.push({
        id: visitor.id,
        name: visitor.name,
        vehicle_no: visitor.vehicle_no || null,
        vehicle_type: visitor.vehicle_type || null,
        created_at: visitor.created_at,
        in_time: visitor.created_at, // For visitors, use created_at as in_time
        exit_time: visitor.exit_time || null,
        is_trusted_vehicle: false,
        visitor_id: visitor.id,
      });
    });

    // Add trusted vehicles with entry_status = 'IN'
    trustedVehiclesData.forEach((tv) => {
      unified.push({
        id: tv.id,
        name: tv.vehicle_name || tv.name || '',
        vehicle_no: tv.vehicle_no || null,
        vehicle_type: null, // Trusted vehicles don't have vehicle_type, will show default icon
        created_at: tv.created_at,
        in_time: tv.in_time || tv.created_at, // Use in_time if available, else created_at
        exit_time: tv.exit_time || null,
        is_trusted_vehicle: true,
        trusted_vehicle_id: tv.id,
      });
    });

    // Sort by created_at descending (newest first)
    return unified.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
  }, []);

  // Fetch visitors function
  const fetchVisitors = useCallback(async () => {
    if (!clientId) {
      toast.error('Client ID is required to fetch visitors');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch visitors
      const visitorsData = await visitorService.getVisitors(clientId, employeeId);
      setVisitors(visitorsData);

      // Fetch trusted vehicles with entry_status = 'IN' and all required fields
      const { data: trustedVehiclesData, error: trustedVehiclesError } = await (supabase as any)
        .from('trusted_vehicle')
        .select('id, vehicle_name, name, vehicle_no, client_id, employee_id, entry_status, in_time, exit_time, created_at, updated_at, validity_from, validity_to')
        .eq('client_id', clientId)
        .eq('entry_status', 'IN');

      if (employeeId) {
        // Optionally filter by employee_id if provided
        trustedVehiclesData?.filter((tv: any) => tv.employee_id === employeeId);
      }

      if (trustedVehiclesError) {
        console.error('Error fetching trusted vehicles:', trustedVehiclesError);
      }

      // Transform to unified list
      const unified = transformToUnifiedList(visitorsData, trustedVehiclesData || []);
      setUnifiedList(unified);

      // Also keep trusted vehicles for filtering logic
      const { data: allTrustedVehicles, error: allTrustedError } = await (supabase as any)
        .from('trusted_vehicle')
        .select('id, vehicle_no, validity_from, validity_to')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (!allTrustedError && allTrustedVehicles) {
        setTrustedVehicles((allTrustedVehicles || []) as Array<{
          id: string;
          vehicle_no: string;
          validity_from: string;
          validity_to: string;
        }>);
      }
    } catch (error: any) {
      console.error('Error fetching visitors:', error);
      toast.error(error?.message || 'Failed to fetch visitors');
    } finally {
      setLoading(false);
    }
  }, [clientId, employeeId, transformToUnifiedList]);

  // Fetch trusted vehicles (for filtering only)
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
        .eq('active', true)
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
      // Refresh the entire list to ensure unified list is updated
      // This includes both visitors and trusted vehicles
      await fetchVisitors();
      
      if (isDelete) {
        showToast('Visitor removed', 'info');
      } else if (isInsert) {
        showToast('Visitor updated', 'success');
      } else if (isUpdate) {
        showToast('Visitor updated', 'info');
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
      // Refresh the entire list to ensure unified list is updated
      await fetchVisitors();
      showToast('Visitor updated', 'info');
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

  // Handle realtime trusted vehicle updates
  const handleTrustedVehicleUpdate = useCallback(async (payload: any) => {
    console.log('[Realtime] Trusted vehicle update payload received:', payload);
    // Refresh the entire list to ensure unified list is updated
    await fetchVisitors();
    showToast('Trusted vehicle updated', 'info');
  }, [fetchVisitors, showToast]);

  // Set up realtime subscription for trusted_vehicle table
  useRealTimeSubHook({
    channelName: `trusted-vehicle-${clientId}-${employeeId || 'all'}`,
    events: '*',
    table: 'trusted_vehicle',
    filter: employeeId 
      ? `employee_id=eq.${employeeId}` 
      : clientId 
        ? `client_id=eq.${clientId}` 
        : undefined,
    enabled: !!(clientId || employeeId),
    onPayload: handleTrustedVehicleUpdate,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchVisitors();
    setIsRefreshing(false);
  };

  // Helper function to check if a trusted vehicle is valid.
  // NOTE: This mirrors the logic in TrustedVehiclesPage.getValidityStatus:
  // A vehicle is considered valid as long as its end date has not passed,
  // even if the start date is in the future.
  const isTrustedVehicleValid = useCallback((validity_from: string, validity_to: string): boolean => {
    if (!validity_to) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toDate = new Date(validity_to);
    toDate.setHours(0, 0, 0, 0);

    return toDate >= today;
  }, []);

  // Filter unified list based on search, vehicle type, status filter, and date range
  const { filteredVisitors, totalFilteredCount } = useMemo(() => {
    const filtered = unifiedList.filter((item) => {
      // Search filter - by name or vehicle number
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          item.name.toLowerCase().includes(searchLower) ||
          (item.vehicle_no && item.vehicle_no.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Vehicle type filter
      if (vehicleTypeFilter === 'trusted_vehicle') {
        // Show only trusted vehicles
        if (!item.is_trusted_vehicle) {
          return false;
        }
      } else if (vehicleTypeFilter !== 'all') {
        // Regular vehicle type filter - only applies to visitors (not trusted vehicles)
        if (item.is_trusted_vehicle) {
          return false; // Trusted vehicles don't have vehicle_type, exclude them
        }
        if (item.vehicle_type !== vehicleTypeFilter) {
          return false;
        }
      }

      // Date range filter
      if (dateRange?.from || dateRange?.to) {
        const entryDate = new Date(item.created_at);
        
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
  }, [unifiedList, searchTerm, vehicleTypeFilter, dateRange]);

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

  // Helper function to format time from date string (with AM/PM) - time only
  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      // Use 12-hour format with AM/PM (time only, no seconds)
      return format(new Date(dateString), 'hh:mm a');
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

  // Helper function to format document type name to readable format
  const formatDocumentTypeName = (documentType: string): string => {
    const typeMap: Record<string, string> = {
      'aadhar': 'Aadhar Card',
      'aadhaar': 'Aadhar Card',
      'pan': 'PAN Card',
      'pan_card': 'PAN Card',
      'driving_license': 'Driving License',
      'driving_licence': 'Driving Licence',
      'passport': 'Passport',
      'voter_id': 'Voter ID',
      'bank_account': 'Bank Account',
      'bank_statement': 'Bank Statement',
      'manual': 'Manual Verification',
      'other_documents': 'Other Documents',
      'other': 'Other Document',
    };
    
    const lowerType = documentType.toLowerCase();
    if (typeMap[lowerType]) {
      return typeMap[lowerType];
    }
    
    // Fallback: convert snake_case to Title Case
    return documentType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Export visitors to Excel
  const handleExport = useCallback(() => {
    try {
      if (filteredVisitors.length === 0) {
        toast.error('No visitors to export');
        return;
      }

      // Prepare export data with only required columns
      const exportData = filteredVisitors.map(item => {
        // For trusted vehicles, we don't have visitor-specific fields
        // For regular visitors, we need to find the original visitor to get KYC details
        let phoneNumber = '-';
        let purpose = '-';
        let whomToMeet = '-';
        let documentNames = '-';
        let documentNumbers = '-';

        if (!item.is_trusted_vehicle && item.visitor_id) {
          // Find the original visitor to get full details
          const originalVisitor = visitors.find(v => v.id === item.visitor_id);
          if (originalVisitor) {
            phoneNumber = originalVisitor.mobile_no || '-';
            purpose = originalVisitor.purpose || '-';
            whomToMeet = originalVisitor.whom_to_meet || '-';
            
            // Collect all KYC document types and their values
            if (originalVisitor.visitor_kyc && originalVisitor.visitor_kyc.length > 0) {
              const docNames: string[] = [];
              const docNumbers: string[] = [];
              
              originalVisitor.visitor_kyc.forEach(kyc => {
                if (kyc.document_type && kyc.document_no) {
                  // Format document type name to readable format
                  docNames.push(formatDocumentTypeName(kyc.document_type));
                  docNumbers.push(kyc.document_no);
                }
              });
              
              if (docNames.length > 0) {
                documentNames = docNames.join(', ');
                documentNumbers = docNumbers.join(', ');
              }
            }
          }
        }

        // Format entry date and times
        const entryDate = formatDateOnly(item.created_at);
        const inTime = formatTime(item.in_time);
        const exitTime = formatTime(item.exit_time);

        // Base data with only required columns
        const row: any = {
          'Type': item.is_trusted_vehicle ? 'Trusted Vehicle' : getVehicleTypeName(item.vehicle_type),
          'Visitor Name': item.name || '-',
          'Vehicle number': item.vehicle_no || '-',
          'Phone number': phoneNumber,
          'Purpose': purpose,
          'Whom to meet': whomToMeet,
          'Date': entryDate,
          'In Time': inTime,
          'Exit Time': exitTime,
          'Document Name': documentNames,
          'Document No': documentNumbers,
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
        { wch: 25 }, // Document Name
        { wch: 30 }, // Document No
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
  }, [filteredVisitors, visitors, visitorVehicleTypeMap]);

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
                  {/* Special filter for trusted vehicles */}
                  <SelectItem value="trusted_vehicle">Trusted Vehicles</SelectItem>
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
                    <TableHead>Type of vehicle</TableHead>
                    <TableHead>Visitor Name</TableHead>
                    <TableHead>Vehicle Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>In Time</TableHead>
                    <TableHead>Exit Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisitors.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.is_trusted_vehicle ? (
                          // Trusted vehicle: show default vehicle icon
                          <Car className="h-6 w-6 text-gray-600" />
                        ) : item.vehicle_type ? (
                          // Regular visitor: show visitor type icon
                          (() => {
                            const typeMeta = visitorVehicleTypeMap[item.vehicle_type];
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
                      <TableCell className="font-medium" title={item.name}>
                        {truncateVisitorName(item.name)}
                      </TableCell>
                      <TableCell>
                        {item.vehicle_no ? (
                          <div className="flex items-center gap-2">
                            <span>{item.vehicle_no}</span>
                            {item.is_trusted_vehicle && (
                              <Badge 
                                variant="secondary" 
                                className="bg-blue-100 text-blue-700 border-blue-300 px-1.5 py-0.5 h-5 flex items-center"
                                title="Trusted Vehicle"
                              >
                                <ShieldCheck className="h-3 w-3" />
                              </Badge>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{formatEntryDate(item.created_at)}</TableCell>
                      <TableCell>{formatTime(item.in_time)}</TableCell>
                      <TableCell>{formatTime(item.exit_time)}</TableCell>
                      <TableCell className="text-right">
                        {item.is_trusted_vehicle ? (
                          // Trusted vehicles don't have detail view (or can be disabled)
                          <span className="text-gray-400">-</span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedVisitorId(item.visitor_id || item.id);
                              setIsDialogOpen(true);
                            }}
                            title="View visitor details"
                          >
                            <Eye className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
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


