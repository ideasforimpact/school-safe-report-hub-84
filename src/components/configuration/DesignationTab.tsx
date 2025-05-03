
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { ConfigItem } from '@/contexts/types';
import { EditDialog } from './EditDialog';
import { toast } from '@/components/ui/sonner';

interface DesignationTabProps {
  designations: ConfigItem[];
  addDesignation: (name: string) => void;
  updateDesignation: (id: string, name: string) => void;
  deleteDesignation: (id: string) => void;
}

export const DesignationTab = ({ 
  designations, 
  addDesignation, 
  updateDesignation, 
  deleteDesignation 
}: DesignationTabProps) => {
  const [newDesignation, setNewDesignation] = useState('');
  const [editingDesignation, setEditingDesignation] = useState<{id: string, name: string} | null>(null);

  const handleDesignationAdd = () => {
    if (!newDesignation.trim()) {
      toast.error("Designation name cannot be empty");
      return;
    }
    
    addDesignation(newDesignation);
    setNewDesignation('');
    toast.success("Designation added successfully");
  };

  const handleDesignationDelete = (id: string) => {
    deleteDesignation(id);
    toast.success("Designation deleted successfully");
  };

  const handleDesignationUpdate = () => {
    if (!editingDesignation || !editingDesignation.name.trim()) {
      toast.error("Designation name cannot be empty");
      return;
    }
    
    updateDesignation(editingDesignation.id, editingDesignation.name);
    setEditingDesignation(null);
    toast.success("Designation updated successfully");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Designations</CardTitle>
        <CardDescription>Manage user role designations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="New designation name"
            value={newDesignation}
            onChange={(e) => setNewDesignation(e.target.value)}
          />
          <Button onClick={handleDesignationAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Designation
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Designation Name</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {designations.map((designation) => (
              <TableRow key={designation.id}>
                <TableCell>{designation.name}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <EditDialog
                      title="Edit Designation"
                      description="Update the designation name below"
                      fieldLabel="Designation name"
                      value={designation.name}
                      onOpenChange={(open) => {
                        if (open) {
                          setEditingDesignation({id: designation.id, name: designation.name});
                        } else {
                          setEditingDesignation(null);
                        }
                      }}
                      onChange={(value) => setEditingDesignation(prev => 
                        prev ? {...prev, name: value} : null
                      )}
                      onSave={handleDesignationUpdate}
                      triggerButton={
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDesignationDelete(designation.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {designations.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  No designations found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
