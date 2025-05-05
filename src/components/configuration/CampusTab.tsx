
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
import { CampusItem } from '@/contexts/types';
import { EditDialog } from './EditDialog';
import { toast } from '@/components/ui/sonner';

interface CampusTabProps {
  campuses: CampusItem[];
  addCampus: (name: string) => void;
  updateCampus: (id: string, name: string) => void;
  deleteCampus: (id: string) => void;
  classes: Array<{ id: string, name: string, campusId: string }>;
}

export const CampusTab = ({ 
  campuses, 
  addCampus, 
  updateCampus, 
  deleteCampus,
  classes
}: CampusTabProps) => {
  const [newCampus, setNewCampus] = useState('');
  const [editingCampus, setEditingCampus] = useState<{id: string, name: string} | null>(null);

  const handleCampusAdd = (e: React.FormEvent) => {
    // Prevent form submission default behavior
    e.preventDefault();
    
    if (!newCampus.trim()) {
      toast.error("Campus name cannot be empty");
      return;
    }
    
    addCampus(newCampus.trim());
    setNewCampus('');
  };

  const handleCampusDelete = (id: string) => {
    const hasClasses = classes.some(cls => cls.campusId === id);
    
    if (hasClasses) {
      toast.error("Cannot delete campus with associated classes. Remove the classes first.");
      return;
    }
    
    deleteCampus(id);
  };

  const handleCampusUpdate = () => {
    if (!editingCampus || !editingCampus.name.trim()) {
      toast.error("Campus name cannot be empty");
      return;
    }
    
    updateCampus(editingCampus.id, editingCampus.name.trim());
    setEditingCampus(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission on Enter key
      handleCampusAdd(e);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campus Management</CardTitle>
        <CardDescription>Add, edit, or remove campuses</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCampusAdd} className="mb-6">
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="flex-1">
              <Input
                placeholder="New campus name (e.g., Main Campus)"
                value={newCampus}
                onChange={(e) => setNewCampus(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <Button type="submit" className="whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4" /> Add Campus
            </Button>
          </div>
        </form>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campus Name</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campuses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                  No campuses available. Add your first campus above.
                </TableCell>
              </TableRow>
            ) : (
              campuses.map((campus) => (
                <TableRow key={campus.id}>
                  <TableCell>{campus.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <EditDialog
                        title="Edit Campus"
                        description="Update the campus name below"
                        fieldLabel="Campus name"
                        value={campus.name}
                        onOpenChange={(open) => {
                          if (open) {
                            setEditingCampus({
                              id: campus.id, 
                              name: campus.name
                            });
                          } else {
                            setEditingCampus(null);
                          }
                        }}
                        onChange={(value) => setEditingCampus(prev => 
                          prev ? {...prev, name: value} : null
                        )}
                        onSave={handleCampusUpdate}
                        triggerButton={
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleCampusDelete(campus.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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
  );
};
