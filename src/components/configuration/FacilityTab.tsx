
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

  const handleFacilityAdd = () => {
    if (!newFacility.trim()) {
      toast.error("Facility name cannot be empty");
      return;
    }
    
    addFacility(newFacility);
    setNewFacility('');
    toast.success("Facility added successfully");
  };

  const handleFacilityDelete = (id: string) => {
    deleteFacility(id);
    toast.success("Facility deleted successfully");
  };

  const handleFacilityUpdate = () => {
    if (!editingFacility || !editingFacility.name.trim()) {
      toast.error("Facility name cannot be empty");
      return;
    }
    
    updateFacility(editingFacility.id, editingFacility.name);
    setEditingFacility(null);
    toast.success("Facility updated successfully");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>School Facilities</CardTitle>
        <CardDescription>Manage school facilities where incidents can occur</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="New facility name"
            value={newFacility}
            onChange={(e) => setNewFacility(e.target.value)}
          />
          <Button onClick={handleFacilityAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Facility
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Facility Name</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facilities.map((facility) => (
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
                        } else {
                          setEditingFacility(null);
                        }
                      }}
                      onChange={(value) => setEditingFacility(prev => 
                        prev ? {...prev, name: value} : null
                      )}
                      onSave={handleFacilityUpdate}
                      triggerButton={
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleFacilityDelete(facility.id)}
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
