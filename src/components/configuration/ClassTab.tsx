
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

interface ClassTabProps {
  classes: ConfigItem[];
  addClass: (name: string) => void;
  updateClass: (id: string, name: string) => void;
  deleteClass: (id: string) => void;
}

export const ClassTab = ({ 
  classes, 
  addClass, 
  updateClass, 
  deleteClass 
}: ClassTabProps) => {
  const [newClass, setNewClass] = useState('');
  const [editingClass, setEditingClass] = useState<{id: string, name: string} | null>(null);

  const handleClassAdd = () => {
    if (!newClass.trim()) {
      toast.error("Class name cannot be empty");
      return;
    }
    
    addClass(newClass);
    setNewClass('');
    toast.success("Class added successfully");
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
    
    updateClass(editingClass.id, editingClass.name);
    setEditingClass(null);
    toast.success("Class updated successfully");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Class Management</CardTitle>
        <CardDescription>Add, edit, or remove classes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="New class name (e.g., Class 6)"
            value={newClass}
            onChange={(e) => setNewClass(e.target.value)}
          />
          <Button onClick={handleClassAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Class
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class Name</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((cls) => (
              <TableRow key={cls.id}>
                <TableCell>{cls.name}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <EditDialog
                      title="Edit Class"
                      description="Update the class name below"
                      fieldLabel="Class name"
                      value={cls.name}
                      onOpenChange={(open) => {
                        if (open) {
                          setEditingClass({id: cls.id, name: cls.name});
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
