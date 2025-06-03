
import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IncidentRecord } from '@/services/incidentService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Calendar, Building2, User, Ticket, AlertTriangle, Loader2 } from 'lucide-react';
import { useLazyPagination } from '@/hooks/useLazyPagination';
import { useMemo } from 'react';

interface LazyIncidentsTableProps {
  incidents: IncidentRecord[];
  loading: boolean;
}

const LazyIncidentsTable: React.FC<LazyIncidentsTableProps> = ({ incidents, loading }) => {
  const navigate = useNavigate();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Sort incidents by ticket ID in ascending order
  const sortedIncidents = useMemo(() => {
    return [...incidents].sort((a, b) => {
      const getNumericPart = (ticketId: string) => {
        const match = ticketId.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      };
      
      const numA = getNumericPart(a.ticket_id);
      const numB = getNumericPart(b.ticket_id);
      
      return numA - numB; // Ascending order
    });
  }, [incidents]);
  
  // Use lazy pagination hook
  const {
    paginatedItems,
    hasMore,
    totalLoaded,
    loadNextPage,
    resetPagination
  } = useLazyPagination(sortedIncidents, {
    initialPageSize: 20,
    loadMoreThreshold: 5
  });

  // Reset pagination when incidents change (e.g., filters applied)
  useEffect(() => {
    resetPagination();
  }, [incidents, resetPagination]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading) {
          loadNextPage();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loading, loadNextPage]);

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

  if (loading && paginatedItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading incidents...</p>
        </div>
      </div>
    );
  }

  if (incidents.length === 0 && !loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <p className="text-gray-500">No incidents found matching your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
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
            {paginatedItems.map((incident) => (
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
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => handleEditClick(e, incident.id)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Lazy Loading Indicator */}
      {hasMore && (
        <div 
          ref={loadMoreRef}
          className="border-t border-gray-200 px-6 py-4 text-center"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-gray-500">Loading more incidents...</span>
            </div>
          ) : (
            <Button 
              variant="outline" 
              onClick={loadNextPage}
              className="text-sm"
            >
              Load More Incidents
            </Button>
          )}
        </div>
      )}
      
      {/* Results info */}
      <div className="text-sm text-gray-500 px-6 py-2 border-t text-center bg-gray-50">
        Showing {totalLoaded} of {sortedIncidents.length} incidents
        {hasMore && ` (${sortedIncidents.length - totalLoaded} more available)`}
      </div>
    </div>
  );
};

export default LazyIncidentsTable;
