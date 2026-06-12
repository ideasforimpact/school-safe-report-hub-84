
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Incident } from '@/contexts/IncidentContext';
import { Table, TableBody } from '@/components/ui/table';
import { useSortedIncidents } from '@/hooks/useSortedIncidents';
import { usePagination } from '@/hooks/usePagination';
import { IncidentTableHeader } from './table/IncidentTableHeader';
import { IncidentTableRow } from './table/IncidentTableRow';
import TablePaginationBar from '@/components/common/TablePaginationBar';

interface IncidentsTableProps {
  incidents: Incident[];
}

const IncidentsTable = ({ incidents }: IncidentsTableProps) => {
  const navigate = useNavigate();
  
  // Sort incidents
  const { sortedIncidents, sortField, sortDirection, handleSort } = useSortedIncidents(incidents);
  
  // Paginate incidents - fix by adding the missing itemsPerPage parameter
  const { currentPage, setCurrentPage, totalPages, paginatedItems } = usePagination(sortedIncidents, 10); // Added the second parameter (10 items per page)

  // Navigation handlers
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
    <div className="bg-white rounded-lg shadow">
      <div className="overflow-x-auto">
        <Table>
          <IncidentTableHeader 
            sortField={sortField} 
            sortDirection={sortDirection} 
            onSort={handleSort} 
          />
          <TableBody>
            {paginatedItems.map((incident) => (
              <IncidentTableRow 
                key={incident.id}
                incident={incident}
                onRowClick={handleRowClick}
                onViewClick={handleViewClick}
                onEditClick={handleEditClick}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      
      <TablePaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default IncidentsTable;
