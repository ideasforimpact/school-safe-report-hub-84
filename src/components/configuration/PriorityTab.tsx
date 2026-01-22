
import React, { useCallback, useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StatusSwitch } from '@/components/ui/status-switch';
import { EditDialog } from '@/components/configuration/EditDialog';
import { toast } from 'sonner';
import { priorityService } from '@/services/incident/priorityService';
import { usePriorities } from '@/hooks/usePriorities';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { incidentReferenceService, IncidentReferenceCheck } from '@/services/incident/incidentReferenceService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';

// Validation function for priority names (no special characters, max 25 chars)
const isValidPriorityName = (name: string) => {
  const priorityNameRegex = /^[a-zA-Z0-9\s]{1,25}$/;
  return priorityNameRegex.test(name);
};

interface PriorityItem {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  weight: number | null;
  is_active: boolean;
}

interface PriorityTabProps {
  priorities: PriorityItem[];
  addPriority: (name: string, description: string, color: string, weight: number) => void;
  updatePriority: (id: string, name: string, description: string, color: string, weight: number) => void;
  deletePriority: (id: string) => void;
  togglePriorityStatus: (id: string, isActive: boolean) => void;
}

export const PriorityTab: React.FC<PriorityTabProps> = ({
  // Ignore props and use hook data with RLS
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newPriorityName, setNewPriorityName] = useState('');
  const [newPriorityDescription, setNewPriorityDescription] = useState('');
  const [newPriorityColor, setNewPriorityColor] = useState('#10B981');
  const [newPriorityWeight, setNewPriorityWeight] = useState('0');
  const [selectedPriority, setSelectedPriority] = useState<PriorityItem | null>(null);
  const [editPriorityName, setEditPriorityName] = useState('');
  const [editPriorityDescription, setEditPriorityDescription] = useState('');
  const [editPriorityColor, setEditPriorityColor] = useState('#10B981');
  const [editPriorityWeight, setEditPriorityWeight] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isSaving, setIsSaving] = useState(false);
  
  // Confirmation dialog states
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    itemName: string;
    action: 'delete' | 'activate' | 'deactivate';
    onConfirm: () => void;
    isLoading?: boolean;
    error: string | null;
  }>({
    open: false,
    title: '',
    description: '',
    itemName: '',
    action: 'delete',
    onConfirm: () => {},
    isLoading: false,
    error: null,
  });
  
  // Get client ID from auth context
  const { employeeData } = useAuth();
  
  // Use the hook to get priorities with RLS - no manual client validation needed
  const { priorities, loading, refetch } = usePriorities();
  const [priorityReferences, setPriorityReferences] = useState<Record<string, IncidentReferenceCheck>>({});

  // Pre-load reference info so we can disable delete button for linked priorities
  useEffect(() => {
    const clientId = employeeData?.clientId;
    if (!clientId || priorities.length === 0) {
      setPriorityReferences({});
      return;
    }

    let isCancelled = false;

    const fetchReferences = async () => {
      try {
        const results = await Promise.all(
          priorities.map(async (priority) => {
            const refInfo = await incidentReferenceService.checkPriorityReferences(priority.id, clientId);
            return { id: priority.id, refInfo };
          })
        );

        if (isCancelled) return;

        const map: Record<string, IncidentReferenceCheck> = {};
        results.forEach(({ id, refInfo }) => {
          map[id] = refInfo;
        });
        setPriorityReferences(map);
      } catch (error) {
        console.error('Error preloading priority reference info:', error);
      }
    };

    fetchReferences();

    return () => {
      isCancelled = true;
    };
  }, [priorities, employeeData]);

  const handleAddPriority = async () => {
    if (!newPriorityName.trim()) {
      setError('Priority name cannot be empty');
      return;
    }

    if (!isValidPriorityName(newPriorityName.trim())) {
      setError('Priority name must be alphanumeric with spaces only, maximum 25 characters');
      return;
    }

    try {
      setError(null);
      setIsSaving(true);
      // Pass client ID from auth context
      await priorityService.addPriority(
        newPriorityName.trim(), 
        newPriorityDescription.trim(), 
        newPriorityColor, 
        parseInt(newPriorityWeight) || 0,
        employeeData?.clientId
      );
      setNewPriorityName('');
      setNewPriorityDescription('');
      setNewPriorityColor('#10B981');
      setNewPriorityWeight('0');
      setIsAddDialogOpen(false);
      // Refresh data immediately
      await refetch();
      toast.success('Priority added successfully');
    } catch (error: any) {
      console.error('Error adding priority:', error);
      setError(error.message || 'Failed to add priority');
      // Don't close the dialog when there's an error - keep it open so user can see the error message
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPriority = async () => {
    if (!selectedPriority || !editPriorityName.trim()) {
      setError('Priority name cannot be empty');
      return;
    }

    if (!isValidPriorityName(editPriorityName.trim())) {
      setError('Priority name must be alphanumeric with spaces only, maximum 25 characters');
      return;
    }

    try {
      setError(null);
      setIsSaving(true);
      await priorityService.updatePriority(
        selectedPriority.id,
        editPriorityName.trim(), 
        editPriorityDescription.trim(), 
        editPriorityColor, 
        parseInt(editPriorityWeight) || 0
      );
      setIsEditDialogOpen(false);
      setSelectedPriority(null);
      // Refresh data immediately
      await refetch();
      toast.success('Priority updated successfully');
    } catch (error: any) {
      console.error('Error updating priority:', error);
      setError(error.message || 'Failed to update priority');
      // Don't close the dialog when there's an error - keep it open so user can see the error message
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (priority: PriorityItem) => {
    setSelectedPriority(priority);
    setEditPriorityName(priority.name);
    setEditPriorityDescription(priority.description || '');
    setEditPriorityColor(priority.color || '#10B981');
    setEditPriorityWeight(String(priority.weight || 0));
    setIsEditDialogOpen(true);
  };

  const handleToggleStatus = async (priority: PriorityItem) => {
    // Check if priority is linked to incidents - prevent deactivation if linked
    const refInfo = priorityReferences[priority.id];
    if (refInfo?.hasReferences && priority.is_active) {
      const message = refInfo?.message?.replace('Cannot delete', 'Cannot deactivate') ||
        `This priority is linked to ${refInfo?.count ?? 0} incident(s) and cannot be deactivated.`;
      toast.error(message);
      return;
    }

    const newStatus = !priority.is_active;
    const action = newStatus ? 'activate' as const : 'deactivate' as const;
    
    setConfirmationDialog({
      open: true,
      title: `${action === 'activate' ? 'Activate' : 'Deactivate'} Priority`,
      description: `Please confirm that you want to ${action} this priority. This action will immediately ${action} the priority and may affect existing incidents.`,
      itemName: priority.name,
      action,
      isLoading: false,
      error: null,
      onConfirm: async () => {
        try {
          setConfirmationDialog(prev => ({ ...prev, isLoading: true, error: null }));
          await priorityService.togglePriorityStatus(priority.id, newStatus);
          // Refresh data immediately
          await refetch();
          setConfirmationDialog(prev => ({ ...prev, open: false, isLoading: false }));
          toast.success(`Priority ${newStatus ? 'activated' : 'deactivated'} successfully`);
        } catch (error: any) {
          console.error('Error toggling priority status:', error);
          const errorMessage = error?.message || `Failed to ${newStatus ? 'activate' : 'deactivate'} priority`;
          setConfirmationDialog(prev => ({ ...prev, error: errorMessage, isLoading: false }));
        }
      },
    });
  };

  const handleDeletePriority = async (id: string) => {
    // Find the priority to get its name for the confirmation message
    const priority = priorities.find(p => p.id === id);
    const priorityName = priority?.name || 'this priority';
    
    setConfirmationDialog({
      open: true,
      title: 'Delete Priority',
      description: 'Please confirm that you want to proceed with this deletion. This action will immediately remove the priority and cannot be recovered.',
      itemName: priorityName,
      action: 'delete',
      isLoading: false,
      error: null,
      onConfirm: async () => {
        try {
          setConfirmationDialog(prev => ({ ...prev, isLoading: true, error: null }));
          await priorityService.deletePriority(id);
          // Refresh data immediately
          await refetch();
          setConfirmationDialog(prev => ({ ...prev, open: false, isLoading: false }));
          toast.success('Priority deleted successfully');
        } catch (error: any) {
          console.error('Error deleting priority:', error);
          const errorMessage = error?.message || 'Failed to delete priority';
          setConfirmationDialog(prev => ({ ...prev, error: errorMessage, isLoading: false }));
        }
      },
    });
  };

  const getPriorityColorStyle = (color: string | null) => {
    if (!color) return {};
    return {
      backgroundColor: color,
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      display: 'inline-block'
    };
  };

  // Filter priorities based on status
  const filteredPriorities = priorities.filter(priority => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return priority.is_active;
    if (statusFilter === 'inactive') return !priority.is_active;
    return true;
  });

  const refreshPriorities = useCallback(() => {
    refetch();
  }, [refetch]);

  useRealTimeSubHook({
    channelName: `incident-priorities-${employeeData?.clientId}`,
    table: 'incident_priorities',
    events: '*',
    enabled: !!employeeData?.clientId,
    onPayload: refreshPriorities,
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Incident Priorities</h3>
        <Button 
          onClick={() => setIsAddDialogOpen(true)} 
          size="sm"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Priority
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          <div className="flex space-x-1">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
              className="text-xs"
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('active')}
              className="text-xs"
            >
              Active
            </Button>
            <Button
              variant={statusFilter === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('inactive')}
              className="text-xs"
            >
              Inactive
            </Button>
          </div>
        </div>
        {statusFilter !== 'all' && (
          <span className="text-sm text-gray-500">
            Showing {filteredPriorities.length} of {priorities.length} priorities
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <p className="text-gray-500 text-lg">Loading priorities...</p>
        </div>
      ) : filteredPriorities.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Color</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPriorities.map((priority) => (
              <TableRow key={priority.id} className={!priority.is_active ? "opacity-60" : ""}>
                <TableCell>
                  <div style={getPriorityColorStyle(priority.color)}></div>
                </TableCell>
                <TableCell className="font-medium">{priority.name}</TableCell>
                <TableCell title={priority.description || '-'}>{priority.description || '-'}</TableCell>
                <TableCell>{priority.weight || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const refInfo = priorityReferences[priority.id];
                      const isLinked = refInfo?.hasReferences;

                      if (isLinked) {
                        const message =
                          refInfo?.message?.replace('Cannot delete', 'Cannot deactivate') ||
                          `This priority is linked to ${refInfo?.count ?? 0} incident(s) and cannot be deactivated.`;

                        return (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex">
                                  <StatusSwitch 
                                    variant="status"
                                    checked={priority.is_active} 
                                    disabled={true}
                                    aria-label={`${priority.is_active ? 'Deactivate' : 'Activate'} ${priority.name}`}
                                  />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent 
                                side="left" 
                                align="center" 
                                sideOffset={8} 
                                className="max-w-xs whitespace-normal text-left"
                              >
                                <p className="text-xs leading-snug text-left">
                                  {message}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      }

                      return (
                    <StatusSwitch 
                      variant="status"
                      checked={priority.is_active} 
                      onCheckedChange={() => handleToggleStatus(priority)}
                      aria-label={`${priority.is_active ? 'Deactivate' : 'Activate'} ${priority.name}`}
                    />
                      );
                    })()}
                    <Badge variant={priority.is_active ? "success" : "destructive"}>
                      {priority.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditClick(priority)}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  {(() => {
                    const refInfo = priorityReferences[priority.id];
                    const isLinked = refInfo?.hasReferences;

                    if (isLinked) {
                      const message =
                        refInfo?.message ||
                        `This priority is linked to ${refInfo?.count ?? 0} incident(s) and cannot be deleted.`;

                      return (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  aria-disabled="true"
                                  className="text-red-400 hover:text-red-400 hover:bg-transparent cursor-not-allowed opacity-60"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent 
                              side="left" 
                              align="center" 
                              sideOffset={8} 
                              className="max-w-xs whitespace-normal text-left"
                            >
                              <p className="text-xs leading-snug text-left">
                                {message}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    }

                    return (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeletePriority(priority.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    );
                  })()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {priorities.length === 0 
              ? "No priorities have been added yet" 
              : `No ${statusFilter} priorities found`
            }
          </p>
        </div>
      )}

      {/* Add Priority Dialog */}
      <EditDialog
        title="Add Priority"
        description="Enter the details for the new priority."
        fieldLabel="Name"
        value={newPriorityName}
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            // Clear error and reset form when dialog closes
            setError(null);
            setNewPriorityName('');
            setNewPriorityDescription('');
            setNewPriorityColor('#10B981');
            setNewPriorityWeight('0');
          }
        }}
        onChange={(val) => { setNewPriorityName(val); if (error) setError(null); }}
        onSave={handleAddPriority}
        triggerButton={<Button className="hidden">Add</Button>}
        maxLength={25}
        isRequired={true}
        extraFields={[
          {
            type: 'text',
            label: 'Description',
            value: newPriorityDescription,
            onChange: setNewPriorityDescription,
            maxLength: 100
          },
          {
            type: 'color',
            label: 'Color',
            value: newPriorityColor,
            onChange: setNewPriorityColor
          },
          {
            type: 'number',
            label: 'Weight',
            value: newPriorityWeight,
            onChange: setNewPriorityWeight
          }
        ]}
        error={error}
        isLoading={isSaving}
        validationFunction={isValidPriorityName}
        validationMessage="Priority name must be alphanumeric with spaces only, maximum 25 characters"
      />

      {/* Edit Priority Dialog */}
      <EditDialog
        title="Edit Priority"
        description="Update the priority details."
        fieldLabel="Name"
        value={editPriorityName}
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            // Clear error when dialog closes
            setError(null);
          }
        }}
        onChange={(val) => { setEditPriorityName(val); if (error) setError(null); }}
        onSave={handleEditPriority}
        triggerButton={<Button className="hidden">Edit</Button>}
        maxLength={25}
        isRequired={true}
        extraFields={[
          {
            type: 'text',
            label: 'Description',
          value: editPriorityDescription,
            onChange: setEditPriorityDescription,
            maxLength: 100
          },
          {
            type: 'color',
            label: 'Color',
            value: editPriorityColor,
            onChange: setEditPriorityColor
          },
          {
            type: 'number',
            label: 'Weight',
            value: editPriorityWeight,
            onChange: setEditPriorityWeight
          }
        ]}
        error={error}
        isLoading={isSaving}
        validationFunction={isValidPriorityName}
        validationMessage="Priority name must be alphanumeric with spaces only, maximum 25 characters"
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmationDialog.open}
        onOpenChange={(open) => setConfirmationDialog(prev => ({ ...prev, open }))}
        onConfirm={confirmationDialog.onConfirm}
        title={confirmationDialog.title}
        description={confirmationDialog.description}
        itemName={confirmationDialog.itemName}
        action={confirmationDialog.action}
        isLoading={confirmationDialog.isLoading}
        error={confirmationDialog.error}
      />
    </div>
  );
};
