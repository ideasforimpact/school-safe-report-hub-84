
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth/useAuth';
import { contributingFactorService, ContributingFactorItem } from '@/services/incident/contributingFactorService';

interface ContributingFactorTabProps {
  factors: ContributingFactorItem[];
  addFactor: (name: string, description: string, weight: string) => void;
  updateFactor: (id: string, name: string, description: string, weight: string) => void;
  deleteFactor: (id: string) => void;
}

export const ContributingFactorTab: React.FC<ContributingFactorTabProps> = ({
  factors: propFactors,
  addFactor: propAddFactor,
  updateFactor: propUpdateFactor,
  deleteFactor: propDeleteFactor,
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentName, setCurrentName] = useState('');
  const [currentDescription, setCurrentDescription] = useState('');
  const [currentWeight, setCurrentWeight] = useState('Medium');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { employeeData } = useAuth();
  const [factors, setFactors] = useState<ContributingFactorItem[]>([]);
  
  // Fetch contributing factors directly using the service
  useEffect(() => {
    async function fetchContributingFactors() {
      if (!employeeData?.clientId) {
        setLoading(false);
        return;
      }
      
      try {
        const result = await contributingFactorService.getContributingFactors(employeeData.clientId);
        setFactors(result);
      } catch (error) {
        console.error('Error fetching contributing factors:', error);
        toast.error('Failed to fetch contributing factors');
      } finally {
        setLoading(false);
      }
    }
    
    fetchContributingFactors();
  }, [employeeData?.clientId]);

  const handleAdd = async () => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    if (!currentName.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setLoading(true);
      // Strictly using contributingFactorService and passing clientId
      await contributingFactorService.addContributingFactor(
        currentName.trim(), 
        currentDescription.trim(), 
        currentWeight,
        employeeData.clientId
      );
      
      // Refresh factors from service
      const updatedFactors = await contributingFactorService.getContributingFactors(employeeData.clientId);
      setFactors(updatedFactors);
      
      // Call the prop function to notify parent 
      // propAddFactor(currentName.trim(), currentDescription.trim(), currentWeight);
      
      // Reset form and close dialog
      setCurrentName('');
      setCurrentDescription('');
      setCurrentWeight('Medium');
      setIsAddDialogOpen(false);
      
      toast.success('Contributing factor added successfully');
    } catch (error) {
      console.error('Error adding contributing factor:', error);
      toast.error('Failed to add contributing factor');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    if (!currentId || !currentName.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setLoading(true);
      // Strictly using contributingFactorService and passing clientId
      await contributingFactorService.updateContributingFactor(
        currentId, 
        currentName.trim(), 
        currentDescription.trim(), 
        currentWeight,
        employeeData.clientId
      );
      
      // Refresh factors from service
      const updatedFactors = await contributingFactorService.getContributingFactors(employeeData.clientId);
      setFactors(updatedFactors);
      
      // Call the prop function to notify parent
      // propUpdateFactor(currentId, currentName.trim(), currentDescription.trim(), currentWeight);
      
      setIsEditDialogOpen(false);
      toast.success('Contributing factor updated successfully');
    } catch (error) {
      console.error('Error updating contributing factor:', error);
      toast.error('Failed to update contributing factor');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (factor: ContributingFactorItem) => {
    setCurrentId(factor.id);
    setCurrentName(factor.name);
    setCurrentDescription(factor.description || '');
    setCurrentWeight(factor.weight || 'Medium');
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    if (confirm('Are you sure you want to delete this contributing factor?')) {
      try {
        setLoading(true);
        // Strictly using contributingFactorService and passing clientId
        await contributingFactorService.deleteContributingFactor(id, employeeData.clientId);
        
        // Refresh factors from service 
        const updatedFactors = await contributingFactorService.getContributingFactors(employeeData.clientId);
        setFactors(updatedFactors);
        
        // Call the prop function to notify parent
        // propDeleteFactor(id);
        
        toast.success('Contributing factor deleted successfully');
      } catch (error) {
        console.error('Error deleting contributing factor:', error);
        toast.error('Failed to delete contributing factor');
      } finally {
        setLoading(false);
      }
    }
  };

  const getWeightBadgeClass = (weight: string | null | undefined) => {
    switch (weight) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Contributing Factors</h3>
        <Button 
          variant="outline" 
          onClick={() => setIsAddDialogOpen(true)}
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Factor
        </Button>
      </div>

      {loading ? (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Loading contributing factors...</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Weight
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {factors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No contributing factors have been added yet
                  </td>
                </tr>
              ) : (
                factors.map((factor) => (
                  <tr key={factor.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {factor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${getWeightBadgeClass(factor.weight)}`}>
                        {factor.weight || 'Medium'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="truncate max-w-xs">
                        {factor.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(factor)}
                          disabled={loading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(factor.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Factor Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contributing Factor</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={currentDescription}
                onChange={(e) => setCurrentDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="weight" className="text-right">
                Weight
              </Label>
              <Select value={currentWeight} onValueChange={setCurrentWeight}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select weight" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!currentName || loading}>
              {loading ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Factor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contributing Factor</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Input
                id="edit-description"
                value={currentDescription}
                onChange={(e) => setCurrentDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-weight" className="text-right">
                Weight
              </Label>
              <Select value={currentWeight} onValueChange={setCurrentWeight}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select weight" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!currentName || loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
