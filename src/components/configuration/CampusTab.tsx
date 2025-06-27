
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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { CampusItem } from '@/contexts/types';
import { EditDialog } from './EditDialog';
import { toast } from 'sonner';

interface CampusTabProps {
  campuses: CampusItem[];
  addCampus: (name: string) => void;
  updateCampus: (id: string, name: string) => void;
  deleteCampus: (id: string) => void;
  classes: Array<{ id: string, name: string, campusId: string }>;
  loading?: boolean;
}

export const CampusTab = ({ 
  campuses, 
  addCampus, 
  updateCampus, 
  deleteCampus,
  classes,
  loading = false
}: CampusTabProps) => {
  const [newCampus, setNewCampus] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleCampusAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCampus.trim()) {
      toast.error("Campus name cannot be empty");
      return;
    }
    
    console.log("Adding campus:", newCampus.trim());
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

  const handleEditOpen = (campus: CampusItem) => {
    console.log("Opening edit dialog for campus:", campus);
    setEditValue(campus.name);
    setEditDialogOpen(campus.id);
  };

  const handleEditSave = () => {
    if (!editValue.trim()) {
      toast.error("Campus name cannot be empty");
      return;
    }
    
    if (editDialogOpen) {
      console.log("Updating campus:", editDialogOpen, "with name:", editValue.trim());
      updateCampus(editDialogOpen, editValue.trim());
      setEditDialogOpen(null);
      setEditValue('');
    }
  };

  const handleEditCancel = () => {
    console.log("Canceling edit dialog");
    setEditDialogOpen(null);
    setEditValue('');
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
              />
            </div>
            <Button type="submit" className="whitespace-nowrap" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Add Campus
                </>
              )}
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-4">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading campuses...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : campuses.length === 0 ? (
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
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditOpen(campus)}
                        disabled={loading}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleCampusDelete(campus.id)}
                        disabled={loading}
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

        {/* Edit Dialog */}
        <EditDialog
          title="Edit Campus"
          description="Update the campus name below"
          fieldLabel="Campus name"
          value={editValue}
          open={editDialogOpen !== null}
          onOpenChange={(open) => {
            if (!open) {
              handleEditCancel();
            }
          }}
          onChange={setEditValue}
          onSave={handleEditSave}
          onClose={handleEditCancel}
        />
      </CardContent>
    </Card>
  );
};
