
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
    
    if (!editingFacility.campusId) {
      toast.error("Please select a campus for this facility");
      return;
    }
    
    updateFacility(editingFacility.id, editingFacility.name.trim(), editingFacility.campusId);
    setEditingFacility(null);
    toast.success("Facility updated successfully");
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
              facilities.map((facility) => (
                <TableRow key={facility.id}>
                  <TableCell>{facility.name}</TableCell>
                  <TableCell>
                    {/* We'll add campus name display in the next update */}
                    Campus Name
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <EditDialog
                        title="Edit Facility"
                        description="Update the facility name below"
                        fieldLabel="Facility name"
                        value={facility.name}
                        extraField={{
                          type: "select",
                          label: "Campus",
                          options: campuses.map(campus => ({ value: campus.id, label: campus.name })),
                          value: editingFacility?.campusId || "",
                          onChange: (value) => setEditingFacility(prev => 
                            prev ? {...prev, campusId: value} : null
                          )
                        }}
                        onOpenChange={(open) => {
                          if (open) {
                            setEditingFacility({
                              id: facility.id, 
                              name: facility.name,
                              campusId: "" // Will need to get this from the database in a future update
                            });
                          } else {
                            setEditingFacility(null);
                          }
                        }}
                        onChange={(value) => setEditingFacility(prev => 
                          prev ? {...prev, name: value} : null
                        )}
                        onSave={handleFacilityUpdate}
                        triggerButton={
                          <Button variant="ghost" size="icon" disabled={loading}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleFacilityDelete(facility.id)}
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
      </CardContent>
    </Card>
  );
};
