
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IncidentRecord } from '@/services/incidentService';
import { formatDate } from '@/utils/dateUtils';
import { getSimpleId } from '@/utils/ticketUtils';

interface IncidentsDataTableProps {
  incidents: IncidentRecord[];
  loading?: boolean;
}

const IncidentsDataTable: React.FC<IncidentsDataTableProps> = ({ incidents, loading }) => {
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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Subcategory</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Facility</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead>Owner</TableHead>
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
                <TableCell className="max-w-xs truncate">
                  {incident.description}
                </TableCell>
                <TableCell>{formatDate(incident.date)}</TableCell>
                <TableCell>{incident.location}</TableCell>
                <TableCell>{incident.facility || '-'}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {incident.status}
                  </span>
                </TableCell>
                <TableCell>{incident.priority}</TableCell>
                <TableCell>{incident.reportedBy}</TableCell>
                <TableCell>{incident.owner || 'Unassigned'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default IncidentsDataTable;
