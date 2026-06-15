
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IncidentRecord } from '@/services/incidentService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Calendar, Building2, User, Ticket, AlertTriangle } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import TablePaginationBar from '@/components/common/TablePaginationBar';
import { useMemo } from 'react';
import Loader from '../common/Loader';

interface IncidentsDataTableProps {
  incidents: IncidentRecord[];
  loading: boolean;
}

const IncidentsDataTable: React.FC<IncidentsDataTableProps> = ({ incidents, loading }) => {
  const navigate = useNavigate();
  
  // Sort incidents by ticket ID in ascending order
  const sortedIncidents = useMemo(() => {
    return [...incidents].sort((a, b) => {
      // Extract the numeric part from ticket IDs for proper sorting
      const getNumericPart = (ticketId: string) => {
        const match = ticketId.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      };
      
      const numA = getNumericPart(a.ticket_id);
      const numB = getNumericPart(b.ticket_id);
      
      return numA - numB; // Ascending order
    });
  }, [incidents]);
  
  // Use pagination hook with 10 items per page
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
  } = usePagination(sortedIncidents, 10);

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

  if (loading) {
    return (
      <Loader text="Loading incidents..." />
    );
  }

  if (incidents.length === 0) {
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
                    {incident.status !== 'Closed' && (
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
      
      <TablePaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={sortedIncidents.length}
        pageSize={10}
        itemLabel="incidents"
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default IncidentsDataTable;
