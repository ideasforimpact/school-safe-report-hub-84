
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
import { useLang } from '@/hooks/useLang';
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
  canCreate?: boolean;
}

export const ClassTab = ({ 
  classes, 
  campuses,
  addClass, 
  updateClass, 
  deleteClass,
  sections,
  loading = false,
  canCreate = true,
}: ClassTabProps) => {
  const { employeeData } = useAuth();
  const { structure: s } = useLang();
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

  // Validation: allow any characters, max 10 length
  const isValidGradeName = (name: string) => {
    const nameRegex = /^.{1,10}$/;
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
      toast.error(`${s.level2} name cannot be empty`);
      return;
    }
    
    if (!isValidGradeName(gradeName)) {
      toast.error(`${s.level2} name can be up to 10 characters`);
      return;
    }
    
    if (!selectedCampusId) {
      toast.error(`Please select a ${s.level1.toLowerCase()} for this ${s.level2.toLowerCase()}`);
      return;
    }
    
    if (isDuplicateGradeName(gradeName, selectedCampusId)) {
      toast.error(`A ${s.level2.toLowerCase()} with this name already exists in the selected ${s.level1.toLowerCase()}`);
      return;
    }
    
    addClass(selectedCampusId, gradeName);
    setNewClass('');
    // toast.success("Grade added successfully");
  };

  const handleClassDelete = async (id: string) => {
    if (!canCreate) return;
    const hasSections = sections.some(section => section.classId === id);
    
    if (hasSections) {
      toast.error(`Cannot delete ${s.level2.toLowerCase()} with associated ${s.level3Plural.toLowerCase()}. Remove the ${s.level3Plural.toLowerCase()} first.`);
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
    // toast.success("Grade deleted successfully");
  };

  const handleEditOpen = (cls: ClassItem) => {
    if (!canCreate) return;
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
      toast.error(`${s.level2} name cannot be empty`);
      return;
    }
    
    if (!isValidGradeName(gradeName)) {
      toast.error(`${s.level2} name can be up to 10 characters`);
      return;
    }
    
    if (editingClass) {
      if (!editingClass.campusId) {
        toast.error(`Please select a ${s.level1.toLowerCase()} for this ${s.level2.toLowerCase()}`);
        return;
      }
      
      if (isDuplicateGradeName(gradeName, editingClass.campusId, editingClass.id)) {
        toast.error(`A ${s.level2.toLowerCase()} with this name already exists in the selected ${s.level1.toLowerCase()}`);
        return;
      }
      
      console.log("Updating class:", editingClass.id, editingClass.campusId, gradeName);
      updateClass(editingClass.id, editingClass.campusId, gradeName);
      handleEditClose();
      // toast.success("Grade updated successfully");
    }
  };

  const handleEditClose = () => {
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
        <CardTitle>{s.level2} Management</CardTitle>
        <CardDescription>Add, edit, or remove {s.level2Plural.toLowerCase()} for each {s.level1.toLowerCase()}</CardDescription>
      </CardHeader>
      <CardContent>
        {canCreate && (
        <form onSubmit={handleClassAdd} className="flex gap-4 mb-6 flex-col sm:flex-row">
          <div className="flex-1">
            <Label htmlFor="campus-select" className="mb-2 block">{s.level1}</Label>
            <Select value={selectedCampusId} onValueChange={setSelectedCampusId}>
              <SelectTrigger id="campus-select" className="w-full">
                <SelectValue placeholder={`Select a ${s.level1}`} />
              </SelectTrigger>
              <SelectContent>
                {campuses.length === 0 ? (
                  <SelectItem value="no-campuses" disabled>No {s.level1Plural.toLowerCase()} available</SelectItem>
                ) : (
                  campuses.map((campus) => (
                    <SelectItem key={campus.id} value={campus.id}>{campus.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="grade-input" className="mb-2 block">{s.level2} Name</Label>
            <Input
              id="grade-input"
              placeholder={`New ${s.level2.toLowerCase()} name`}
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
              maxLength={10}
              className={newClass && !isValidGradeName(newClass) ? 'border-red-500' : ''}
            />
            {newClass && !isValidGradeName(newClass) && (
              <p className="text-xs text-red-500 mt-1">{s.level2} name can be up to 10 characters</p>
            )}
            {newClass && selectedCampusId && isDuplicateGradeName(newClass, selectedCampusId) && (
              <p className="text-xs text-red-500 mt-1">A {s.level2.toLowerCase()} with this name already exists in the selected {s.level1.toLowerCase()}</p>
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
                  <Plus className="mr-2 h-4 w-4" /> Add {s.level2}
                </>
              )}
            </Button>
          </div>
        </form>
        )}

        {/* Filter Section */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${s.level2Plural.toLowerCase()}...`}
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
                <SelectValue placeholder={`Filter by ${s.level1.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All {s.level1Plural.toLowerCase()}</SelectItem>
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
            Showing {filteredClasses.length} of {classes.length} {s.level2Plural.toLowerCase()}
          </div>
        )}
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{s.level2} Name</TableHead>
              <TableHead>{s.level1}</TableHead>
              {canCreate && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={canCreate ? 3 : 2} className="text-center py-4">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading {s.level2Plural.toLowerCase()}...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredClasses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canCreate ? 3 : 2} className="text-center py-4 text-muted-foreground">
                  {classes.length === 0
                    ? `No ${s.level2Plural.toLowerCase()} available. Add your first ${s.level2.toLowerCase()} above.`
                    : `No ${s.level2Plural.toLowerCase()} match your search criteria.`
                  }
                </TableCell>
              </TableRow>
            ) : (
              paginatedClasses.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell>{cls.name}</TableCell>
                  <TableCell>{getCampusName(cls.campusId)}</TableCell>
                  {canCreate && (
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
                  )}
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
        {editingClass && canCreate && (
          <EditDialog
            title={`Edit ${s.level2}`}
            description={`Update the ${s.level2.toLowerCase()} details below`}
            fieldLabel={`${s.level2} name`}
            value={editingClass.name}
            open={isEditDialogOpen && canCreate}
            onOpenChange={setIsEditDialogOpen}
            onChange={(value) => {
              setEditingClass(prev => prev ? { ...prev, name: value } : null);
            }}
            onSave={handleEditSave}
            onClose={handleEditClose}
            maxLength={10}
            validationFunction={isValidGradeName}
            validationMessage={`${s.level2} name can be up to 10 characters`}
            isRequired={true}
            extraFields={[
              {
                type: "select",
                label: s.level1,
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
