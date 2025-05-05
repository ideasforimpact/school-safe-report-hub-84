
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
import { SectionItem, ClassItem } from '@/contexts/types';
import { EditDialog } from './EditDialog';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SectionTabProps {
  sections: SectionItem[];
  classes: ClassItem[];
  addSection: (classId: string, name: string) => void;
  updateSection: (id: string, classId: string, name: string) => void;
  deleteSection: (id: string) => void;
}

export const SectionTab = ({ 
  sections, 
  classes,
  addSection, 
  updateSection, 
  deleteSection 
}: SectionTabProps) => {
  const [newSection, setNewSection] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [editingSection, setEditingSection] = useState<{id: string, name: string, classId: string} | null>(null);

  const handleSectionAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSection.trim()) {
      toast.error("Section name cannot be empty");
      return;
    }
    
    if (!selectedClassId) {
      toast.error("Please select a class for this section");
      return;
    }
    
    console.log("Adding section:", newSection.trim(), "to class:", selectedClassId);
    addSection(selectedClassId, newSection.trim());
    setNewSection('');
  };

  const handleSectionDelete = (id: string) => {
    deleteSection(id);
    toast.success("Section deleted successfully");
  };

  const handleSectionUpdate = () => {
    if (!editingSection || !editingSection.name.trim()) {
      toast.error("Section name cannot be empty");
      return;
    }
    
    if (!editingSection.classId) {
      toast.error("Please select a class for this section");
      return;
    }
    
    updateSection(editingSection.id, editingSection.classId, editingSection.name.trim());
    setEditingSection(null);
    toast.success("Section updated successfully");
  };

  const getClassName = (classId: string) => {
    const foundClass = classes.find(cls => cls.id === classId);
    return foundClass ? foundClass.name : 'Unknown Class';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Section Management</CardTitle>
        <CardDescription>Add, edit, or remove sections</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSectionAdd} className="flex gap-4 mb-6 flex-col sm:flex-row">
          <div className="flex-1">
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a Class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Input
              placeholder="New section name (e.g., Section A)"
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
            />
          </div>
          <Button type="submit" className="whitespace-nowrap">
            <Plus className="mr-2 h-4 w-4" /> Add Section
          </Button>
        </form>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Section Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                  No sections available. Add your first section above.
                </TableCell>
              </TableRow>
            ) : (
              sections.map((section) => (
                <TableRow key={section.id}>
                  <TableCell>{section.name}</TableCell>
                  <TableCell>{getClassName(section.classId)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <EditDialog
                        title="Edit Section"
                        description="Update the section details below"
                        fieldLabel="Section name"
                        value={section.name}
                        extraField={{
                          type: "select",
                          label: "Class",
                          options: classes.map(cls => ({ value: cls.id, label: cls.name })),
                          value: section.classId,
                          onChange: (value) => setEditingSection(prev => 
                            prev ? {...prev, classId: value} : null
                          )
                        }}
                        onOpenChange={(open) => {
                          if (open) {
                            setEditingSection({
                              id: section.id, 
                              name: section.name, 
                              classId: section.classId
                            });
                          } else {
                            setEditingSection(null);
                          }
                        }}
                        onChange={(value) => setEditingSection(prev => 
                          prev ? {...prev, name: value} : null
                        )}
                        onSave={handleSectionUpdate}
                        triggerButton={
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleSectionDelete(section.id)}
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
