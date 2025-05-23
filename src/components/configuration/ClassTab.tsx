
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
import { ClassItem, CampusItem } from '@/contexts/types';
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

interface ClassTabProps {
  classes: ClassItem[];
  campuses: CampusItem[];
  addClass: (campusId: string, name: string) => void;
  updateClass: (id: string, campusId: string, name: string) => void;
  deleteClass: (id: string) => void;
  sections: Array<{ id: string, name: string, classId: string }>;
  loading?: boolean;
}

export const ClassTab = ({ 
  classes, 
  campuses,
  addClass, 
  updateClass, 
  deleteClass,
  sections,
  loading = false
}: ClassTabProps) => {
  const [newClass, setNewClass] = useState('');
  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [editingClass, setEditingClass] = useState<{id: string, name: string, campusId: string} | null>(null);

  const handleClassAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newClass.trim()) {
      toast.error("Grade name cannot be empty");
      return;
    }
    
    if (!selectedCampusId) {
      toast.error("Please select a campus for this grade");
      return;
    }
    
    addClass(selectedCampusId, newClass.trim());
    setNewClass('');
    toast.success("Grade added successfully");
  };

  const handleClassDelete = (id: string) => {
    const hasSections = sections.some(section => section.classId === id);
    
    if (hasSections) {
      toast.error("Cannot delete grade with associated sections. Remove the sections first.");
      return;
    }
    
    deleteClass(id);
    toast.success("Grade deleted successfully");
  };

  const handleClassUpdate = () => {
    if (!editingClass || !editingClass.name.trim()) {
      toast.error("Grade name cannot be empty");
      return;
    }
    
    if (!editingClass.campusId) {
      toast.error("Please select a campus for this grade");
      return;
    }
    
    console.log("Updating class:", editingClass.id, editingClass.campusId, editingClass.name.trim());
    updateClass(editingClass.id, editingClass.campusId, editingClass.name.trim());
  };

  const getCampusName = (campusId: string) => {
    const campus = campuses.find(c => c.id === campusId);
    return campus ? campus.name : 'Unknown Campus';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grade Management</CardTitle>
        <CardDescription>Add, edit, or remove grades/classes for each campus</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleClassAdd} className="flex gap-4 mb-6 flex-col sm:flex-row">
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
            <Label htmlFor="grade-input" className="mb-2 block">Grade Name</Label>
            <Input
              id="grade-input"
              placeholder="New grade name (e.g., Grade 5)"
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
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
                  <Plus className="mr-2 h-4 w-4" /> Add Grade
                </>
              )}
            </Button>
          </div>
        </form>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grade/Class Name</TableHead>
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
                    <span>Loading grades...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                  No grades available. Add your first grade above.
                </TableCell>
              </TableRow>
            ) : (
              classes.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell>{cls.name}</TableCell>
                  <TableCell>{getCampusName(cls.campusId)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <EditDialog
                        title="Edit Grade"
                        description="Update the grade details below"
                        fieldLabel="Grade name"
                        value={cls.name}
                        extraFields={[
                          {
                            type: "select",
                            label: "Campus",
                            options: campuses.map(campus => ({ value: campus.id, label: campus.name })),
                            value: editingClass?.id === cls.id ? editingClass.campusId : cls.campusId,
                            onChange: (value) => {
                              setEditingClass(prev => 
                                prev && prev.id === cls.id ? {...prev, campusId: value} : 
                                { id: cls.id, name: cls.name, campusId: value }
                              );
                            }
                          }
                        ]}
                        onOpenChange={(open) => {
                          if (open) {
                            setEditingClass({
                              id: cls.id, 
                              name: cls.name, 
                              campusId: cls.campusId
                            });
                          }
                        }}
                        onChange={(value) => {
                          setEditingClass(prev => 
                            prev && prev.id === cls.id ? {...prev, name: value} : prev
                          );
                        }}
                        onSave={handleClassUpdate}
                        triggerButton={
                          <Button variant="ghost" size="icon" disabled={loading}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleClassDelete(cls.id)}
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
