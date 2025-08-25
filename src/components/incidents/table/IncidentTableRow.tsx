
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Ticket, BanIcon, Calendar, Building2, Edit, Eye, User } from 'lucide-react';
import { Incident } from '@/contexts/IncidentContext';
import { getPriorityIcon } from '@/utils/priorityIcons';
import { getStatusBadgeClass } from '@/utils/statusUtils';
import { getSimpleId } from '@/utils/ticketUtils';
import { formatDate } from '@/utils/dateUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIncidentPermissions } from '@/utils/incidentPermissions';

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
  const { checkPermissions, hasIncidentAdmin, isSuperAdmin, currentEmployeeId } = useIncidentPermissions();
  
  // Debug logging to identify permission issues
  console.log('🔍 Permission Debug for incident:', incident.ticketId);
  console.log('📋 Current user ID:', currentEmployeeId);
  console.log('👤 Incident created by ID:', incident.reportedBy?.id);
  console.log('👥 Incident assigned to ID:', incident.owner?.id);
  console.log('🔑 User has incident admin:', hasIncidentAdmin);
  console.log('⭐ User is super admin:', isSuperAdmin);
  console.log('❌ Incident is voided:', incident.isVoided);
  
  // Check if current user can edit this incident
  const permissions = checkPermissions(
    incident.reportedBy?.id || '', 
    incident.owner?.id
  );
  
  console.log('✅ Permission check result:', permissions);
  
  // Show edit button only if user has edit permission AND incident is not voided AND not closed
  const canShowEditButton = permissions.canEdit && !incident.isVoided && incident.status !== 'Closed';
  
  console.log('🎯 Final decision - Show edit button:', canShowEditButton);
  
  // Add debug logging to check incident ID
  console.log(`Rendering row for incident: ${incident.id}, ticketId: ${incident.ticketId}`);
  
  return (
    <TableRow 
      className={`cursor-pointer transition-colors hover:bg-gray-50 ${incident.isVoided ? 'bg-red-50' : ''}`}
      onClick={() => onRowClick(incident.id)}
      data-incident-id={incident.id}
    >
      <TableCell className="font-medium">
        <div className="flex items-center">
          <Ticket className="h-4 w-4 mr-2 text-blue-600" />
          <span className="ml-1">{getSimpleId(incident.ticketId)}</span>
          {incident.isVoided && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <BanIcon className="h-4 w-4 ml-2 text-red-600" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>This incident has been voided</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </TableCell>
      
      <TableCell className="text-left">
        <div className="flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
          {formatDate(incident.date)}
        </div>
      </TableCell>
      
      <TableCell className="text-left">
        <div className="flex flex-col">
          <span className="font-medium">{incident.category}</span>
          <span className="text-xs text-gray-500">{incident.subcategory}</span>
        </div>
      </TableCell>
      
      <TableCell className="text-left">
        <div className="flex items-center">
          {React.createElement(getPriorityIcon(incident.priority))}
          <span className="ml-2">{incident.priority || 'Medium'}</span>
        </div>
      </TableCell>
      
      <TableCell className="text-left">
        <div className="flex items-center text-sm">
          <Building2 className="h-4 w-4 mr-2 text-gray-500" />
          {incident.facility || 'Not specified'}
        </div>
      </TableCell>
      
      <TableCell className="text-left">
        <div className="flex items-center">
          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(incident.status, incident.isVoided)}`}>
            {incident.isVoided ? 'Voided' : incident.status}
          </span>
        </div>
      </TableCell>
      
      <TableCell className="text-left">
        <div className="flex items-center text-sm">
          <User className="h-4 w-4 mr-2 text-gray-500" />
          {incident.owner?.name || 'Unassigned'}
        </div>
      </TableCell>
      
      <TableCell className="text-right">
        <div className="flex space-x-2 justify-end">
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => onViewClick(e, incident.id)}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">View</span>
          </Button>
          {canShowEditButton && (
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => onEditClick(e, incident.id)}
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};
