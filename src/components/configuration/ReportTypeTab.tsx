
import React, { useState } from 'react';
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
}

export const ReportTypeTab: React.FC<ReportTypeTabProps> = ({
  // Ignore props and use hook data with RLS
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [editTypeName, setEditTypeName] = useState('');
  const [editTypeDescription, setEditTypeDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Confirmation dialog states
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    itemName: string;
    action: 'delete' | 'activate' | 'deactivate';
    onConfirm: () => void;
    error: string | null;
  }>({
    open: false,
    title: '',
    description: '',
    itemName: '',
    action: 'delete',
    onConfirm: () => {},
    error: null,
  });
  
  // Use the hook to get report types with RLS - no manual client validation needed
  const { reportTypes, loading, fetchReportTypes } = useReportTypes();

  const handleAddReportType = async () => {
    if (!newTypeName.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setError(null);
      await reportTypeService.addReportType(newTypeName.trim(), newTypeDescription.trim());
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
    }
  };

  const handleEditReportType = async () => {
    if (!selectedType || !editTypeName.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setError(null);
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
    }
  };

  const handleEditClick = (type: ReportType) => {
    setSelectedType(type);
    setEditTypeName(type.name);
    setEditTypeDescription(type.description || '');
    setIsEditDialogOpen(true);
  };

  const handleToggleStatus = async (type: ReportType) => {
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
          await reportTypeService.toggleReportTypeStatus(type.id, newStatus);
          // Refresh data immediately
          await fetchReportTypes();
          setConfirmationDialog(prev => ({ ...prev, open: false }));
        } catch (error: any) {
          console.error('Error toggling report type status:', error);
          const errorMessage = error?.message || `Failed to ${newStatus ? 'activate' : 'deactivate'} report type`;
          setConfirmationDialog(prev => ({ ...prev, error: errorMessage }));
        }
      },
      error: null,
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
          await reportTypeService.deleteReportType(id);
          // Refresh data immediately
          await fetchReportTypes();
          setConfirmationDialog(prev => ({ ...prev, open: false }));
        } catch (error: any) {
          console.error('Error deleting report type:', error);
          const errorMessage = error?.message || 'Failed to delete report type';
          setConfirmationDialog(prev => ({ ...prev, error: errorMessage }));
        }
      },
      error: null,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Report Types</h3>
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
      </div>

      {loading ? (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <p className="text-gray-500 text-lg">Loading report types...</p>
        </div>
      ) : reportTypes.length > 0 ? (
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
            {reportTypes.map((type) => (
              <TableRow key={type.id} className={!type.is_active ? "opacity-60" : ""}>
                <TableCell className="font-medium">{type.name}</TableCell>
                <TableCell title={type.description || '-'}>{type.description || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <StatusSwitch 
                      variant="status"
                      checked={type.is_active} 
                      onCheckedChange={() => handleToggleStatus(type)}
                      aria-label={`${type.is_active ? 'Deactivate' : 'Activate'} ${type.name}`}
                    />
                    <Badge variant={type.is_active ? "success" : "destructive"}>
                      {type.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditClick(type)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteReportType(type.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No report types have been added yet</p>
        </div>
      )}

      {/* Add Dialog */}
              <EditDialog
          title="Add Report Type"
          description="Enter the details for the new report type."
          fieldLabel="Name"
          value={newTypeName}
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) {
              // Clear error and reset form when dialog closes
              setError(null);
              setNewTypeName('');
              setNewTypeDescription('');
            }
          }}
          onChange={setNewTypeName}
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
          isLoading={loading}
        />

      {/* Edit Dialog */}
              <EditDialog
          title="Edit Report Type"
          description="Update the report type details."
          fieldLabel="Name"
          value={editTypeName}
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) {
              // Clear error when dialog closes
              setError(null);
            }
          }}
          onChange={setEditTypeName}
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
          isLoading={loading}
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
        error={confirmationDialog.error}
      />
    </div>
  );
};
