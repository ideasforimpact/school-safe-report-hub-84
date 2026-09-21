import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IncidentRecord } from '@/services/incidentService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Calendar, Building2, User, Ticket, AlertTriangle, Sparkles } from 'lucide-react';
import TablePaginationBar from '@/components/common/TablePaginationBar';
import { useIncidentPermissions } from '@/utils/incidentPermissions';
import AIRecommendationDialog from '@/components/incidents/AIRecommendationDialog';
import { formatDate } from "@/lib/Dateformat";
import Loader from "@/components/common/Loader";
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getCurrentUser } from '@/store/authSelectors';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';
interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  pageSize: number;
}

interface LazyIncidentsTableProps {
  incidents: IncidentRecord[];
  loading: boolean;
  hasFetched: boolean;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onRefreshIncidents?: () => void | Promise<void>; // Callback to refresh incident list
}

const LazyIncidentsTable: React.FC<LazyIncidentsTableProps> = ({
  incidents,
  loading,
  hasFetched,
  pagination,
  onPageChange,
  onRefreshIncidents
}) => {
  const navigate = useNavigate();
  const { checkPermissions } = useIncidentPermissions();
  const [aiOpen, setAiOpen] = React.useState(false);
  const [aiPayload, setAiPayload] = React.useState<Record<string, unknown> | null>(null);
  const { state } = useEmployeeStore();
  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();
    
  const currentUser = getCurrentUser(state);

  // Keeps the open dialog's payload in sync with the latest fetched incident
  // data. `aiPayload` is otherwise a one-time snapshot taken when the button
  // was clicked, so once a recommendation is saved for this incident, this
  // lets the dialog see it came from `incidents` rather than staying stuck
  // with the pre-save snapshot - which would otherwise make the dialog think
  // no recommendation exists yet and call the AI edge function again on any
  // future re-open or remount.
  React.useEffect(() => {
    if (!aiOpen || !aiPayload?.id) return;
    const fresh = incidents.find(inc => inc.id === aiPayload.id);
    if (fresh?.recommended_action && fresh.recommended_action !== aiPayload.recommended_action) {
      setAiPayload(prev => (prev ? { ...prev, ...fresh, recommended_action: fresh.recommended_action } : prev));
    }
  }, [incidents, aiOpen, aiPayload?.id, aiPayload?.recommended_action]);

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

  // Check if user can edit a specific incident
  const canEditIncident = (incident: IncidentRecord) => {
    if (isReadOnlySwitchedContext) return false;
    // Don't show edit button for voided incidents (if the property exists and is true)
    if (incident.is_voided) return false;
    
    // Don't show edit button for closed incidents
    if (incident.status?.toLowerCase() === 'closed') return false;
    
    const permissions = checkPermissions(
      incident.reportedById || '', 
      incident.ownerId
    );
    
    return permissions.canEdit;
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

  const getSimpleId = (ticketId: string) => {
    return ticketId.split('-').pop() || ticketId;
  };

  const truncate = (text?: string) => {
    if (!text) return '';
    return text.length > 10 ? `${text.slice(0, 10)}...` : text;
  };

  const logIncidentForAi = (e: React.MouseEvent, incident: IncidentRecord) => {
    e.stopPropagation();
    const payload: Record<string, unknown> = {
      id: incident.id,
      category: incident.category,
      sub_category: incident.subcategory,
      facility: incident.facility,
      location: incident.location,
      description: incident.description,
      root_cause: incident.root_cause ?? null,
      learning_points: incident.learning_points ?? null,
      action_taken: incident.action_taken ?? null,
      policy_docs: [],
    };
    // Include the full incident object with recommended_action
    const fullIncident = incidents.find(inc => inc.id === incident.id);
    setAiPayload({
      ...payload,
      ...fullIncident, // Include all incident fields including recommended_action
      recommended_action: fullIncident?.recommended_action || null
    });
    setAiOpen(true);
  };


  // Rendered as a stable sibling of `content` below (not nested inside any
  // of its branches) so that a background refetch triggered while the
  // dialog is open - e.g. saving an AI recommendation - doesn't unmount it
  // and wipe its in-progress fetch/result state, which caused the popup to
  // flicker and its network call to restart.
  const aiRecommendationDialog = (
    <AIRecommendationDialog
      open={aiOpen}
      onOpenChange={setAiOpen}
      incidentJson={aiPayload}
      incidentId={aiPayload?.id}
      incident={aiPayload}
      onRefresh={onRefreshIncidents}
    />
  );

  // The loading/empty/table states below are rendered as *children* of one
  // permanent wrapper div, rather than as separate top-level returns. Radix
  // reconciles by element type+position, so returning a different root
  // element (e.g. a Fragment for the loading state vs. a div for the table)
  // makes it unmount and remount everything below it - including the AI
  // dialog - purely because the wrapper type changed, even when the dialog
  // JSX itself is identical across branches. Keeping a single stable root
  // means the dialog never gets torn down by a loading/empty state flip.
  let content: React.ReactNode;

  if (loading) {
    // Show a centered loading spinner for any fetch in progress — initial
    // load or a pagination page change alike — before new data arrives.
    content = (
      <div className="flex items-center justify-center py-20">
        <Loader text="Loading incidents..." />
      </div>
    );
  } else {
    content = (
      <>
      {incidents.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500">No incidents found matching your filters</p>
        </div>
      ) : (
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
            {incidents.map((incident) => (
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
                    <span title={incident.reportedBy || ''}>{truncate(incident.reportedBy || 'Unknown')}</span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <span title={incident.owner || ''}>{truncate(incident.owner || 'Unassigned')}</span>
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
                    {canEditIncident(incident) && (
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
                    {currentUser?.client?.incidentRecommendedActionsEnabled !== false && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Recommended Actions"
                      onClick={(e) => logIncidentForAi(e, incident)}
                    >
                      <Sparkles className="h-4 w-4 text-black" />
                      <span className="sr-only">Recommended Actions</span>
                    </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}

      {/* Pagination */}
      {pagination && onPageChange && (
        <TablePaginationBar
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
          pageSize={pagination.pageSize}
          itemLabel="incidents"
          onPageChange={onPageChange}
        />
      )}
      </>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {aiRecommendationDialog}
      {content}
    </div>
  );
};

export default LazyIncidentsTable;
