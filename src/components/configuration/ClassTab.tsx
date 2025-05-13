
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

interface ClassTabProps {
  classes: ClassItem[];
  campuses: CampusItem[];
  addClass: (campusId: string, name: string) => void;
  updateClass: (id: string, campusId: string, name: string) => void;
  deleteClass: (id: string) => void;
}

export const ClassTab = ({ 
  classes, 
  campuses,
  addClass, 
  updateClass, 
  deleteClass 
}: ClassTabProps) => {
  const [newClass, setNewClass] = useState('');
  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [editingClass, setEditingClass] = useState<{id: string, name: string, campusId: string} | null>(null);

  const handleClassAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newClass.trim()) {
      toast.error("Class name cannot be empty");
      return;
    }
    
    if (!selectedCampusId) {
      toast.error("Please select a campus for this class");
      return;
    }
    
    console.log("Adding class:", newClass, "to campus:", selectedCampusId);
    addClass(selectedCampusId, newClass.trim());
    setNewClass('');
  };

  const handleClassDelete = (id: string) => {
    deleteClass(id);
    toast.success("Class deleted successfully");
  };

  const handleClassUpdate = () => {
    if (!editingClass || !editingClass.name.trim()) {
      toast.error("Class name cannot be empty");
      return;
    }
    
    if (!editingClass.campusId) {
      toast.error("Please select a campus for this class");
      return;
    }
    
    updateClass(editingClass.id, editingClass.campusId, editingClass.name);
    setEditingClass(null);
    toast.success("Class updated successfully");
  };

  const getCampusName = (campusId: string) => {
    const foundCampus = campuses.find(campus => campus.id === campusId);
    return foundCampus ? foundCampus.name : 'Unknown Campus';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Class Management</CardTitle>
        <CardDescription>Add, edit, or remove classes</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleClassAdd} className="flex gap-4 mb-6 flex-col sm:flex-row">
          <div className="flex-1">
            <Select value={selectedCampusId} onValueChange={setSelectedCampusId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a Campus" />
              </SelectTrigger>
              <SelectContent>
                {campuses.map((campus) => (
                  <SelectItem key={campus.id} value={campus.id}>{campus.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Input
              placeholder="New class name (e.g., Class 6)"
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
            />
          </div>
          <Button type="submit" className="whitespace-nowrap">
            <Plus className="mr-2 h-4 w-4" /> Add Class
          </Button>
        </form>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class Name</TableHead>
              <TableHead>Campus</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                  No classes available. Add your first class above.
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
                        title="Edit Class"
                        description="Update the class details below"
                        fieldLabel="Class name"
                        value={cls.name}
                        extraField={{
                          type: "select",
                          label: "Campus",
                          options: campuses.map(campus => ({ value: campus.id, label: campus.name })),
                          value: cls.campusId,
                          onChange: (value) => setEditingClass(prev => 
                            prev ? {...prev, campusId: value} : null
                          )
                        }}
                        onOpenChange={(open) => {
                          if (open) {
                            setEditingClass({
                              id: cls.id, 
                              name: cls.name, 
                              campusId: cls.campusId
                            });
                          } else {
                            setEditingClass(null);
                          }
                        }}
                        onChange={(value) => setEditingClass(prev => 
                          prev ? {...prev, name: value} : null
                        )}
                        onSave={handleClassUpdate}
                        triggerButton={
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleClassDelete(cls.id)}
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
