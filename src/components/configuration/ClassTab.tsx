
import React, { useState, useMemo, useEffect } from 'react';
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
import { incidentReferenceService, IncidentReferenceCheck } from '@/services/incident/incidentReferenceService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth/useAuth';
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
  const { employeeData } = useAuth();
  const [newClass, setNewClass] = useState('');
  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [editingClass, setEditingClass] = useState<{id: string, name: string, campusId: string} | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [filterCampusId, setFilterCampusId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [gradeReferences, setGradeReferences] = useState<Record<string, IncidentReferenceCheck>>({});

  // Pre-load reference info so we can disable delete button for linked grades
  useEffect(() => {
    const clientId = employeeData?.clientId || employeeData?.client_id;
    if (!clientId || classes.length === 0) {
      setGradeReferences({});
      return;
    }

    let isCancelled = false;

    const fetchReferences = async () => {
      try {
        const results = await Promise.all(
          classes.map(async (cls) => {
            const refInfo = await incidentReferenceService.checkGradeReferences(cls.id, clientId);
            return { id: cls.id, refInfo };
          })
        );

        if (isCancelled) return;

        const map: Record<string, IncidentReferenceCheck> = {};
        results.forEach(({ id, refInfo }) => {
          map[id] = refInfo;
        });
        setGradeReferences(map);
      } catch (error) {
        console.error('Error preloading grade reference info:', error);
      }
    };

    fetchReferences();

    return () => {
      isCancelled = true;
    };
  }, [classes, employeeData]);

  // Validation: allow any characters, max 50 length
  const isValidGradeName = (name: string) => {
    const nameRegex = /^.{1,50}$/;
    return nameRegex.test(name);
  };

  // Check for duplicate grade names within the same campus
  const isDuplicateGradeName = (name: string, campusId: string, excludeId?: string) => {
    return classes.some(cls => 
      cls.name.toLowerCase() === name.toLowerCase() && 
      cls.campusId === campusId &&
      cls.id !== excludeId
    );
  };

  const handleClassAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    const gradeName = newClass.trim();
    
    if (!gradeName) {
      toast.error("Grade name cannot be empty");
      return;
    }
    
    if (!isValidGradeName(gradeName)) {
      toast.error("Grade name can be up to 50 characters");
      return;
    }
    
    if (!selectedCampusId) {
      toast.error("Please select a campus for this grade");
      return;
    }
    
    if (isDuplicateGradeName(gradeName, selectedCampusId)) {
      toast.error("A grade with this name already exists in the selected campus");
      return;
    }
    
    addClass(selectedCampusId, gradeName);
    setNewClass('');
    toast.success("Grade added successfully");
  };

  const handleClassDelete = async (id: string) => {
    const hasSections = sections.some(section => section.classId === id);
    
    if (hasSections) {
      toast.error("Cannot delete grade with associated sections. Remove the sections first.");
      return;
    }

    // Check if grade is linked to students
    const clientId = employeeData?.clientId || employeeData?.client_id;
    if (clientId) {
      try {
        const refInfo = await incidentReferenceService.checkGradeReferences(id, clientId);
        if (refInfo.hasReferences) {
          toast.error(refInfo.message || `This grade is linked to ${refInfo.count} student(s) and cannot be deleted.`);
          return;
        }
      } catch (error) {
        console.error('Error checking grade references:', error);
        // Continue with deletion if check fails (fail open)
      }
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
    const gradeName = updatedName.trim();
    
    if (!gradeName) {
      toast.error("Grade name cannot be empty");
      return;
    }
    
    if (!isValidGradeName(gradeName)) {
      toast.error("Grade name can only contain letters, numbers, and spaces (max 20 characters)");
      return;
    }
    
    if (editingClass) {
      if (!editingClass.campusId) {
        toast.error("Please select a campus for this grade");
        return;
      }
      
      if (isDuplicateGradeName(gradeName, editingClass.campusId, editingClass.id)) {
        toast.error("A grade with this name already exists in the selected campus");
        return;
      }
      
      console.log("Updating class:", editingClass.id, editingClass.campusId, gradeName);
      updateClass(editingClass.id, editingClass.campusId, gradeName);
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

  // Pagination logic
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClasses = filteredClasses.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilter, filterCampusId]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
              maxLength={50}
              className={newClass && !isValidGradeName(newClass) ? 'border-red-500' : ''}
            />
            {newClass && !isValidGradeName(newClass) && (
              <p className="text-xs text-red-500 mt-1">Grade name can be up to 50 characters</p>
            )}
            {newClass && selectedCampusId && isDuplicateGradeName(newClass, selectedCampusId) && (
              <p className="text-xs text-red-500 mt-1">A grade with this name already exists in the selected campus</p>
            )}
          </div>
          <div className="self-end">
            <Button 
              type="submit" 
              className="whitespace-nowrap w-full" 
              disabled={loading || !newClass.trim() || !isValidGradeName(newClass) || !selectedCampusId || isDuplicateGradeName(newClass, selectedCampusId)}
            >
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
              paginatedClasses.map((cls) => (
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
                      
                      {(() => {
                        const refInfo = gradeReferences[cls.id];
                        const isLinked = refInfo?.hasReferences || false;
                        const message = refInfo?.message || '';

                        if (isLinked) {
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex">
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      disabled={true}
                                      aria-disabled="true"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                      className="text-red-400 hover:text-red-400 hover:bg-transparent cursor-not-allowed opacity-60"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent 
                                  side="left" 
                                  align="center" 
                                  sideOffset={8} 
                                  className="max-w-xs whitespace-normal text-left"
                                >
                                  <p className="text-xs leading-snug text-left">
                                    {message}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        }

                        return (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleClassDelete(cls.id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        );
                      })()}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {filteredClasses.length > itemsPerPage && (
          <div className="flex items-center justify-center space-x-2 mt-4">
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                «
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ‹
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                ›
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                »
              </Button>
            </div>
          </div>
        )}

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
            maxLength={50}
            validationFunction={isValidGradeName}
            validationMessage="Grade name can be up to 50 characters"
            isRequired={true}
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
