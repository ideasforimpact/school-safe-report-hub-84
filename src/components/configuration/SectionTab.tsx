
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

interface SectionTabProps {
  sections: ConfigItem[];
  addSection: (name: string) => void;
  updateSection: (id: string, name: string) => void;
  deleteSection: (id: string) => void;
}

export const SectionTab = ({ 
  sections, 
  addSection, 
  updateSection, 
  deleteSection 
}: SectionTabProps) => {
  const [newSection, setNewSection] = useState('');
  const [editingSection, setEditingSection] = useState<{id: string, name: string} | null>(null);

  const handleSectionAdd = () => {
    if (!newSection.trim()) {
      toast.error("Section name cannot be empty");
      return;
    }
    
    addSection(newSection);
    setNewSection('');
    toast.success("Section added successfully");
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
    
    updateSection(editingSection.id, editingSection.name);
    setEditingSection(null);
    toast.success("Section updated successfully");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Section Management</CardTitle>
        <CardDescription>Add, edit, or remove sections</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="New section name (e.g., Section D)"
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
          />
          <Button onClick={handleSectionAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Section
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Section Name</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sections.map((section) => (
              <TableRow key={section.id}>
                <TableCell>{section.name}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <EditDialog
                      title="Edit Section"
                      description="Update the section name below"
                      fieldLabel="Section name"
                      value={section.name}
                      onOpenChange={(open) => {
                        if (open) {
                          setEditingSection({id: section.id, name: section.name});
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
