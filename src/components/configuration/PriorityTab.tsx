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
import { useAuth } from '@/contexts/auth/useAuth';
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
  priorities: propPriorities,
  addPriority: propAddPriority,
  updatePriority: propUpdatePriority,
  deletePriority: propDeletePriority,
  togglePriorityStatus: propTogglePriorityStatus
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
  const { employeeData } = useAuth();
  
  // Use the hook to get priorities with proper client_id validation
  const { priorities: hookPriorities, loading } = usePriorities();
  
  // Use hook data, ignoring props data
  const priorities = hookPriorities;

  const handleAddPriority = async () => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    if (newPriorityName.trim()) {
      try {
        await priorityService.addPriority(
          newPriorityName.trim(), 
          newPriorityDescription.trim(), 
          newPriorityColor, 
          parseInt(newPriorityWeight) || 0,
          employeeData.clientId
        );
        setNewPriorityName('');
        setNewPriorityDescription('');
        setNewPriorityColor('#10B981');
        setNewPriorityWeight('0');
        setIsAddDialogOpen(false);
        // Refresh will happen automatically via the hook
        toast.success('Priority added successfully');
      } catch (error) {
        console.error('Error adding priority:', error);
        toast.error('Failed to add priority');
      }
    } else {
      toast.error('Name is required');
    }
  };

  const handleEditPriority = async () => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    if (selectedPriority && editPriorityName.trim()) {
      try {
        await priorityService.updatePriority(
          selectedPriority.id,
          editPriorityName.trim(), 
          editPriorityDescription.trim(), 
          editPriorityColor, 
          parseInt(editPriorityWeight) || 0,
          employeeData.clientId
        );
        setIsEditDialogOpen(false);
        setSelectedPriority(null);
        // Refresh will happen automatically via the hook
        toast.success('Priority updated successfully');
      } catch (error) {
        console.error('Error updating priority:', error);
        toast.error('Failed to update priority');
      }
    } else {
      toast.error('Name is required');
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
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    const newStatus = !priority.is_active;
    try {
      await priorityService.togglePriorityStatus(priority.id, newStatus, employeeData.clientId);
      // Refresh will happen automatically via the hook
      toast.success(`Priority ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling priority status:', error);
      toast.error(`Failed to ${newStatus ? 'activate' : 'deactivate'} priority`);
    }
  };

  const handleDeletePriority = async (id: string) => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    if (confirm('Are you sure you want to delete this priority?')) {
      try {
        await priorityService.deletePriority(id, employeeData.clientId);
        // Refresh will happen automatically via the hook
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

  if (!employeeData?.clientId) {
    return (
      <div className="text-center p-8 border rounded-md bg-gray-50">
        <p className="text-gray-500 text-lg">Client information not available</p>
        <p className="text-gray-400 text-sm mt-2">Please contact your administrator to resolve this issue.</p>
      </div>
    );
  }

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
        <div className="text-center p-12 border rounded-md bg-gray-50">
          <div className="max-w-md mx-auto">
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Priorities Found</h4>
            <p className="text-gray-500 mb-4">
              You haven't created any priorities yet. Priorities help determine the urgency and importance of incidents.
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Common examples include: Low, Medium, High, Critical, etc.
            </p>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Your First Priority
            </Button>
          </div>
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
