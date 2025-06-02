
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { IncidentRecord } from '@/services/incidentService';
import { formatDate } from '@/utils/dateUtils';
import { getSimpleId } from '@/utils/ticketUtils';
import { useIncidentTableNavigation } from '@/hooks/useIncidentTableNavigation';
import { Edit, Eye } from 'lucide-react';

interface IncidentsDataTableProps {
  incidents: IncidentRecord[];
  loading?: boolean;
}

const IncidentsDataTable: React.FC<IncidentsDataTableProps> = ({ incidents, loading }) => {
  const { handleViewClick, handleEditClick } = useIncidentTableNavigation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600">Loading incidents...</p>
        </div>
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Records</h2>
          <p className="text-gray-600">There are no incidents to display.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden w-full">
      <div className="overflow-x-auto">
        <Table className="w-full min-w-[1200px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Ticket ID</TableHead>
              <TableHead className="w-[120px]">Type</TableHead>
              <TableHead className="w-[150px]">Category</TableHead>
              <TableHead className="w-[150px]">Subcategory</TableHead>
              <TableHead className="w-[150px]">Submitted Date</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[120px]">Priority</TableHead>
              <TableHead className="w-[150px]">Reported By</TableHead>
              <TableHead className="w-[150px]">Owner</TableHead>
              <TableHead className="w-[120px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.map((incident) => (
              <TableRow key={incident.id}>
                <TableCell className="font-medium">
                  {getSimpleId(incident.ticket_id)}
                </TableCell>
                <TableCell>{incident.type}</TableCell>
                <TableCell>{incident.category}</TableCell>
                <TableCell>{incident.subcategory || '-'}</TableCell>
                <TableCell>{formatDate(incident.createdAt)}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {incident.status}
                  </span>
                </TableCell>
                <TableCell>{incident.priority}</TableCell>
                <TableCell>{incident.reportedBy}</TableCell>
                <TableCell>{incident.owner || 'Unassigned'}</TableCell>
                <TableCell className="text-center">
                  <div className="flex space-x-2 justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleViewClick(e, incident.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleEditClick(e, incident.id)}
                      className="h-8 w-8 p-0"
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
    </div>
  );
};

export default IncidentsDataTable;
