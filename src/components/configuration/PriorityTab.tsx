
import React, { useState } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditDialog } from '@/components/configuration/EditDialog';

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
  priorities,
  addPriority,
  updatePriority,
  deletePriority,
  togglePriorityStatus
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentPriority, setCurrentPriority] = useState<PriorityItem | null>(null);
  
  const handleAdd = (formData: { name: string; description: string; color: string; weight: string }) => {
    addPriority(
      formData.name, 
      formData.description, 
      formData.color,
      parseInt(formData.weight) || 0
    );
    setIsAddDialogOpen(false);
  };

  const handleEdit = (formData: { name: string; description: string; color: string; weight: string }) => {
    if (currentPriority) {
      updatePriority(
        currentPriority.id, 
        formData.name, 
        formData.description,
        formData.color,
        parseInt(formData.weight) || 0
      );
    }
    setIsEditDialogOpen(false);
    setCurrentPriority(null);
  };

  const openEditDialog = (priority: PriorityItem) => {
    setCurrentPriority(priority);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this priority?')) {
      deletePriority(id);
    }
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    togglePriorityStatus(id, !currentStatus);
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Incident Priorities</h3>
        <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" /> Add Priority
        </Button>
      </div>

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
          {priorities.map((priority) => (
            <TableRow key={priority.id}>
              <TableCell>
                <div style={getPriorityColorStyle(priority.color)}></div>
              </TableCell>
              <TableCell>{priority.name}</TableCell>
              <TableCell>{priority.description || '-'}</TableCell>
              <TableCell>{priority.weight || '-'}</TableCell>
              <TableCell>
                <Button
                  variant={priority.is_active ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => handleToggleStatus(priority.id, priority.is_active)}
                >
                  {priority.is_active ? 'Active' : 'Inactive'}
                </Button>
              </TableCell>
              <TableCell className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={() => openEditDialog(priority)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(priority.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {priorities.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                No priorities found. Add some using the button above.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Add Priority Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Priority</DialogTitle>
          </DialogHeader>
          <EditDialog
            onSave={handleAdd}
            onCancel={() => setIsAddDialogOpen(false)}
            fields={[
              { name: 'name', label: 'Name', required: true },
              { name: 'description', label: 'Description' },
              { name: 'color', label: 'Color (Hex)', type: 'color' },
              { name: 'weight', label: 'Weight', type: 'number' }
            ]}
            initialValues={{ name: '', description: '', color: '#10B981', weight: '0' }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Priority Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Priority</DialogTitle>
          </DialogHeader>
          {currentPriority && (
            <EditDialog
              onSave={handleEdit}
              onCancel={() => setIsEditDialogOpen(false)}
              fields={[
                { name: 'name', label: 'Name', required: true },
                { name: 'description', label: 'Description' },
                { name: 'color', label: 'Color (Hex)', type: 'color' },
                { name: 'weight', label: 'Weight', type: 'number' }
              ]}
              initialValues={{
                name: currentPriority.name,
                description: currentPriority.description || '',
                color: currentPriority.color || '#10B981',
                weight: String(currentPriority.weight || 0)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
