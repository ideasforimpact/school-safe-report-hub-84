import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IncidentRecord } from '@/services/incidentService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Calendar, Building2, User, Ticket, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIncidentPermissions } from '@/utils/incidentPermissions';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AIRecommendationDialog from '@/components/incidents/AIRecommendationDialog';
import { formatDate } from "@/lib/Dateformat";
import Loader from "@/components/common/Loader";
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getCurrentUser } from '@/store/authSelectors';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';
interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  pageSize: number;
}

interface LazyIncidentsTableProps {
  incidents: IncidentRecord[];
  loading: boolean;
  hasFetched: boolean;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRefreshIncidents?: () => void | Promise<void>; // Callback to refresh incident list
}

const LazyIncidentsTable: React.FC<LazyIncidentsTableProps> = ({ 
  incidents, 
  loading, 
  hasFetched,
  pagination,
  onPageChange,
  onPageSizeChange,
  onRefreshIncidents
}) => {
  const navigate = useNavigate();
  const { checkPermissions } = useIncidentPermissions();
  const { user } = useAuth();
  const [aiOpen, setAiOpen] = React.useState(false);
  const [aiPayload, setAiPayload] = React.useState<any | null>(null);
  const { state } = useEmployeeStore();
  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();
    
  const currentUser = getCurrentUser(state);

  const handleRowClick = (incidentId: string) => {
    navigate(`/incident/${incidentId}`);
  };

  const handleViewClick = (e: React.MouseEvent, incidentId: string) => {
    e.stopPropagation();
    navigate(`/incident/${incidentId}`);
  };

  const handleEditClick = (e: React.MouseEvent, incidentId: string) => {
    e.stopPropagation();
    navigate(`/incident/${incidentId}/edit`);
  };

  // Check if user can edit a specific incident
  const canEditIncident = (incident: IncidentRecord) => {
    if (isReadOnlySwitchedContext) return false;
    // Don't show edit button for voided incidents (if the property exists and is true)
    if (incident.is_voided) return false;
    
    // Don't show edit button for closed incidents
    if (incident.status?.toLowerCase() === 'closed') return false;
    
    const permissions = checkPermissions(
      incident.reportedById || '', 
      incident.ownerId
    );
    
    return permissions.canEdit;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-red-100 text-red-800 border-red-200'; // Open status is red
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'closed':
        return 'bg-green-100 text-green-800 border-green-200'; // Closed status is green
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    const iconClass = priority === 'Critical' ? 'text-red-500' : priority === 'High' ? 'text-orange-500' : 'text-gray-500';
    return <AlertTriangle className={`h-4 w-4 ${iconClass}`} />;
  };

  const getSimpleId = (ticketId: string) => {
    return ticketId.split('-').pop() || ticketId;
  };

  const truncate = (text?: string) => {
    if (!text) return '';
    return text.length > 10 ? `${text.slice(0, 10)}...` : text;
  };

  const logIncidentForAi = async (e: React.MouseEvent, incident: IncidentRecord) => {
    e.stopPropagation();
    let policyDocs: string[] = [];
    try {
      if (user?.clientId) {
        const { data, error } = await supabase.functions.invoke('edusafe-resource-client', {
          body: { action: 'fetch_resources', data: { client_id: user.clientId } }
        });
        if (!error) {
          policyDocs = (data?.resources || []).map((r: any) => r?.title).filter(Boolean);
        }
      }
    } catch (_) {
      // no-op; proceed without policy docs
    }
    const payload: any = {
      id: incident.id,
      category: incident.category,
      sub_category: (incident as any).subcategory,
      facility: (incident as any).facility,
      location: (incident as any).location,
      description: (incident as any).description,
      root_cause: (incident as any).root_cause ?? null,
      learning_points: (incident as any).learning_points ?? null,
      action_taken: (incident as any).action_taken ?? null,
      policy_docs: policyDocs,
    };
    // Include the full incident object with recommended_action
    const fullIncident = incidents.find(inc => inc.id === incident.id);
    setAiPayload({
      ...payload,
      ...fullIncident, // Include all incident fields including recommended_action
      recommended_action: fullIncident?.recommended_action || null
    });
    setAiOpen(true);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    if (!pagination) return [];
    
    const pageNumbers = [];
    const maxVisiblePages = 5;
    const { currentPage, totalPages } = pagination;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show first page, current page, and pages around it
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= Math.min(maxVisiblePages, totalPages); i++) {
          pageNumbers.push(i);
        }
        if (totalPages > maxVisiblePages) pageNumbers.push(-1); // Ellipsis
      } else if (currentPage > totalPages - 3) {
        // Near the end
        pageNumbers.push(1, -1); // First page and ellipsis
        for (let i = Math.max(totalPages - maxVisiblePages + 3, 1); i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Middle
        pageNumbers.push(1, -1); // First page and ellipsis
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push(-1, totalPages); // Ellipsis and last page
      }
    }
    
    return pageNumbers;
  };

  // Show loading skeleton during initial load (when loading and no data yet)
  if (loading && incidents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
          <Loader text="Loading incidents..." />
        
        
        {/* Loading skeleton table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Ticket #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // Show no results message if no incidents and not loading
  if (incidents.length === 0 && !loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <p className="text-gray-500">No incidents found matching your filters</p>
        </div>
      </div>
    );
  }

  console.log('LazyIncidentsTable - Pagination data:', pagination);
  console.log('LazyIncidentsTable - Has pagination handlers:', { onPageChange: !!onPageChange, onPageSizeChange: !!onPageSizeChange });

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <AIRecommendationDialog 
        open={aiOpen} 
        onOpenChange={setAiOpen} 
        incidentJson={aiPayload} 
        incidentId={aiPayload?.id} 
        incident={aiPayload}
        onRefresh={onRefreshIncidents}
      />
      {/* Page size selector */}
      {pagination && onPageSizeChange && (
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Show</span>
            <Select 
              value={pagination.pageSize.toString()} 
              onValueChange={(value) => onPageSizeChange(parseInt(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-700">entries</span>
          </div>
          <div className="text-sm text-gray-500">
            Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} incidents
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Ticket #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Facility</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Assigned to</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.map((incident) => (
              <TableRow 
                key={incident.id}
                className="cursor-pointer transition-colors hover:bg-gray-50"
                onClick={() => handleRowClick(incident.id)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <Ticket className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="ml-1">{getSimpleId(incident.ticket_id)}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    {formatDate(incident.date)}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{incident.category}</span>
                    <span className="text-xs text-gray-500">{incident.subcategory}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center">
                    {getPriorityIcon(incident.priority)}
                    <span className="ml-2">{incident.priority || 'Medium'}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                    {incident.facility || 'Not specified'}
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge variant="outline" className={getStatusBadgeClass(incident.status)}>
                    {incident.status}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <span title={incident.reportedBy || ''}>{truncate(incident.reportedBy || 'Unknown')}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <span title={incident.owner || ''}>{truncate(incident.owner || 'Unassigned')}</span>
                  </div>
                </TableCell>
                
                <TableCell className="text-right">
                  <div className="flex space-x-2 justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => handleViewClick(e, incident.id)}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                    {canEditIncident(incident) && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => handleEditClick(e, incident.id)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    )}
                    {currentUser?.client?.incidentRecommendedActionsEnabled !== false && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Recommended Actions"
                      onClick={(e) => logIncidentForAi(e, incident)}
                    >
                      <Sparkles className="h-4 w-4 text-black" />
                      <span className="sr-only">Recommended Actions</span>
                    </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination - Always show when pagination data exists and handlers are provided */}
      {pagination && onPageChange && (
        <div className="py-4 border-t">
          {/* Page info - Always show current page context */}
          <div className="flex items-center justify-between px-6 mb-3">
            <div className="text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
            {pagination.totalPages === 1 && (
              <div className="text-sm text-gray-500">
                {pagination.totalCount === pagination.pageSize ? 
                  `All ${pagination.totalCount} records displayed` : 
                  `Showing all ${pagination.totalCount} records on 1 page`
                }
              </div>
            )}
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                {pagination.currentPage === 1 ? (
                  <PaginationPrevious 
                    aria-disabled="true"
                    className="pointer-events-none opacity-50"
                  />
                ) : (
                  <PaginationPrevious 
                    onClick={() => onPageChange(Math.max(pagination.currentPage - 1, 1))}
                    className="cursor-pointer"
                  />
                )}
              </PaginationItem>
              
              {getPageNumbers().map((pageNum, index) => 
                pageNum === -1 ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <span className="flex h-10 w-10 items-center justify-center">...</span>
                  </PaginationItem>
                ) : (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={pagination.currentPage === pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              
              <PaginationItem>
                {pagination.currentPage === pagination.totalPages ? (
                  <PaginationNext 
                    aria-disabled="true" 
                    className="pointer-events-none opacity-50"
                  />
                ) : (
                  <PaginationNext 
                    onClick={() => onPageChange(Math.min(pagination.currentPage + 1, pagination.totalPages))}
                    className="cursor-pointer"
                  />
                )}
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      
      {/* Loading indicator for page changes */}
      {loading && incidents.length > 0 && (
        <div className="border-t">
          <Loader text="Loading incidents..." />
        </div>
      )}
    </div>
  );
};

export default LazyIncidentsTable;
