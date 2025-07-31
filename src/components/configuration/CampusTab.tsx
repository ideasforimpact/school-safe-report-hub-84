
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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  const [editingCampus, setEditingCampus] = useState<CampusItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campusToDelete, setCampusToDelete] = useState<{id: string, name: string} | null>(null);

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

  const handleDeleteClick = (campus: CampusItem) => {
    setCampusToDelete({
      id: campus.id,
      name: campus.name
    });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (campusToDelete) {
      try {
        await deleteCampus(campusToDelete.id);
        setDeleteDialogOpen(false);
        setCampusToDelete(null);
      } catch (error: any) {
        // Error handling is done in the hook, just close the dialog
        setDeleteDialogOpen(false);
        setCampusToDelete(null);
      }
    }
  };

  const handleEditOpen = (campus: CampusItem) => {
    console.log("Opening edit dialog for campus:", campus);
    setEditingCampus(campus);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = (updatedName: string) => {
    if (!updatedName.trim()) {
      toast.error("Campus name cannot be empty");
      return;
    }
    
    if (editingCampus) {
      console.log("Updating campus:", editingCampus.id, "with name:", updatedName.trim());
      updateCampus(editingCampus.id, updatedName.trim());
      handleEditClose();
    }
  };

  const handleEditClose = () => {
    console.log("Closing edit dialog");
    setIsEditDialogOpen(false);
    setEditingCampus(null);
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
                        onClick={() => handleDeleteClick(campus)}
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Campus</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the campus "{campusToDelete?.name}"? 
                This action cannot be undone. If this campus is linked to any incidents, 
                classes, or facilities, deletion will be prevented.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setDeleteDialogOpen(false);
                setCampusToDelete(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Dialog */}
        {editingCampus && (
          <EditDialog
            title="Edit Campus"
            description="Update the campus name below"
            fieldLabel="Campus name"
            value={editingCampus.name}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onChange={() => {}} // Not needed for this pattern
            onSave={() => handleEditSave}
            onClose={handleEditClose}
          />
        )}
      </CardContent>
    </Card>
  );
};
