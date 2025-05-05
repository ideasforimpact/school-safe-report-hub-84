
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

interface LocationTabProps {
  locations: ConfigItem[];
  addLocation: (name: string) => void;
  updateLocation: (id: string, name: string) => void;
  deleteLocation: (id: string) => void;
}

export const LocationTab = ({ 
  locations, 
  addLocation, 
  updateLocation, 
  deleteLocation 
}: LocationTabProps) => {
  const [newLocation, setNewLocation] = useState('');
  const [editingLocation, setEditingLocation] = useState<{id: string, name: string} | null>(null);

  const handleLocationAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newLocation.trim()) {
      toast.error("Location name cannot be empty");
      return;
    }
    
    try {
      addLocation(newLocation.trim());
      setNewLocation('');
      toast.success("Location added successfully");
    } catch (error) {
      console.error("Error adding location:", error);
      toast.error("Failed to add location");
    }
  };

  const handleLocationDelete = (id: string) => {
    try {
      deleteLocation(id);
      toast.success("Location deleted successfully");
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Failed to delete location");
    }
  };

  const handleLocationUpdate = (id: string, name: string) => {
    if (!name.trim()) {
      toast.error("Location name cannot be empty");
      return;
    }
    
    try {
      updateLocation(id, name.trim());
      setEditingLocation(null);
      toast.success("Location updated successfully");
    } catch (error) {
      console.error("Error updating location:", error);
      toast.error("Failed to update location");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incident Locations</CardTitle>
        <CardDescription>Manage available incident locations</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLocationAdd} className="flex gap-4 mb-6">
          <Input
            placeholder="New location name"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">
            <Plus className="mr-2 h-4 w-4" /> Add Location
          </Button>
        </form>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location Name</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-4 text-gray-500">
                  No locations found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>{location.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <EditDialog
                        title="Edit Location"
                        description="Update the location name below"
                        fieldLabel="Location name"
                        value={location.name}
                        onOpenChange={(open) => {
                          if (open) {
                            setEditingLocation({id: location.id, name: location.name});
                          }
                        }}
                        onChange={(value) => {
                          if (editingLocation) {
                            setEditingLocation({...editingLocation, name: value});
                          }
                        }}
                        onSave={() => {
                          if (editingLocation) {
                            handleLocationUpdate(location.id, editingLocation.name);
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
                            <AlertDialogTitle>Delete Location</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this location? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleLocationDelete(location.id)}
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
