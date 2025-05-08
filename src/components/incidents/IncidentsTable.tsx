
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Incident } from '@/contexts/IncidentContext';
import { Table, TableBody } from '@/components/ui/table';
import { useSortedIncidents } from '@/hooks/useSortedIncidents';
import { usePagination } from '@/hooks/usePagination';
import { IncidentTableHeader } from './table/IncidentTableHeader';
import { IncidentTableRow } from './table/IncidentTableRow';
import { TablePagination } from './table/TablePagination';
import { FileX, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface IncidentsTableProps {
  incidents: Incident[];
}

const IncidentsTable = ({ incidents }: IncidentsTableProps) => {
  const navigate = useNavigate();
  
  // Sort incidents
  const { sortedIncidents, sortField, sortDirection, handleSort } = useSortedIncidents(incidents);
  
  // Paginate incidents
  const { currentPage, setCurrentPage, totalPages, paginatedItems } = usePagination(sortedIncidents, 10);

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
      <Card className="mt-4">
        <CardContent className="p-0">
          <div className="text-center py-12">
            <FileX className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-3">No incidents found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              There are no incidents matching your current filters or no incidents have been reported yet.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => navigate('/report-incident')}>
                Report New Incident
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      {sortedIncidents.length === 0 && incidents.length > 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
          <p className="text-amber-800">Filtering applied. No matching incidents found.</p>
          <Button variant="ghost" className="ml-auto" onClick={() => window.location.reload()}>
            Reset Filters
          </Button>
        </div>
      ) : null}
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
        
        {totalPages > 1 && (
          <TablePagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};

export default IncidentsTable;
