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
  reportTypes,
  addReportType,
  updateReportType,
  deleteReportType,
  toggleReportTypeStatus
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [editTypeName, setEditTypeName] = useState('');
  const [editTypeDescription, setEditTypeDescription] = useState('');

  const handleAddReportType = () => {
    if (newTypeName.trim()) {
      try {
        addReportType(newTypeName.trim(), newTypeDescription.trim());
        setNewTypeName('');
        setNewTypeDescription('');
        setIsAddDialogOpen(false);
        toast.success('Report type added successfully');
      } catch (error) {
        console.error('Error adding report type:', error);
        toast.error('Failed to add report type');
      }
    } else {
      toast.error('Name is required');
    }
  };

  const handleEditReportType = () => {
    if (selectedType && editTypeName.trim()) {
      try {
        updateReportType(selectedType.id, editTypeName.trim(), editTypeDescription.trim());
        setIsEditDialogOpen(false);
        setSelectedType(null);
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

  const handleToggleStatus = (type: ReportType) => {
    const newStatus = !type.is_active;
    try {
      toggleReportTypeStatus(type.id, newStatus);
      toast.success(`Report type ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling report type status:', error);
      toast.error(`Failed to ${newStatus ? 'activate' : 'deactivate'} report type`);
    }
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
        >
          <PlusCircle className="h-4 w-4" />
          Add Report Type
        </Button>
      </div>

      {reportTypes.length > 0 ? (
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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEditClick(type)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
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
        defaultValue=""
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onChange={setNewTypeName}
        onSave={handleAddReportType}
        triggerButton={<Button className="hidden">Add</Button>}
        extraField={{
          type: 'text',
          label: 'Description',
          value: newTypeDescription,
          onChange: setNewTypeDescription
        }}
      />

      {/* Edit Dialog */}
      <EditDialog
        title="Edit Report Type"
        description="Update the report type details."
        fieldLabel="Name"
        value={editTypeName}
        defaultValue={selectedType?.name || ''}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onChange={setEditTypeName}
        onSave={handleEditReportType}
        triggerButton={<Button className="hidden">Edit</Button>}
        extraField={{
          type: 'text',
          label: 'Description',
          value: editTypeDescription,
          onChange: setEditTypeDescription
        }}
      />
    </div>
  );
};
