
import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash } from 'lucide-react';
import { EditDialog } from './EditDialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusSwitch } from '@/components/ui/status-switch';
import { toast } from 'sonner';
import { reportTypeService } from '@/services/incident/reportTypeService';
import { useReportTypes } from '@/hooks/useReportTypes';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { incidentReferenceService, IncidentReferenceCheck } from '@/services/incident/incidentReferenceService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';

// Validation function for report type names (no special characters, max 25 chars)
const isValidReportTypeName = (name: string) => {
  const reportTypeNameRegex = /^[a-zA-Z0-9\s]{1,25}$/;
  return reportTypeNameRegex.test(name);
};

interface ReportType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface ReportTypeTabProps {
  reportTypes: ReportType[];
  addReportType: (name: string, description: string) => void;
  updateReportType: (id: string, name: string, description: string) => void;
  deleteReportType: (id: string) => void;
  toggleReportTypeStatus: (id: string, isActive: boolean) => void;
  canCreate?: boolean;
}

export const ReportTypeTab: React.FC<ReportTypeTabProps> = ({
  canCreate = true,
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [editTypeName, setEditTypeName] = useState('');
  const [editTypeDescription, setEditTypeDescription] = useState('');
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
  
  // Use the hook to get report types with RLS - no manual client validation needed
  const { reportTypes, loading, fetchReportTypes } = useReportTypes();
  const [reportTypeReferences, setReportTypeReferences] = useState<Record<string, IncidentReferenceCheck>>({});

  // Pre-load reference info so we can disable delete button for linked report types
  useEffect(() => {
    const clientId = employeeData?.clientId;
    if (!clientId || reportTypes.length === 0) {
      setReportTypeReferences({});
      return;
    }

    let isCancelled = false;

    const fetchReferences = async () => {
      try {
        const results = await Promise.all(
          reportTypes.map(async (type) => {
            const refInfo = await incidentReferenceService.checkReportTypeReferences(type.id, clientId);
            return { id: type.id, refInfo };
          })
        );

        if (isCancelled) return;

        const map: Record<string, IncidentReferenceCheck> = {};
        results.forEach(({ id, refInfo }) => {
          map[id] = refInfo;
        });
        setReportTypeReferences(map);
      } catch (error) {
        console.error('Error preloading report type reference info:', error);
      }
    };

    fetchReferences();

    return () => {
      isCancelled = true;
    };
  }, [reportTypes, employeeData]);

  const handleAddReportType = async () => {
    if (!newTypeName.trim()) {
      setError('Name is required');
      return;
    }

    if (!isValidReportTypeName(newTypeName.trim())) {
      setError('Name must be alphanumeric with spaces only, maximum 25 characters');
      return;
    }

    try {
      setError(null);
      setIsSaving(true);
      // Pass client ID from auth context
      await reportTypeService.addReportType(
        newTypeName.trim(), 
        newTypeDescription.trim(), 
        employeeData?.clientId
      );
      setNewTypeName('');
      setNewTypeDescription('');
      setIsAddDialogOpen(false);
      // Refresh data immediately
      await fetchReportTypes();
      toast.success('Report type added successfully');
    } catch (error: any) {
      console.error('Error adding report type:', error);
      setError(error.message || 'Failed to add report type');
      // Don't close the dialog when there's an error - keep it open so user can see the error message
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditReportType = async () => {
    if (!selectedType || !editTypeName.trim()) {
      setError('Name is required');
      return;
    }

    if (!isValidReportTypeName(editTypeName.trim())) {
      setError('Name must be alphanumeric with spaces only, maximum 25 characters');
      return;
    }

    try {
      setError(null);
      setIsSaving(true);
      await reportTypeService.updateReportType(selectedType.id, editTypeName.trim(), editTypeDescription.trim());
      setIsEditDialogOpen(false);
      setSelectedType(null);
      // Refresh data immediately
      await fetchReportTypes();
      toast.success('Report type updated successfully');
    } catch (error: any) {
      console.error('Error updating report type:', error);
      setError(error.message || 'Failed to update report type');
      // Don't close the dialog when there's an error - keep it open so user can see the error message
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (type: ReportType) => {
    setSelectedType(type);
    setEditTypeName(type.name);
    setEditTypeDescription(type.description || '');
    setIsEditDialogOpen(true);
  };

  const handleToggleStatus = async (type: ReportType) => {
    // Check if report type is linked to incidents - prevent deactivation if linked
    const refInfo = reportTypeReferences[type.id];
    if (refInfo?.hasReferences && type.is_active) {
      const message = refInfo?.message?.replace('Cannot delete', 'Cannot deactivate') ||
        `This report type is linked to ${refInfo?.count ?? 0} incident(s) and cannot be deactivated.`;
      toast.error(message);
      return;
    }

    const newStatus = !type.is_active;
    const action = newStatus ? 'activate' as const : 'deactivate' as const;
    
    setConfirmationDialog({
      open: true,
      title: `${action === 'activate' ? 'Activate' : 'Deactivate'} Report Type`,
      description: `Please confirm that you want to ${action} this report type. This action will immediately ${action} the report type and may affect existing incidents.`,
      itemName: type.name,
      action,
      onConfirm: async () => {
        try {
          setConfirmationDialog(prev => ({ ...prev, isLoading: true, error: null }));
          await reportTypeService.toggleReportTypeStatus(type.id, newStatus);
          // Refresh data immediately
          await fetchReportTypes();
          setConfirmationDialog(prev => ({ ...prev, open: false, isLoading: false }));
          toast.success(`Report type ${newStatus ? 'activated' : 'deactivated'} successfully`);
        } catch (error: any) {
          console.error('Error toggling report type status:', error);
          const errorMessage = error?.message || `Failed to ${newStatus ? 'activate' : 'deactivate'} report type`;
          setConfirmationDialog(prev => ({ ...prev, error: errorMessage, isLoading: false }));
        }
      },
      error: null,
      isLoading: false,
    });
  };

  const handleDeleteReportType = async (id: string) => {
    // Find the report type to get its name for the confirmation message
    const reportType = reportTypes.find(type => type.id === id);
    const typeName = reportType?.name || 'this report type';
    
    setConfirmationDialog({
      open: true,
      title: 'Delete Report Type',
      description: 'Please confirm that you want to proceed with this deletion. This action will immediately remove the report type and cannot be recovered.',
      itemName: typeName,
      action: 'delete',
      onConfirm: async () => {
        try {
          setConfirmationDialog(prev => ({ ...prev, isLoading: true, error: null }));
          await reportTypeService.deleteReportType(id);
          // Refresh data immediately
          await fetchReportTypes();
          setConfirmationDialog(prev => ({ ...prev, open: false, isLoading: false }));
          toast.success('Report type deleted successfully');
        } catch (error: any) {
          console.error('Error deleting report type:', error);
          const errorMessage = error?.message || 'Failed to delete report type';
          setConfirmationDialog(prev => ({ ...prev, error: errorMessage, isLoading: false }));
        }
      },
      error: null,
      isLoading: false,
    });
  };

  // Filter report types based on status
  const filteredReportTypes = reportTypes.filter(type => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return type.is_active;
    if (statusFilter === 'inactive') return !type.is_active;
    return true;
  });

  const refreshReportTypes = useCallback(() => {
    fetchReportTypes();
  }, [fetchReportTypes]);

  useRealTimeSubHook({
    channelName: `incident-report-types-${employeeData?.clientId}`,
    table: 'incident_report_types',
    events: '*',
    enabled: !!employeeData?.clientId,
    onPayload: refreshReportTypes,
  });


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Report Types</h3>
        {canCreate && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-2"
            disabled={loading}
          >
            <PlusCircle className="h-4 w-4" />
            Add Report Type
          </Button>
        )}
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
            Showing {filteredReportTypes.length} of {reportTypes.length} report types
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <p className="text-gray-500 text-lg">Loading report types...</p>
        </div>
      ) : filteredReportTypes.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReportTypes.map((type) => (
              <TableRow key={type.id} className={!type.is_active ? "opacity-60" : ""}>
                <TableCell className="font-medium">{type.name}</TableCell>
                <TableCell title={type.description || '-'}>{type.description || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {canCreate && (() => {
                      const refInfo = reportTypeReferences[type.id];
                      const isLinked = refInfo?.hasReferences;

                      if (isLinked) {
                        const message =
                          refInfo?.message?.replace('Cannot delete', 'Cannot deactivate') ||
                          `This report type is linked to ${refInfo?.count ?? 0} incident(s) and cannot be deactivated.`;

                        return (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex">
                                  <StatusSwitch 
                                    variant="status"
                                    checked={type.is_active} 
                                    disabled={true}
                                    aria-label={`${type.is_active ? 'Deactivate' : 'Activate'} ${type.name}`}
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
                      checked={type.is_active} 
                      onCheckedChange={() => handleToggleStatus(type)}
                      aria-label={`${type.is_active ? 'Deactivate' : 'Activate'} ${type.name}`}
                    />
                      );
                    })()}
                    <Badge variant={type.is_active ? "success" : "destructive"}>
                      {type.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {canCreate && (
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditClick(type)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    {(() => {
                      const refInfo = reportTypeReferences[type.id];
                      const isLinked = refInfo?.hasReferences;

                      if (isLinked) {
                        const message =
                          refInfo?.message ||
                          `This report type is linked to ${refInfo?.count ?? 0} incident(s) and cannot be deleted.`;

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
                                    <Trash className="h-4 w-4" />
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
                          onClick={() => handleDeleteReportType(type.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      );
                    })()}
                  </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {reportTypes.length === 0 
              ? "No report types have been added yet" 
              : `No ${statusFilter} report types found`
            }
          </p>
        </div>
      )}

      {/* Add Dialog */}
              <EditDialog
          title="Add Report Type"
          description="Enter the details for the new report type."
          fieldLabel="Name"
          value={newTypeName}
          open={isAddDialogOpen && canCreate}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) {
              // Clear error and reset form when dialog closes
              setError(null);
              setNewTypeName('');
              setNewTypeDescription('');
            }
          }}
          onChange={(val) => { setNewTypeName(val); if (error) setError(null); }}
          onSave={handleAddReportType}
          triggerButton={<Button className="hidden">Add</Button>}
          maxLength={25}
          isRequired={true}
          extraFields={[
                      {
            type: 'text',
            label: 'Description',
            value: newTypeDescription,
            onChange: setNewTypeDescription,
            maxLength: 100
          }
          ]}
          error={error}
          isLoading={isSaving}
          validationFunction={isValidReportTypeName}
          validationMessage="Name must be alphanumeric with spaces only, maximum 25 characters"
        />

      {/* Edit Dialog */}
              <EditDialog
          title="Edit Report Type"
          description="Update the report type details."
          fieldLabel="Name"
          value={editTypeName}
          open={isEditDialogOpen && canCreate}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) {
              // Clear error when dialog closes
              setError(null);
            }
          }}
          onChange={(val) => { setEditTypeName(val); if (error) setError(null); }}
          onSave={handleEditReportType}
          triggerButton={<Button className="hidden">Edit</Button>}
          maxLength={25}
          isRequired={true}
          extraFields={[
                      {
            type: 'text',
            label: 'Description',
          value: editTypeDescription,
            onChange: setEditTypeDescription,
            maxLength: 100
          }
          ]}
          error={error}
          isLoading={isSaving}
          validationFunction={isValidReportTypeName}
          validationMessage="Name must be alphanumeric with spaces only, maximum 25 characters"
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
