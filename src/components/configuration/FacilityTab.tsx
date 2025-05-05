
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface FacilityTabProps {
  facilities: ConfigItem[];
  addFacility: (name: string) => void;
  updateFacility: (id: string, name: string) => void;
  deleteFacility: (id: string) => void;
}

export const FacilityTab = ({ 
  facilities, 
  addFacility, 
  updateFacility, 
  deleteFacility 
}: FacilityTabProps) => {
  const [newFacility, setNewFacility] = useState('');
  const [editingFacility, setEditingFacility] = useState<{id: string, name: string} | null>(null);

  const handleFacilityAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newFacility.trim()) {
      toast.error("Facility name cannot be empty");
      return;
    }
    
    try {
      addFacility(newFacility.trim());
      setNewFacility('');
      toast.success("Facility added successfully");
    } catch (error) {
      console.error("Error adding facility:", error);
      toast.error("Failed to add facility");
    }
  };

  const handleFacilityDelete = (id: string) => {
    try {
      deleteFacility(id);
      toast.success("Facility deleted successfully");
    } catch (error) {
      console.error("Error deleting facility:", error);
      toast.error("Failed to delete facility");
    }
  };

  const handleFacilityUpdate = (id: string, name: string) => {
    if (!name.trim()) {
      toast.error("Facility name cannot be empty");
      return;
    }
    
    try {
      updateFacility(id, name.trim());
      setEditingFacility(null);
      toast.success("Facility updated successfully");
    } catch (error) {
      console.error("Error updating facility:", error);
      toast.error("Failed to update facility");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incident Facilities</CardTitle>
        <CardDescription>Manage available incident facilities</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleFacilityAdd} className="flex gap-4 mb-6">
          <Input
            placeholder="New facility name"
            value={newFacility}
            onChange={(e) => setNewFacility(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">
            <Plus className="mr-2 h-4 w-4" /> Add Facility
          </Button>
        </form>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Facility Name</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facilities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-4 text-gray-500">
                  No facilities found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              facilities.map((facility) => (
                <TableRow key={facility.id}>
                  <TableCell>{facility.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <EditDialog
                        title="Edit Facility"
                        description="Update the facility name below"
                        fieldLabel="Facility name"
                        value={facility.name}
                        onOpenChange={(open) => {
                          if (open) {
                            setEditingFacility({id: facility.id, name: facility.name});
                          }
                        }}
                        onChange={(value) => {
                          if (editingFacility) {
                            setEditingFacility({...editingFacility, name: value});
                          }
                        }}
                        onSave={() => {
                          if (editingFacility) {
                            handleFacilityUpdate(facility.id, editingFacility.name);
                          }
                        }}
                        triggerButton={
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Facility</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this facility? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleFacilityDelete(facility.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
