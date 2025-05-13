
import React from 'react';
import { Incident } from '@/contexts/IncidentContext';
import { useSortedIncidents } from '@/hooks/useSortedIncidents';
import { usePagination } from '@/hooks/usePagination';
import { useIncidentTableNavigation } from '@/hooks/useIncidentTableNavigation';
import { TableContainer } from './table/TableContainer';
import { EmptyState } from './table/EmptyState';

interface IncidentsTableProps {
  incidents: Incident[];
}

const IncidentsTable = ({ incidents }: IncidentsTableProps) => {
  // Sort incidents
  const { sortedIncidents, sortField, sortDirection, handleSort } = useSortedIncidents(incidents);
  
  // Paginate incidents
  const { currentPage, setCurrentPage, totalPages, paginatedItems } = usePagination(sortedIncidents, 10);

  // Navigation handlers
  const { handleRowClick, handleViewClick, handleEditClick } = useIncidentTableNavigation();

  // Render the appropriate content based on the incidents
  if (incidents.length === 0) {
    return <EmptyState hasIncidents={false} hasFilteredIncidents={false} />;
  }

  return (
    <div>
      {sortedIncidents.length === 0 && incidents.length > 0 ? (
        <EmptyState hasIncidents={true} hasFilteredIncidents={false} />
      ) : null}
      
      <TableContainer 
        incidents={paginatedItems}
        sortField={sortField}
        sortDirection={sortDirection}
        handleSort={handleSort}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        onRowClick={handleRowClick}
        onViewClick={handleViewClick}
        onEditClick={handleEditClick}
      />
    </div>
  );
};

export default IncidentsTable;
