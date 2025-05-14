
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { EditDialog } from '@/components/configuration/EditDialog';
import { ConfigItem } from '@/contexts/types';

interface ContributingFactor extends ConfigItem {
  description?: string;
  weight?: 'Low' | 'Medium' | 'High';
}

interface ContributingFactorsTabProps {
  contributingFactors: ContributingFactor[];
  addContributingFactor: (name: string, description: string, weight: 'Low' | 'Medium' | 'High') => void;
  updateContributingFactor: (id: string, name: string, description: string, weight: 'Low' | 'Medium' | 'High') => void;
  deleteContributingFactor: (id: string) => void;
}

export const ContributingFactorsTab: React.FC<ContributingFactorsTabProps> = ({
  contributingFactors,
  addContributingFactor,
  updateContributingFactor,
  deleteContributingFactor
}) => {
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newWeight, setNewWeight] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [isEditing, setIsEditing] = useState(false);
  const [currentFactor, setCurrentFactor] = useState<ContributingFactor | null>(null);

  const handleAdd = () => {
    if (!newName.trim()) {
      toast.error("Factor name cannot be empty");
      return;
    }

    addContributingFactor(newName, newDescription, newWeight);
    
    // Reset form
    setNewName('');
    setNewDescription('');
    setNewWeight('Medium');
  };

  const handleEdit = (factor: ContributingFactor) => {
    setCurrentFactor(factor);
    setIsEditing(true);
  };

  const handleUpdate = (id: string, name: string, description: string, weight: 'Low' | 'Medium' | 'High') => {
    updateContributingFactor(id, name, description, weight);
    setIsEditing(false);
    setCurrentFactor(null);
  };

  const handleDelete = (id: string) => {
    deleteContributingFactor(id);
  };

  const handleSave = (name: string) => {
    if (currentFactor) {
      const description = (document.getElementById('edit-description') as HTMLTextAreaElement)?.value || '';
      const weight = (document.getElementById('edit-weight') as HTMLSelectElement)?.value as 'Low' | 'Medium' | 'High' || 'Medium';
      handleUpdate(currentFactor.id, name, description, weight);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-md shadow">
        <h2 className="text-lg font-medium mb-4">Add New Contributing Factor</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="factor-name" className="block text-sm font-medium text-gray-700 mb-1">
              Factor Name
            </label>
            <Input
              id="factor-name"
              placeholder="Enter factor name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="factor-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              id="factor-description"
              placeholder="Enter description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="factor-weight" className="block text-sm font-medium text-gray-700 mb-1">
              Weight
            </label>
            <Select value={newWeight} onValueChange={(value: 'Low' | 'Medium' | 'High') => setNewWeight(value)}>
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
          <Button onClick={handleAdd} className="w-full flex items-center gap-2">
            <Plus size={16} /> Add Contributing Factor
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contributingFactors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                    No contributing factors added yet
                  </TableCell>
                </TableRow>
              ) : (
                contributingFactors.map((factor) => (
                  <TableRow key={factor.id}>
                    <TableCell>{factor.name}</TableCell>
                    <TableCell>{factor.description || '-'}</TableCell>
                    <TableCell>
                      <span 
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          factor.weight === 'High' ? 'bg-red-100 text-red-800' : 
                          factor.weight === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'
                        }`}
                      >
                        {factor.weight || 'Medium'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(factor)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(factor.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isEditing && currentFactor && (
        <EditDialog
          title="Edit Contributing Factor"
          description="Update the contributing factor details"
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          onSave={handleSave}
          defaultValue={currentFactor.name}
        >
          <div className="space-y-4 pt-4">
            <div>
              <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Textarea
                id="edit-description"
                placeholder="Enter description"
                defaultValue={currentFactor.description || ''}
                rows={3}
              />
            </div>
            <div>
              <label htmlFor="edit-weight" className="block text-sm font-medium text-gray-700 mb-1">
                Weight
              </label>
              <Select defaultValue={currentFactor.weight || 'Medium'}>
                <SelectTrigger id="edit-weight">
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
        </EditDialog>
      )}
    </div>
  );
};
