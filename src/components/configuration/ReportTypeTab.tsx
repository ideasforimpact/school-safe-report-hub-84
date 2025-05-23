
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth/useAuth';
import { reportTypeService } from '@/services/incident/reportTypeService';
import { useReportTypes } from '@/hooks/useReportTypes';

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
  reportTypes: propReportTypes,
  addReportType: propAddReportType,
  updateReportType: propUpdateReportType,
  deleteReportType: propDeleteReportType,
  toggleReportTypeStatus: propToggleReportTypeStatus
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [editTypeName, setEditTypeName] = useState('');
  const [editTypeDescription, setEditTypeDescription] = useState('');
  const { employeeData } = useAuth();
  
  // Use the hook to get report types with proper client_id validation
  const { reportTypes: hookReportTypes, loading, fetchReportTypes } = useReportTypes();
  
  // Use hook data if available, otherwise fall back to props
  const reportTypes = hookReportTypes.length > 0 ? hookReportTypes : propReportTypes;

  const handleAddReportType = async () => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    if (newTypeName.trim()) {
      try {
        await reportTypeService.addReportType(newTypeName.trim(), newTypeDescription.trim(), employeeData.clientId);
        setNewTypeName('');
        setNewTypeDescription('');
        setIsAddDialogOpen(false);
        // Refresh the data
        await fetchReportTypes();
        toast.success('Report type added successfully');
      } catch (error) {
        console.error('Error adding report type:', error);
        toast.error('Failed to add report type');
      }
    } else {
      toast.error('Name is required');
    }
  };

  const handleEditReportType = async () => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    if (selectedType && editTypeName.trim()) {
      try {
        await reportTypeService.updateReportType(selectedType.id, editTypeName.trim(), editTypeDescription.trim(), employeeData.clientId);
        setIsEditDialogOpen(false);
        setSelectedType(null);
        // Refresh the data
        await fetchReportTypes();
        toast.success('Report type updated successfully');
      } catch (error) {
        console.error('Error updating report type:', error);
        toast.error('Failed to update report type');
      }
    } else {
      toast.error('Name is required');
    }
  };

  const handleEditClick = (type: ReportType) => {
    setSelectedType(type);
    setEditTypeName(type.name);
    setEditTypeDescription(type.description || '');
    setIsEditDialogOpen(true);
  };

  const handleToggleStatus = async (type: ReportType) => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    const newStatus = !type.is_active;
    try {
      await reportTypeService.toggleReportTypeStatus(type.id, newStatus, employeeData.clientId);
      // Refresh the data
      await fetchReportTypes();
      toast.success(`Report type ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling report type status:', error);
      toast.error(`Failed to ${newStatus ? 'activate' : 'deactivate'} report type`);
    }
  };

  const handleDeleteReportType = async (id: string) => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    try {
      await reportTypeService.deleteReportType(id, employeeData.clientId);
      // Refresh the data
      await fetchReportTypes();
      toast.success('Report type deleted successfully');
    } catch (error) {
      console.error('Error deleting report type:', error);
      toast.error('Failed to delete report type');
    }
  };

  if (!employeeData?.clientId) {
    return (
      <div className="text-center p-4 border rounded-md bg-gray-50">
        <p className="text-gray-500">Client information not available. Please contact your administrator.</p>
      </div>
    );
  }

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
        <div className="text-center p-4 border rounded-md bg-gray-50">
          <p className="text-gray-500">Loading report types...</p>
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
                <TableCell>{type.description || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch 
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
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center p-4 border rounded-md bg-gray-50">
          <p className="text-gray-500">No report types found. Add one to get started.</p>
        </div>
      )}

      {/* Add Dialog */}
      <EditDialog
        title="Add Report Type"
        description="Enter the details for the new report type."
        fieldLabel="Name"
        value={newTypeName}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onChange={setNewTypeName}
        onSave={handleAddReportType}
        triggerButton={<Button className="hidden">Add</Button>}
        extraFields={[
          {
            type: 'text',
            label: 'Description',
            value: newTypeDescription,
            onChange: setNewTypeDescription
          }
        ]}
      />

      {/* Edit Dialog */}
      <EditDialog
        title="Edit Report Type"
        description="Update the report type details."
        fieldLabel="Name"
        value={editTypeName}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onChange={setEditTypeName}
        onSave={handleEditReportType}
        triggerButton={<Button className="hidden">Edit</Button>}
        extraFields={[
          {
            type: 'text',
            label: 'Description',
            value: editTypeDescription,
            onChange: setEditTypeDescription
          }
        ]}
      />
    </div>
  );
};
