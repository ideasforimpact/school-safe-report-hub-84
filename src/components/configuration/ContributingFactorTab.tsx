
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
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

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
  const [error, setError] = useState<string | null>(null);
  const { employeeData } = useAuth();
  const [factors, setFactors] = useState<ContributingFactorItem[]>([]);
  
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
      } finally {
        setLoading(false);
      }
    }
    
    fetchContributingFactors();
  }, [employeeData?.clientId]);

  const handleAdd = async () => {
    if (!employeeData?.clientId) {
      setError('Client information not available');
      return;
    }

    if (!currentName.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setError(null);
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
      
      // Reset form and close dialog
      setCurrentName('');
      setCurrentDescription('');
      setCurrentWeight('Medium');
      setIsAddDialogOpen(false);
      
      toast.success('Contributing factor added successfully');
    } catch (error: any) {
      console.error('Error adding contributing factor:', error);
      setError(error.message || 'Failed to add contributing factor');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!employeeData?.clientId) {
      setError('Client information not available');
      return;
    }

    if (!currentId || !currentName.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setError(null);
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
      
      setIsEditDialogOpen(false);
      toast.success('Contributing factor updated successfully');
    } catch (error: any) {
      console.error('Error updating contributing factor:', error);
      setError(error.message || 'Failed to update contributing factor');
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

    // Find the contributing factor to get its name for the confirmation message
    const factor = factors.find(f => f.id === id);
    const factorName = factor?.name || 'this contributing factor';

    setConfirmationDialog({
      open: true,
      title: 'Delete Contributing Factor',
      description: 'Please confirm that you want to proceed with this deletion. This action will immediately remove the contributing factor and cannot be recovered.',
      itemName: factorName,
      action: 'delete',
      error: null,
      onConfirm: async () => {
        try {
          setLoading(true);
          // Strictly using contributingFactorService and passing clientId
          await contributingFactorService.deleteContributingFactor(id, employeeData.clientId);
          
          // Refresh factors from service 
          const updatedFactors = await contributingFactorService.getContributingFactors(employeeData.clientId);
          setFactors(updatedFactors);
          
          // Call the prop function to notify parent
          // propDeleteFactor(id);
          
          setConfirmationDialog(prev => ({ ...prev, open: false }));
        } catch (error: any) {
          console.error('Error deleting contributing factor:', error);
          const errorMessage = error?.message || 'Failed to delete contributing factor';
          setConfirmationDialog(prev => ({ ...prev, error: errorMessage }));
        } finally {
          setLoading(false);
        }
      },
    });
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
                      <div className="truncate max-w-xs" title={factor.description || 'No description'}>
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
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) {
          // Clear error and reset form when dialog closes
          setError(null);
          setCurrentName('');
          setCurrentDescription('');
          setCurrentWeight('Medium');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contributing Factor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Error message display - moved to top */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
                className={error ? 'border-red-500' : ''}
                maxLength={25}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">
                Description
              </Label>
              <Input
                id="description"
                value={currentDescription}
                onChange={(e) => setCurrentDescription(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">
                Weight
              </Label>
              <Select value={currentWeight} onValueChange={setCurrentWeight}>
                <SelectTrigger>
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
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              setError(null);
              setCurrentName('');
              setCurrentDescription('');
              setCurrentWeight('Medium');
            }} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={loading || !!error}>
              {loading ? 'Adding...' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Factor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          // Clear error when dialog closes
          setError(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contributing Factor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Error message display - moved to top */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={currentName}
                onChange={(e) => setCurrentName(e.target.value)}
                className={error ? 'border-red-500' : ''}
                maxLength={25}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">
                Description
              </Label>
              <Input
                id="edit-description"
                value={currentDescription}
                onChange={(e) => setCurrentDescription(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-weight">
                Weight
              </Label>
              <Select value={currentWeight} onValueChange={setCurrentWeight}>
                <SelectTrigger>
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
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setError(null);
            }} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading || !!error}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
