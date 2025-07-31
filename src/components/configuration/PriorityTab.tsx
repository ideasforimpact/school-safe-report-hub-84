
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { EditDialog } from '@/components/configuration/EditDialog';
import { toast } from 'sonner';
import { priorityService } from '@/services/incident/priorityService';
import { usePriorities } from '@/hooks/usePriorities';

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
  
  // Use the hook to get priorities with RLS - no manual client validation needed
  const { priorities, loading, refetch } = usePriorities();

  const handleAddPriority = async () => {
    if (newPriorityName.trim()) {
      try {
        await priorityService.addPriority(
          newPriorityName.trim(), 
          newPriorityDescription.trim(), 
          newPriorityColor, 
          parseInt(newPriorityWeight) || 0
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
        // Display the specific error message from the service
        toast.error(error.message || 'Failed to add priority');
      }
    } else {
      toast.error('Priority name cannot be empty');
    }
  };

  const handleEditPriority = async () => {
    if (selectedPriority && editPriorityName.trim()) {
      try {
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
        // Display the specific error message from the service
        toast.error(error.message || 'Failed to update priority');
      }
    } else {
      toast.error('Priority name cannot be empty');
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
    const newStatus = !priority.is_active;
    try {
      await priorityService.togglePriorityStatus(priority.id, newStatus);
      // Refresh data immediately
      await refetch();
      toast.success(`Priority ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling priority status:', error);
      toast.error(`Failed to ${newStatus ? 'activate' : 'deactivate'} priority`);
    }
  };

  const handleDeletePriority = async (id: string) => {
    if (confirm('Are you sure you want to delete this priority?')) {
      try {
        await priorityService.deletePriority(id);
        // Refresh data immediately
        await refetch();
        toast.success('Priority deleted successfully');
      } catch (error) {
        console.error('Error deleting priority:', error);
        toast.error('Failed to delete priority');
      }
    }
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

      {loading ? (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <p className="text-gray-500 text-lg">Loading priorities...</p>
        </div>
      ) : priorities.length > 0 ? (
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
              <TableRow key={priority.id} className={!priority.is_active ? "opacity-60" : ""}>
                <TableCell>
                  <div style={getPriorityColorStyle(priority.color)}></div>
                </TableCell>
                <TableCell className="font-medium">{priority.name}</TableCell>
                <TableCell>{priority.description || '-'}</TableCell>
                <TableCell>{priority.weight || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={priority.is_active} 
                      onCheckedChange={() => handleToggleStatus(priority)}
                      aria-label={`${priority.is_active ? 'Deactivate' : 'Activate'} ${priority.name}`}
                    />
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
                  <Button variant="ghost" size="sm" onClick={() => handleDeletePriority(priority.id)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No priorities have been added yet</p>
        </div>
      )}

      {/* Add Priority Dialog */}
      <EditDialog
        title="Add Priority"
        description="Enter the details for the new priority."
        fieldLabel="Name"
        value={newPriorityName}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onChange={setNewPriorityName}
        onSave={handleAddPriority}
        triggerButton={<Button className="hidden">Add</Button>}
        extraFields={[
          {
            type: 'text',
            label: 'Description',
            value: newPriorityDescription,
            onChange: setNewPriorityDescription
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
      />

      {/* Edit Priority Dialog */}
      <EditDialog
        title="Edit Priority"
        description="Update the priority details."
        fieldLabel="Name"
        value={editPriorityName}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onChange={setEditPriorityName}
        onSave={handleEditPriority}
        triggerButton={<Button className="hidden">Edit</Button>}
        extraFields={[
          {
            type: 'text',
            label: 'Description',
            value: editPriorityDescription,
            onChange: setEditPriorityDescription
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
      />
    </div>
  );
};
