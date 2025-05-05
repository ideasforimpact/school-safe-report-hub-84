
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

  const handleLocationAdd = () => {
    if (!newLocation.trim()) {
      toast.error("Location name cannot be empty");
      return;
    }
    
    addLocation(newLocation);
    setNewLocation('');
    toast.success("Location added successfully");
  };

  const handleLocationDelete = (id: string) => {
    deleteLocation(id);
    toast.success("Location deleted successfully");
  };

  const handleLocationUpdate = () => {
    if (!editingLocation || !editingLocation.name.trim()) {
      toast.error("Location name cannot be empty");
      return;
    }
    
    updateLocation(editingLocation.id, editingLocation.name);
    setEditingLocation(null);
    toast.success("Location updated successfully");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incident Locations</CardTitle>
        <CardDescription>Manage where incidents can happen</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="New location name"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
          />
          <Button onClick={handleLocationAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Location
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location Name</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((location) => (
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
                        } else {
                          setEditingLocation(null);
                        }
                      }}
                      onChange={(value) => setEditingLocation(prev => 
                        prev ? {...prev, name: value} : null
                      )}
                      onSave={handleLocationUpdate}
                      triggerButton={
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleLocationDelete(location.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
