
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IncidentRecord } from '@/services/incidentService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Calendar, Building2, User, Ticket, AlertTriangle, Loader2 } from 'lucide-react';
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
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

const LazyIncidentsTable: React.FC<LazyIncidentsTableProps> = ({ 
  incidents, 
  loading, 
  pagination,
  onPageChange,
  onPageSizeChange 
}) => {
  const navigate = useNavigate();
  const { checkPermissions } = useIncidentPermissions();

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
    // Don't show edit button for voided incidents (if the property exists and is true)
    if (incident.is_voided) return false;
    
    const permissions = checkPermissions(
      incident.reportedById || '', 
      incident.ownerId
    );
    
    return permissions.canEdit;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    const iconClass = priority === 'Critical' ? 'text-red-500' : priority === 'High' ? 'text-orange-500' : 'text-gray-500';
    return <AlertTriangle className={`h-4 w-4 ${iconClass}`} />;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getSimpleId = (ticketId: string) => {
    return ticketId.split('-').pop() || ticketId;
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

  // Show loading skeleton during initial load
  if (loading && incidents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600">Loading incidents...</span>
          </div>
        </div>
        
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
                    {incident.reportedBy || 'Unknown'}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    {incident.owner || 'Unassigned'}
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
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination - Show whenever pagination data exists and handlers are provided */}
      {pagination && onPageChange && (
        <div className="py-4 border-t">
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
        <div className="text-center py-4 border-t">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyIncidentsTable;
