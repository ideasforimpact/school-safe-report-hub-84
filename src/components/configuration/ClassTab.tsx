
import React, { useState, useMemo } from 'react';
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [filterCampusId, setFilterCampusId] = useState<string>('');

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

  const handleEditOpen = (cls: ClassItem) => {
    console.log("Opening edit dialog for class:", cls);
    setEditingClass({
      id: cls.id,
      name: cls.name,
      campusId: cls.campusId
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSave = (updatedName: string) => {
    if (!updatedName.trim()) {
      toast.error("Grade name cannot be empty");
      return;
    }
    
    if (editingClass) {
      if (!editingClass.campusId) {
        toast.error("Please select a campus for this grade");
        return;
      }
      
      console.log("Updating class:", editingClass.id, editingClass.campusId, updatedName.trim());
      updateClass(editingClass.id, editingClass.campusId, updatedName.trim());
      handleEditClose();
      toast.success("Grade updated successfully");
    }
  };

  const handleEditClose = () => {
    console.log("Closing edit dialog");
    setIsEditDialogOpen(false);
    setEditingClass(null);
  };

  const handleCampusChange = (campusId: string) => {
    if (editingClass) {
      setEditingClass(prev => prev ? { ...prev, campusId } : null);
    }
  };

  const getCampusName = (campusId: string) => {
    const campus = campuses.find(c => c.id === campusId);
    return campus ? campus.name : 'Unknown Campus';
  };

  // Filter classes based on search term and campus
  const filteredClasses = useMemo(() => {
    let filtered = classes;
    
    if (searchFilter.trim()) {
      filtered = filtered.filter(cls => 
        cls.name.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }
    
    if (filterCampusId) {
      filtered = filtered.filter(cls => cls.campusId === filterCampusId);
    }
    
    return filtered;
  }, [classes, searchFilter, filterCampusId]);

  const clearFilters = () => {
    setSearchFilter('');
    setFilterCampusId('');
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

        {/* Filter Section */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search grades..."
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
            <Select value={filterCampusId} onValueChange={setFilterCampusId}>
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
          {(searchFilter || filterCampusId) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Results Info */}
        {(searchFilter || filterCampusId) && (
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredClasses.length} of {classes.length} grades
          </div>
        )}
        
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
            ) : filteredClasses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                  {classes.length === 0 
                    ? "No grades available. Add your first grade above."
                    : "No grades match your search criteria."
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredClasses.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell>{cls.name}</TableCell>
                  <TableCell>{getCampusName(cls.campusId)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditOpen(cls)}
                        disabled={loading}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
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

        {/* Edit Dialog */}
        {editingClass && (
          <EditDialog
            title="Edit Grade"
            description="Update the grade details below"
            fieldLabel="Grade name"
            value={editingClass.name}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onChange={(value) => {
              setEditingClass(prev => prev ? { ...prev, name: value } : null);
            }}
            onSave={handleEditSave}
            onClose={handleEditClose}
            extraFields={[
              {
                type: "select",
                label: "Campus",
                options: campuses.map(campus => ({ value: campus.id, label: campus.name })),
                value: editingClass.campusId,
                onChange: handleCampusChange
              }
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
};
