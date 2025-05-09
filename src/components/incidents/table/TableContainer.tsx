
import React from 'react';
import { Table, TableBody } from '@/components/ui/table';
import { Incident } from '@/contexts/IncidentContext';
import { IncidentTableHeader, SortField } from './IncidentTableHeader';
import { IncidentTableRow } from './IncidentTableRow';
import { TablePagination } from './TablePagination';

interface TableContainerProps {
  incidents: Incident[];
  sortField: SortField;
  sortDirection: 'asc' | 'desc';
  handleSort: (field: SortField) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  onRowClick: (id: string) => void;
  onViewClick: (e: React.MouseEvent, id: string) => void;
  onEditClick: (e: React.MouseEvent, id: string) => void;
}

export const TableContainer: React.FC<TableContainerProps> = ({
  incidents,
  sortField,
  sortDirection,
  handleSort,
  currentPage,
  totalPages,
  setCurrentPage,
  onRowClick,
  onViewClick,
  onEditClick
}) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <IncidentTableHeader 
            sortField={sortField} 
            sortDirection={sortDirection} 
            onSort={handleSort} 
          />
          <TableBody>
            {incidents.map((incident) => (
              <IncidentTableRow 
                key={incident.id}
                incident={incident}
                onRowClick={onRowClick}
                onViewClick={onViewClick}
                onEditClick={onEditClick}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <TablePagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};
