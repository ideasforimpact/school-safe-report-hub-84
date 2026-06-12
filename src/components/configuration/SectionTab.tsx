
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
import Loader from '../common/Loader';

interface SectionTabProps {
  sections: SectionItem[];
  classes: ClassItem[];
  addSection: (classId: string, campusId: string, name: string) => void;
  updateSection: (id: string, classId: string, campusId: string, name: string) => void;
  deleteSection: (id: string) => void;
  loading?: boolean;
  campuses: CampusItem[];
  canCreate?: boolean;
}

export const SectionTab = ({ 
  sections, 
  classes,
  campuses,
  addSection, 
  updateSection, 
  deleteSection,
  loading = false,
  canCreate = true,
}: SectionTabProps) => {
  const { employeeData } = useAuth();
  const { structure: s } = useLang();
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sectionReferences, setSectionReferences] = useState<Record<string, IncidentReferenceCheck>>({});

  // Pre-load reference info so we can disable delete button for linked sections
  useEffect(() => {
    const clientId = employeeData?.clientId || employeeData?.client_id;
    if (!clientId || sections.length === 0) {
      setSectionReferences({});
      return;
    }

    let isCancelled = false;

    const fetchReferences = async () => {
      try {
        const results = await Promise.all(
          sections.map(async (section) => {
            const refInfo = await incidentReferenceService.checkSectionReferences(section.id, clientId);
            return { id: section.id, refInfo };
          })
        );

        if (isCancelled) return;

        const map: Record<string, IncidentReferenceCheck> = {};
        results.forEach(({ id, refInfo }) => {
          map[id] = refInfo;
        });
        setSectionReferences(map);
      } catch (error) {
        console.error('Error preloading section reference info:', error);
      }
    };

    fetchReferences();

    return () => {
      isCancelled = true;
    };
  }, [sections, employeeData]);

  // Validation: allow any characters, max 15 length
  const isValidSectionName = (name: string) => {
    const nameRegex = /^.{1,15}$/;
    return nameRegex.test(name);
  };

  // Check for duplicate section names within the same class
  const isDuplicateSectionName = (name: string, classId: string, excludeId?: string) => {
    return sections.some(section => 
      section.name.toLowerCase() === name.toLowerCase() && 
      section.classId === classId &&
      section.id !== excludeId
    );
  };

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
    
    const sectionName = newSection.trim();
    
    if (!sectionName) {
      toast.error(`${s.level3} name cannot be empty`);
      return;
    }
    
    if (!isValidSectionName(sectionName)) {
      toast.error(`${s.level3} name can be up to 15 characters`);
      return;
    }
    
    if (!selectedClassId) {
      toast.error(`Please select a ${s.level2.toLowerCase()} for this ${s.level3.toLowerCase()}`);
      return;
    }

    if (!selectedCampusId) {
      toast.error(`Please select a ${s.level1.toLowerCase()} for this ${s.level3.toLowerCase()}`);
      return;
    }
    
    if (isDuplicateSectionName(sectionName, selectedClassId)) {
      toast.error(`A ${s.level3.toLowerCase()} with this name already exists in the selected ${s.level2.toLowerCase()}`);
      return;
    }
    
    addSection(selectedClassId, selectedCampusId, sectionName);
    setNewSection('');
    setSelectedClassId('');
    setSelectedCampusId('');
  };

  const handleSectionDelete = async (id: string) => {
    if (!canCreate) return;
    // Check if section is linked to students
    const clientId = employeeData?.clientId || employeeData?.client_id;
    if (clientId) {
      try {
        const refInfo = await incidentReferenceService.checkSectionReferences(id, clientId);
        if (refInfo.hasReferences) {
          toast.error(refInfo.message || `This section is linked to ${refInfo.count} student(s) and cannot be deleted.`);
          return;
        }
      } catch (error) {
        console.error('Error checking section references:', error);
        // Continue with deletion if check fails (fail open)
      }
    }

    setIsDeleting(id);
    deleteSection(id);
  };

  const handleEditOpen = (section: SectionItem) => {
    if (!canCreate) return;
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
    const sectionName = updatedName.trim();
    
    if (!sectionName) {
      toast.error(`${s.level3} name cannot be empty`);
      return;
    }
    
    if (!isValidSectionName(sectionName)) {
      toast.error(`${s.level3} name can be up to 15 characters`);
      return;
    }
    
    if (editingSection) {
      if (!editingSection.classId) {
        toast.error(`Please select a ${s.level2.toLowerCase()} for this ${s.level3.toLowerCase()}`);
        return;
      }

      if (!editingSection.campusId) {
        toast.error(`Please select a ${s.level1.toLowerCase()} for this ${s.level3.toLowerCase()}`);
        return;
      }
      
      if (isDuplicateSectionName(sectionName, editingSection.classId, editingSection.id)) {
        toast.error(`A ${s.level3.toLowerCase()} with this name already exists in the selected ${s.level2.toLowerCase()}`);
        return;
      }
      
      console.log("Updating section:", editingSection.id, editingSection.classId, editingSection.campusId, sectionName);
      updateSection(
        editingSection.id, 
        editingSection.classId, 
        editingSection.campusId, 
        sectionName
      );
      handleEditClose();
      // toast.success("Section updated successfully");
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

  // Pagination logic
  const totalPages = Math.ceil(filteredSections.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSections = filteredSections.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilter, filterCampusId, filterClassId]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
        <CardTitle>{s.level3} Management</CardTitle>
        <CardDescription>Add, edit, or remove {s.level3Plural.toLowerCase()} for each {s.level2.toLowerCase()}</CardDescription>
      </CardHeader>
      <CardContent>
        {canCreate && (
        <form onSubmit={handleSectionAdd} className="flex gap-4 mb-6 flex-col sm:flex-row">
          <div className="flex-1">
            <Label htmlFor="campus-select" className="mb-2 block">{s.level1}</Label>
            <Select value={selectedCampusId} onValueChange={setSelectedCampusId}>
              <SelectTrigger id="campus-select" className="w-full">
                <SelectValue placeholder={`Select a ${s.level1}`} />
              </SelectTrigger>
              <SelectContent>
                {campuses.length === 0 ? (
                  <SelectItem value="no-campuses" disabled>{`No ${s.level1Plural.toLowerCase()} available`}</SelectItem>
                ) : (
                  campuses.map((campus) => (
                    <SelectItem key={campus.id} value={campus.id}>{campus.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <Label htmlFor="grade-select" className="mb-2 block">{s.level2}</Label>
            <Select 
              value={selectedClassId} 
              onValueChange={setSelectedClassId}
              disabled={!selectedCampusId}
            >
              <SelectTrigger id="grade-select" className="w-full">
                <SelectValue placeholder={!selectedCampusId ? `Select a ${s.level1.toLowerCase()} first` : `Select a ${s.level2}`} />
              </SelectTrigger>
              <SelectContent>
                {filteredClasses.length === 0 ? (
                  <SelectItem value="no-grades" disabled>
                    {!selectedCampusId 
                      ? `Select a ${s.level1.toLowerCase()} first`
                      : `No ${s.level2Plural.toLowerCase()} available for this ${s.level1.toLowerCase()}`}
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
            <Label htmlFor="section-input" className="mb-2 block">{s.level3} Name</Label>
            <Input
              id="section-input"
              placeholder={`New ${s.level3.toLowerCase()} name`}
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
              maxLength={15}
              className={newSection && !isValidSectionName(newSection) ? 'border-red-500' : ''}
            />
            {newSection && !isValidSectionName(newSection) && (
              <p className="text-xs text-red-500 mt-1">{s.level3} name can be up to 15 characters</p>
            )}
            {newSection && selectedClassId && isDuplicateSectionName(newSection, selectedClassId) && (
              <p className="text-xs text-red-500 mt-1">A {s.level3.toLowerCase()} with this name already exists in the selected {s.level2.toLowerCase()}</p>
            )}
          </div>
          
          <div className="self-end">
            <Button 
              type="submit" 
              className="whitespace-nowrap w-full" 
              disabled={loading || !newSection.trim() || !isValidSectionName(newSection) || !selectedCampusId || !selectedClassId || isDuplicateSectionName(newSection, selectedClassId)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Add {s.level3}
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
              placeholder={`Search ${s.level3Plural.toLowerCase()}...`}
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
                <SelectValue placeholder={`Filter by ${s.level1.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{`All ${s.level1Plural.toLowerCase()}`}</SelectItem>
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
                <SelectValue placeholder={`Filter by ${s.level2.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{`All ${s.level2Plural.toLowerCase()}`}</SelectItem>
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
            Showing {filteredSections.length} of {sections.length} {s.level3Plural.toLowerCase()}
          </div>
        )}
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{s.level3} Name</TableHead>
              <TableHead>{s.level2}</TableHead>
              <TableHead>{s.level1}</TableHead>
              {canCreate && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={canCreate ? 4 : 3} className="text-center py-4">                  
                  <Loader text={`Loading ${s.level3Plural.toLowerCase()}...`} />                  
                </TableCell>
              </TableRow>
            ) : filteredSections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canCreate ? 4 : 3} className="text-center py-4 text-muted-foreground">
                  {sections.length === 0 
                    ? `No ${s.level3Plural.toLowerCase()} available. Add your first ${s.level3.toLowerCase()} above.`
                    : `No ${s.level3Plural.toLowerCase()} match your search criteria.`
                  }
                </TableCell>
              </TableRow>
            ) : (
              paginatedSections.map((section) => (
                <TableRow key={section.id}>
                  <TableCell>{section.name}</TableCell>
                  <TableCell>{getClassName(section.classId)}</TableCell>
                  <TableCell>{section.campusId ? getCampusName(section.campusId) : 'Not assigned'}</TableCell>
                  {canCreate && (
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
                      
                      {(() => {
                        const refInfo = sectionReferences[section.id];
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
                            onClick={() => handleSectionDelete(section.id)}
                            disabled={loading || isDeleting === section.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {loading && isDeleting === section.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
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
        {filteredSections.length > itemsPerPage && (
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
        {editingSection && canCreate && (
          <EditDialog
            title={`Edit ${s.level3}`}
            description={`Update the ${s.level3.toLowerCase()} details below`}
            fieldLabel={`${s.level3} name`}
            value={editingSection.name}
            open={isEditDialogOpen && canCreate}
            onOpenChange={setIsEditDialogOpen}
            onChange={(value) => {
              setEditingSection(prev => prev ? { ...prev, name: value } : null);
            }}
            onSave={handleEditSave}
            onClose={handleEditClose}
            maxLength={15}
            validationFunction={isValidSectionName}
            validationMessage={`${s.level3} name can be up to 15 characters`}
            isRequired={true}
            extraFields={[
              {
                type: "select",
                label: s.level1,
                options: campuses.map(campus => ({ value: campus.id, label: campus.name })),
                value: editingSection.campusId,
                onChange: handleCampusChange
              },
              {
                type: "select",
                label: s.level2,
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
