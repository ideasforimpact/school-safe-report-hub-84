
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Incident, IncidentStatus } from '@/contexts/IncidentContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Edit, 
  Ticket, 
  BanIcon, 
  Calendar, 
  Building2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { getPriorityIcon } from '@/utils/priorityIcons';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface IncidentsTableProps {
  incidents: Incident[];
}

type SortField = 'ticketId' | 'date' | 'category' | 'priority' | 'location' | 'facility' | 'status';
type SortDirection = 'asc' | 'desc';

// Function to extract simple numeric ID from ticket ID (1-1000)
// Moved this function to the top level scope before it's used
const getSimpleId = (ticketId: string): string => {
  // Extract numbers from the ticket ID and convert to number
  const numbers = ticketId.match(/\d+/g);
  if (!numbers || numbers.length === 0) return "1";
  
  // Get the first number and ensure it's between 1 and 1000
  const idNumber = parseInt(numbers[0], 10) % 1000;
  return idNumber === 0 ? "1000" : idNumber.toString();
};

const IncidentsTable = ({ incidents }: IncidentsTableProps) => {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Sort incidents
  const sortedIncidents = [...incidents].sort((a, b) => {
    switch (sortField) {
      case 'ticketId':
        return sortDirection === 'asc' 
          ? getSimpleId(a.ticketId).localeCompare(getSimpleId(b.ticketId))
          : getSimpleId(b.ticketId).localeCompare(getSimpleId(a.ticketId));
      case 'date':
        return sortDirection === 'asc'
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'category':
        return sortDirection === 'asc'
          ? a.category.localeCompare(b.category)
          : b.category.localeCompare(a.category);
      case 'priority':
        const priorityOrder = { 'Critical': 3, 'High': 2, 'Medium': 1, 'Low': 0 };
        const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
        const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
        return sortDirection === 'asc' ? priorityA - priorityB : priorityB - priorityA;
      case 'location':
        return sortDirection === 'asc'
          ? (a.location || '').localeCompare(b.location || '')
          : (b.location || '').localeCompare(a.location || '');
      case 'facility':
        return sortDirection === 'asc'
          ? (a.facility || '').localeCompare(b.facility || '')
          : (b.facility || '').localeCompare(a.facility || '');
      case 'status':
        return sortDirection === 'asc'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      default:
        return 0;
    }
  });
  
  // Calculate pagination
  const totalPages = Math.ceil(sortedIncidents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedIncidents = sortedIncidents.slice(startIndex, startIndex + itemsPerPage);
  
  // Handle column sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if already sorting by this field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };
  
  // Get column header with sort indicators
  const getSortableHeader = (field: SortField, label: string) => {
    return (
      <div 
        className="flex items-center cursor-pointer"
        onClick={() => handleSort(field)}
      >
        <span>{label}</span>
        <div className="ml-1 flex flex-col">
          <ChevronUp 
            className={`h-3 w-3 ${sortField === field && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`}
          />
          <ChevronDown 
            className={`h-3 w-3 mt-[-3px] ${sortField === field && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`}
          />
        </div>
      </div>
    );
  };
  
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeClass = (status: IncidentStatus, isVoided?: boolean) => {
    if (isVoided) {
      return 'bg-red-100 text-red-800';
    }
    
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

  if (incidents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-8 text-center">
          <p className="text-gray-500">No incidents found matching your filters</p>
        </div>
      </div>
    );
  }

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
  
  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
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

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{getSortableHeader('ticketId', 'ID')}</TableHead>
              <TableHead className="text-left">{getSortableHeader('date', 'Date')}</TableHead>
              <TableHead className="text-left">{getSortableHeader('category', 'Category')}</TableHead>
              <TableHead className="text-left">{getSortableHeader('priority', 'Priority')}</TableHead>
              <TableHead className="text-left">{getSortableHeader('location', 'Location')}</TableHead>
              <TableHead className="text-left">{getSortableHeader('facility', 'Facility')}</TableHead>
              <TableHead className="text-left">{getSortableHeader('status', 'Status')}</TableHead>
              <TableHead className="text-left">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedIncidents.map((incident) => (
              <TableRow 
                key={incident.id} 
                className={`cursor-pointer hover:bg-gray-50 ${incident.isVoided ? 'bg-red-50' : ''}`}
                onClick={() => handleRowClick(incident.id)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <Ticket className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="ml-1">{getSimpleId(incident.ticketId)}</span>
                    {incident.isVoided && (
                      <BanIcon className="h-4 w-4 ml-2 text-red-600" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-left">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    {formatDate(incident.date)}
                  </div>
                </TableCell>
                <TableCell className="text-left">{incident.category}</TableCell>
                <TableCell className="text-left">
                  <div className="flex items-center">
                    {React.createElement(getPriorityIcon(incident.priority))}
                    <span className="ml-2">{incident.priority || 'Medium'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-left">{incident.location}</TableCell>
                <TableCell className="text-left">
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                    {incident.facility || 'Not specified'}
                  </div>
                </TableCell>
                <TableCell className="text-left">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(incident.status, incident.isVoided)}`}>
                    {incident.isVoided ? 'Voided' : incident.status}
                  </span>
                </TableCell>
                <TableCell className="text-left">
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => handleViewClick(e, incident.id)}
                    >
                      View
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => handleEditClick(e, incident.id)}
                      disabled={incident.isVoided}
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
      
      {totalPages > 1 && (
        <div className="py-4 border-t">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                {currentPage === 1 ? (
                  <PaginationPrevious 
                    className="pointer-events-none opacity-50"
                    aria-disabled="true"
                  />
                ) : (
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                      isActive={currentPage === pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              
              <PaginationItem>
                {currentPage === totalPages ? (
                  <PaginationNext 
                    className="pointer-events-none opacity-50" 
                    aria-disabled="true"
                  />
                ) : (
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="cursor-pointer"
                  />
                )}
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default IncidentsTable;
