
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Ticket, BanIcon, Calendar, Building2, Edit } from 'lucide-react';
import { Incident } from '@/contexts/IncidentContext';
import { getPriorityIcon } from '@/utils/priorityIcons';
import { getStatusBadgeClass } from '@/utils/statusUtils';
import { getSimpleId } from '@/utils/ticketUtils';
import { formatDate } from '@/utils/dateUtils';

interface IncidentTableRowProps {
  incident: Incident;
  onRowClick: (id: string) => void;
  onViewClick: (e: React.MouseEvent, id: string) => void;
  onEditClick: (e: React.MouseEvent, id: string) => void;
}

export const IncidentTableRow: React.FC<IncidentTableRowProps> = ({ 
  incident, 
  onRowClick, 
  onViewClick, 
  onEditClick 
}) => {
  return (
    <TableRow 
      className={`cursor-pointer hover:bg-gray-50 ${incident.isVoided ? 'bg-red-50' : ''}`}
      onClick={() => onRowClick(incident.id)}
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
            onClick={(e) => onViewClick(e, incident.id)}
          >
            View
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => onEditClick(e, incident.id)}
            disabled={incident.isVoided}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
