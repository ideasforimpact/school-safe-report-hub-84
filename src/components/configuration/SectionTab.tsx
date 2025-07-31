
import React, { useState, useEffect, useMemo } from 'react';
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
import { Plus, Pencil, Trash2, Loader2, Search, X } from 'lucide-react';
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [filteredClasses, setFilteredClasses] = useState<ClassItem[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [filterCampusId, setFilterCampusId] = useState<string>('');
  const [filterClassId, setFilterClassId] = useState<string>('');

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

  const handleEditOpen = (section: SectionItem) => {
    console.log("Opening edit dialog for section:", section);
    setEditingSection({
      id: section.id,
      name: section.name,
      classId: section.classId,
      campusId: section.campusId || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSave = (updatedName: string) => {
    if (!updatedName.trim()) {
      toast.error("Section name cannot be empty");
      return;
    }
    
    if (editingSection) {
      if (!editingSection.classId) {
        toast.error("Please select a grade for this section");
        return;
      }

      if (!editingSection.campusId) {
        toast.error("Please select a campus for this section");
        return;
      }
      
      console.log("Updating section:", editingSection.id, editingSection.classId, editingSection.campusId, updatedName.trim());
      updateSection(
        editingSection.id, 
        editingSection.classId, 
        editingSection.campusId, 
        updatedName.trim()
      );
      handleEditClose();
      toast.success("Section updated successfully");
    }
  };

  const handleEditClose = () => {
    console.log("Closing edit dialog");
    setIsEditDialogOpen(false);
    setEditingSection(null);
  };

  const handleCampusChange = (campusId: string) => {
    if (editingSection) {
      const classStillValid = classes.some(
        cls => cls.id === editingSection.classId && cls.campusId === campusId
      );
      
      setEditingSection(prev => prev ? {
        ...prev,
        campusId,
        classId: classStillValid ? prev.classId : ''
      } : null);
    }
  };

  const handleClassChange = (classId: string) => {
    if (editingSection) {
      setEditingSection(prev => prev ? { ...prev, classId } : null);
    }
  };

  const getClassName = (classId: string) => {
    const foundClass = classes.find(cls => cls.id === classId);
    return foundClass ? foundClass.name : 'Unknown Grade';
  };

  const getCampusName = (campusId: string) => {
    const foundCampus = campuses.find(campus => campus.id === campusId);
    return foundCampus ? foundCampus.name : 'Unknown Campus';
  };

  // Filter sections based on search term, campus, and class
  const filteredSections = useMemo(() => {
    let filtered = sections;
    
    if (searchFilter.trim()) {
      filtered = filtered.filter(section => 
        section.name.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }
    
    if (filterCampusId) {
      filtered = filtered.filter(section => section.campusId === filterCampusId);
    }
    
    if (filterClassId) {
      filtered = filtered.filter(section => section.classId === filterClassId);
    }
    
    return filtered;
  }, [sections, searchFilter, filterCampusId, filterClassId]);

  // Get classes filtered by selected campus for the class filter dropdown
  const availableClassesForFilter = useMemo(() => {
    if (filterCampusId) {
      return classes.filter(cls => cls.campusId === filterCampusId);
    }
    return classes;
  }, [classes, filterCampusId]);

  const clearFilters = () => {
    setSearchFilter('');
    setFilterCampusId('');
    setFilterClassId('');
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

        {/* Filter Section */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sections..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="w-48">
            <Select value={filterCampusId} onValueChange={(value) => {
              setFilterCampusId(value);
              // Reset class filter if campus changes
              if (filterClassId && !availableClassesForFilter.some(cls => cls.id === filterClassId)) {
                setFilterClassId('');
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by campus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All campuses</SelectItem>
                {campuses.map((campus) => (
                  <SelectItem key={campus.id} value={campus.id}>
                    {campus.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <Select 
              value={filterClassId} 
              onValueChange={setFilterClassId}
              disabled={!filterCampusId && availableClassesForFilter.length > 10}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All grades</SelectItem>
                {availableClassesForFilter.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(searchFilter || filterCampusId || filterClassId) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Results Info */}
        {(searchFilter || filterCampusId || filterClassId) && (
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredSections.length} of {sections.length} sections
          </div>
        )}
        
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
            ) : filteredSections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  {sections.length === 0 
                    ? "No sections available. Add your first section above."
                    : "No sections match your search criteria."
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredSections.map((section) => (
                <TableRow key={section.id}>
                  <TableCell>{section.name}</TableCell>
                  <TableCell>{getClassName(section.classId)}</TableCell>
                  <TableCell>{section.campusId ? getCampusName(section.campusId) : 'Not assigned'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditOpen(section)}
                        disabled={loading}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
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

        {/* Edit Dialog */}
        {editingSection && (
          <EditDialog
            title="Edit Section"
            description="Update the section details below"
            fieldLabel="Section name"
            value={editingSection.name}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onChange={(value) => {
              setEditingSection(prev => prev ? { ...prev, name: value } : null);
            }}
            onSave={handleEditSave}
            onClose={handleEditClose}
            extraFields={[
              {
                type: "select",
                label: "Campus",
                options: campuses.map(campus => ({ value: campus.id, label: campus.name })),
                value: editingSection.campusId,
                onChange: handleCampusChange
              },
              {
                type: "select",
                label: "Grade",
                options: editingSection.campusId 
                  ? classes
                      .filter(cls => cls.campusId === editingSection.campusId)
                      .map(cls => ({ value: cls.id, label: cls.name }))
                  : [],
                value: editingSection.classId,
                disabled: !editingSection.campusId,
                onChange: handleClassChange
              }
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
};
