
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { EditDialog } from './EditDialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

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
}

export const ReportTypeTab: React.FC<ReportTypeTabProps> = ({
  reportTypes,
  addReportType,
  updateReportType,
  deleteReportType
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [editTypeName, setEditTypeName] = useState('');
  const [editTypeDescription, setEditTypeDescription] = useState('');

  const handleAddReportType = () => {
    if (newTypeName.trim()) {
      addReportType(newTypeName.trim(), newTypeDescription.trim());
      setNewTypeName('');
      setNewTypeDescription('');
      setIsAddDialogOpen(false);
    }
  };

  const handleEditReportType = () => {
    if (selectedType && editTypeName.trim()) {
      updateReportType(selectedType.id, editTypeName.trim(), editTypeDescription.trim());
      setSelectedType(null);
    }
  };

  const handleDeleteClick = (type: ReportType) => {
    setSelectedType(type);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedType) {
      deleteReportType(selectedType.id);
      setIsDeleteDialogOpen(false);
      setSelectedType(null);
    }
  };

  const handleEditClick = (type: ReportType) => {
    setSelectedType(type);
    setEditTypeName(type.name);
    setEditTypeDescription(type.description || '');
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
              <TableRow key={type.id}>
                <TableCell className="font-medium">{type.name}</TableCell>
                <TableCell>{type.description || '-'}</TableCell>
                <TableCell>
                  <Badge variant={type.is_active ? "success" : "destructive"}>
                    {type.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditClick(type)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteClick(type)}
                    >
                      <Trash2 className="h-4 w-4" />
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
        defaultValue=""
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
      {selectedType && (
        <EditDialog
          title="Edit Report Type"
          fieldLabel="Name"
          value={editTypeName}
          defaultValue={selectedType.name}
          onOpenChange={(open) => {
            if (!open) setSelectedType(null);
          }}
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
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the report type 
              <strong> {selectedType?.name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
