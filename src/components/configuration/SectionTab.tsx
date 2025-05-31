
import React, { useState, useEffect } from 'react';
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
import { SectionItem, ClassItem, CampusItem } from '@/contexts/types';
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
  addSection: (classId: string, campusId: string, name: string) => void;
  updateSection: (id: string, classId: string, campusId: string, name: string) => void;
  deleteSection: (id: string) => void;
  loading?: boolean;
  campuses: CampusItem[];
}

export const SectionTab = ({ 
  sections, 
  classes,
  campuses,
  addSection, 
  updateSection, 
  deleteSection,
  loading = false
}: SectionTabProps) => {
  const [newSection, setNewSection] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [editingSection, setEditingSection] = useState<{id: string, name: string, classId: string, campusId: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [filteredClasses, setFilteredClasses] = useState<ClassItem[]>([]);

  // Filter classes by selected campus
  useEffect(() => {
    if (selectedCampusId) {
      setFilteredClasses(classes.filter(cls => cls.campusId === selectedCampusId));
      // Reset class selection if current selection is not in filtered list
      if (selectedClassId && !classes.some(cls => cls.id === selectedClassId && cls.campusId === selectedCampusId)) {
        setSelectedClassId('');
      }
    } else {
      setFilteredClasses(classes);
    }
  }, [selectedCampusId, classes, selectedClassId]);

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

    if (!selectedCampusId) {
      toast.error("Please select a campus for this section");
      return;
    }
    
    addSection(selectedClassId, selectedCampusId, newSection.trim());
    setNewSection('');
    setSelectedClassId('');
    setSelectedCampusId('');
  };

  const handleSectionDelete = (id: string) => {
    setIsDeleting(id);
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

    if (!editingSection.campusId) {
      toast.error("Please select a campus for this section");
      return;
    }
    
    //console.log("Updating section:", editingSection);
    updateSection(
      editingSection.id, 
      editingSection.classId, 
      editingSection.campusId, 
      editingSection.name.trim()
    );
    setEditingSection(null);
  };

  const getClassName = (classId: string) => {
    const foundClass = classes.find(cls => cls.id === classId);
    return foundClass ? foundClass.name : 'Unknown Grade';
  };

  const getCampusName = (campusId: string) => {
    const foundCampus = campuses.find(campus => campus.id === campusId);
    return foundCampus ? foundCampus.name : 'Unknown Campus';
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
            <Label htmlFor="grade-select" className="mb-2 block">Grade</Label>
            <Select 
              value={selectedClassId} 
              onValueChange={setSelectedClassId}
              disabled={!selectedCampusId}
            >
              <SelectTrigger id="grade-select" className="w-full">
                <SelectValue placeholder={!selectedCampusId ? "Select a campus first" : "Select a Grade"} />
              </SelectTrigger>
              <SelectContent>
                {filteredClasses.length === 0 ? (
                  <SelectItem value="no-grades" disabled>
                    {!selectedCampusId 
                      ? "Select a campus first" 
                      : "No grades available for this campus"}
                  </SelectItem>
                ) : (
                  filteredClasses.map((cls) => (
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
            <Button 
              type="submit" 
              className="whitespace-nowrap w-full" 
              disabled={loading || !selectedCampusId || !selectedClassId}
            >
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
              <TableHead>Campus</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading sections...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : sections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  No sections available. Add your first section above.
                </TableCell>
              </TableRow>
            ) : (
              sections.map((section) => (
                <TableRow key={section.id}>
                  <TableCell>{section.name}</TableCell>
                  <TableCell>{getClassName(section.classId)}</TableCell>
                  <TableCell>{section.campusId ? getCampusName(section.campusId) : 'Not assigned'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <EditDialog
                        title="Edit Section"
                        description="Update the section details below"
                        fieldLabel="Section name"
                        value={editingSection?.id === section.id ? editingSection.name : section.name}
                        extraFields={[
                          {
                            type: "select",
                            label: "Campus",
                            options: campuses.map(campus => ({ value: campus.id, label: campus.name })),
                            value: editingSection?.id === section.id ? editingSection.campusId : section.campusId || '',
                            onChange: (value) => {
                              const newCampusId = value;
                              setEditingSection(prev => {
                                if (!prev || prev.id !== section.id) {
                                  return { 
                                    id: section.id, 
                                    name: section.name, 
                                    campusId: newCampusId,
                                    classId: section.classId 
                                  };
                                }
                                
                                const classStillValid = classes.some(
                                  cls => cls.id === prev.classId && cls.campusId === newCampusId
                                );
                                
                                return {
                                  ...prev,
                                  campusId: newCampusId,
                                  classId: classStillValid ? prev.classId : ''
                                };
                              });
                            }
                          },
                          {
                            type: "select",
                            label: "Grade",
                            options: editingSection?.campusId 
                              ? classes
                                  .filter(cls => cls.campusId === (
                                    editingSection.id === section.id 
                                      ? editingSection.campusId 
                                      : section.campusId
                                  ))
                                  .map(cls => ({ value: cls.id, label: cls.name }))
                              : [],
                            value: editingSection?.id === section.id ? editingSection.classId : section.classId,
                            disabled: !editingSection?.campusId,
                            onChange: (value) => {
                              setEditingSection(prev => 
                                prev && prev.id === section.id ? {...prev, classId: value} : 
                                { 
                                  id: section.id, 
                                  name: section.name, 
                                  classId: value,
                                  campusId: section.campusId || '' 
                                }
                              );
                            }
                          }
                        ]}
                        onOpenChange={(open) => {
                          if (open) {
                            setEditingSection({
                              id: section.id, 
                              name: section.name, 
                              classId: section.classId,
                              campusId: section.campusId || ''
                            });
                          }
                        }}
                        onChange={(value) => {
                          setEditingSection(prev => 
                            prev && prev.id === section.id ? {...prev, name: value} : prev
                          );
                        }}
                        onSave={handleSectionUpdate}
                        triggerButton={
                          <Button variant="ghost" size="icon" disabled={loading}>
                            {loading && editingSection?.id === section.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Pencil className="h-4 w-4" />
                            )}
                          </Button>
                        }
                      />
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleSectionDelete(section.id)}
                        disabled={loading || isDeleting === section.id}
                      >
                        {loading && isDeleting === section.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
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
