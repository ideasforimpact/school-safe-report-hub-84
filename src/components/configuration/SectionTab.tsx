
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
import { Label } from '@/components/ui/label';

interface SectionTabProps {
  sections: SectionItem[];
  classes: ClassItem[];
  addSection: (classId: string, name: string) => void;
  updateSection: (id: string, classId: string, name: string) => void;
  deleteSection: (id: string) => void;
  loading?: boolean;
}

export const SectionTab = ({ 
  sections, 
  classes,
  addSection, 
  updateSection, 
  deleteSection,
  loading = false
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
      toast.error("Please select a grade for this section");
      return;
    }
    
    addSection(selectedClassId, newSection.trim());
    setNewSection('');
    setSelectedClassId('');
  };

  const handleSectionDelete = (id: string) => {
    deleteSection(id);
  };

  const handleSectionUpdate = () => {
    if (!editingSection || !editingSection.name.trim()) {
      toast.error("Section name cannot be empty");
      return;
    }
    
    if (!editingSection.classId) {
      toast.error("Please select a grade for this section");
      return;
    }
    
    updateSection(editingSection.id, editingSection.classId, editingSection.name.trim());
    setEditingSection(null);
  };

  const getClassName = (classId: string) => {
    const foundClass = classes.find(cls => cls.id === classId);
    return foundClass ? foundClass.name : 'Unknown Grade';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Section Management</CardTitle>
        <CardDescription>Add, edit, or remove sections for each grade</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSectionAdd} className="flex gap-4 mb-6 flex-col sm:flex-row">
          <div className="flex-1">
            <Label htmlFor="grade-select" className="mb-2 block">Grade</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger id="grade-select" className="w-full">
                <SelectValue placeholder="Select a Grade" />
              </SelectTrigger>
              <SelectContent>
                {classes.length === 0 ? (
                  <SelectItem value="no-grades" disabled>No grades available</SelectItem>
                ) : (
                  classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="section-input" className="mb-2 block">Section Name</Label>
            <Input
              id="section-input"
              placeholder="New section name (e.g., Section A)"
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
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
                  <Plus className="mr-2 h-4 w-4" /> Add Section
                </>
              )}
            </Button>
          </div>
        </form>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Section Name</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading sections...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : sections.length === 0 ? (
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
                          label: "Grade",
                          options: classes.map(cls => ({ value: cls.id, label: cls.name })),
                          value: editingSection?.classId || section.classId || "",
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
                          <Button variant="ghost" size="icon" disabled={loading}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleSectionDelete(section.id)}
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
