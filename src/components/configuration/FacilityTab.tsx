
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
import { ConfigItem, CampusItem } from '@/contexts/types';
import { EditDialog } from './EditDialog';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface FacilityTabProps {
  facilities: ConfigItem[];
  campuses: CampusItem[];
  addFacility: (name: string, campusId: string) => void;
  updateFacility: (id: string, name: string, campusId: string) => void;
  deleteFacility: (id: string) => void;
  loading?: boolean;
}

export const FacilityTab = ({ 
  facilities, 
  campuses,
  addFacility, 
  updateFacility, 
  deleteFacility,
  loading = false
}: FacilityTabProps) => {
  const [newFacility, setNewFacility] = useState('');
  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [editingFacility, setEditingFacility] = useState<{id: string, name: string, campusId: string} | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState<{id: string, name: string} | null>(null);

  const handleFacilityAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newFacility.trim()) {
      toast.error("Facility name cannot be empty");
      return;
    }
    
    if (!selectedCampusId) {
      toast.error("Please select a campus for this facility");
      return;
    }
    
    addFacility(newFacility.trim(), selectedCampusId);
    setNewFacility('');
    setSelectedCampusId('');
    toast.success("Facility added successfully");
  };

  const handleDeleteClick = (facility: ConfigItem) => {
    setFacilityToDelete({
      id: facility.id,
      name: facility.name
    });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (facilityToDelete) {
      try {
        await deleteFacility(facilityToDelete.id);
        setDeleteDialogOpen(false);
        setFacilityToDelete(null);
      } catch (error: any) {
        // Error handling is done in the hook, just close the dialog
        setDeleteDialogOpen(false);
        setFacilityToDelete(null);
      }
    }
  };

  const handleEditOpen = (facility: any) => {
    console.log("Opening edit dialog for facility:", facility);
    setEditingFacility({
      id: facility.id,
      name: facility.name,
      campusId: facility.campusId || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSave = (updatedName: string) => {
    if (!updatedName.trim()) {
      toast.error("Facility name cannot be empty");
      return;
    }
    
    if (editingFacility) {
      if (!editingFacility.campusId) {
        toast.error("Please select a campus for this facility");
        return;
      }
      
      console.log("Updating facility:", editingFacility.id, updatedName.trim(), editingFacility.campusId);
      updateFacility(editingFacility.id, updatedName.trim(), editingFacility.campusId);
      handleEditClose();
      toast.success("Facility updated successfully");
    }
  };

  const handleEditClose = () => {
    console.log("Closing edit dialog");
    setIsEditDialogOpen(false);
    setEditingFacility(null);
  };

  const handleCampusChange = (campusId: string) => {
    if (editingFacility) {
      setEditingFacility(prev => prev ? { ...prev, campusId } : null);
    }
  };

  const getCampusName = (campusId: string) => {
    const campus = campuses.find(c => c.id === campusId);
    return campus ? campus.name : 'Unknown Campus';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>School Facilities</CardTitle>
        <CardDescription>Manage facilities for your institution</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFacilityAdd} className="flex gap-4 mb-6 flex-col sm:flex-row">
          <div className="flex-1">
            <Label htmlFor="campus-select" className="mb-2 block">Campus</Label>
            <Select value={selectedCampusId} onValueChange={setSelectedCampusId}>
              <SelectTrigger id="campus-select" className="w-full">
                <SelectValue placeholder="Select a Campus" />
              </SelectTrigger>
              <SelectContent>
                {campuses.length === 0 ? (
                  <SelectItem value="no-campuses" disabled>No campuses available</SelectItem>
                ) : (
                  campuses.map((campus) => (
                    <SelectItem key={campus.id} value={campus.id}>{campus.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="facility-input" className="mb-2 block">Facility Name</Label>
            <Input
              id="facility-input"
              placeholder="New facility name (e.g., Laboratory)"
              value={newFacility}
              onChange={(e) => setNewFacility(e.target.value)}
            />
          </div>
          <div className="self-end">
            <Button type="submit" className="whitespace-nowrap w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Add Facility
                </>
              )}
            </Button>
          </div>
        </form>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Facility Name</TableHead>
              <TableHead>Campus</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading facilities...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : facilities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                  No facilities available. Add your first facility above.
                </TableCell>
              </TableRow>
            ) : (
              facilities.map((facility: any) => (
                <TableRow key={facility.id}>
                  <TableCell>{facility.name}</TableCell>
                  <TableCell>
                    {getCampusName(facility.campusId)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditOpen(facility)}
                        disabled={loading}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteClick(facility)}
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
              <AlertDialogTitle>Delete Facility</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the facility "{facilityToDelete?.name}"? 
                This action cannot be undone. If this facility is linked to any incidents, 
                deletion will be prevented.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setDeleteDialogOpen(false);
                setFacilityToDelete(null);
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
        {editingFacility && (
          <EditDialog
            title="Edit Facility"
            description="Update the facility details below"
            fieldLabel="Facility name"
            value={editingFacility.name}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onChange={(value) => {
              setEditingFacility(prev => prev ? { ...prev, name: value } : null);
            }}
            onSave={handleEditSave}
            onClose={handleEditClose}
            extraFields={[
              {
                type: "select",
                label: "Campus",
                options: campuses.map(campus => ({ value: campus.id, label: campus.name })),
                value: editingFacility.campusId,
                onChange: handleCampusChange
              }
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
};
