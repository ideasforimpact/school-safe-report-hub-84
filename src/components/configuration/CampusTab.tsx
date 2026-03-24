
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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2, Search, X } from 'lucide-react';
import { CampusItem } from '@/contexts/types';
import { EditDialog } from './EditDialog';
import { toast } from 'sonner';
import { incidentReferenceService, IncidentReferenceCheck } from '@/services/incident/incidentReferenceService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth/useAuth';
import Loader from '../common/Loader';

interface CampusTabProps {
  campuses: CampusItem[];
  addCampus: (name: string) => void;
  updateCampus: (id: string, name: string) => void;
  deleteCampus: (id: string) => void;
  classes: Array<{ id: string, name: string, campusId: string }>;
  loading?: boolean;
}

export const CampusTab = ({ 
  campuses, 
  addCampus, 
  updateCampus, 
  deleteCampus,
  classes,
  loading = false
}: CampusTabProps) => {
  const { employeeData } = useAuth();
  const [newCampus, setNewCampus] = useState('');
  const [editingCampus, setEditingCampus] = useState<CampusItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campusToDelete, setCampusToDelete] = useState<{id: string, name: string} | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [campusError, setCampusError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [campusReferences, setCampusReferences] = useState<Record<string, IncidentReferenceCheck>>({});

  // Pre-load reference info so we can disable delete button for linked campuses
  useEffect(() => {
    const clientId = employeeData?.clientId || employeeData?.client_id;
    if (!clientId || campuses.length === 0) {
      setCampusReferences({});
      return;
    }

    let isCancelled = false;

    const fetchReferences = async () => {
      try {
        const results = await Promise.all(
          campuses.map(async (campus) => {
            const refInfo = await incidentReferenceService.checkLocationReferences(campus.id, clientId);
            return { id: campus.id, refInfo };
          })
        );

        if (isCancelled) return;

        const map: Record<string, IncidentReferenceCheck> = {};
        results.forEach(({ id, refInfo }) => {
          map[id] = refInfo;
        });
        setCampusReferences(map);
      } catch (error) {
        console.error('Error preloading campus reference info:', error);
      }
    };

    fetchReferences();

    return () => {
      isCancelled = true;
    };
  }, [campuses, employeeData]);

  // Validation: allow any characters, max 50 length
  const isValidCampusName = (name: string) => {
    const nameRegex = /^.{1,50}$/;
    return nameRegex.test(name);
  };

  // Check for duplicate campus names
  const isDuplicateCampusName = (name: string, excludeId?: string) => {
    return campuses.some(campus => 
      campus.name.toLowerCase() === name.toLowerCase() && 
      campus.id !== excludeId
    );
  };

  const handleCampusAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    const campusName = newCampus.trim();
    
    if (!campusName) {
      toast.error("Campus name cannot be empty");
      return;
    }
    
    if (!isValidCampusName(campusName)) {
      toast.error("Campus name can be up to 50 characters");
      return;
    }
    
    if (isDuplicateCampusName(campusName)) {
      toast.error("A campus with this name already exists");
      return;
    }
    
    console.log("Adding campus:", campusName);
    addCampus(campusName);
    setNewCampus('');
  };

  const handleDeleteClick = (campus: CampusItem) => {
    setCampusToDelete({
      id: campus.id,
      name: campus.name
    });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (campusToDelete) {
      try {
        await deleteCampus(campusToDelete.id);
        setDeleteDialogOpen(false);
        setCampusToDelete(null);
      } catch (error: any) {
        // Error handling is done in the hook, just close the dialog
        setDeleteDialogOpen(false);
        setCampusToDelete(null);
      }
    }
  };

  const handleEditOpen = (campus: CampusItem) => {
    console.log("Opening edit dialog for campus:", campus);
    setEditingCampus(campus);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = (updatedName: string) => {
    const campusName = updatedName.trim();
    
    if (!campusName) {
      toast.error("Campus name cannot be empty");
      return;
    }
    
    if (!isValidCampusName(campusName)) {
      toast.error("Campus name can be up to 50 characters");
      return;
    }
    
    if (isDuplicateCampusName(campusName, editingCampus?.id)) {
      toast.error("A campus with this name already exists");
      return;
    }
    
    if (editingCampus) {
      console.log("Updating campus:", editingCampus.id, "with name:", campusName);
      updateCampus(editingCampus.id, campusName);
      handleEditClose();
    }
  };

  const handleEditClose = () => {
    console.log("Closing edit dialog");
    setIsEditDialogOpen(false);
    setEditingCampus(null);
  };

  // Filter campuses based on search term
  const filteredCampuses = useMemo(() => {
    if (!searchFilter.trim()) return campuses;
    return campuses.filter(campus => 
      campus.name.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }, [campuses, searchFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCampuses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCampuses = filteredCampuses.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilter = () => setSearchFilter('');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campus Management</CardTitle>
        <CardDescription>Add, edit, or remove campuses</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCampusAdd} className="mb-6">
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="flex-1">
              <Input
                placeholder="New campus name (e.g., Main Campus)"
                value={newCampus}
                onChange={(e) => setNewCampus(e.target.value)}
                maxLength={50}
                className={newCampus && !isValidCampusName(newCampus) ? 'border-red-500' : ''}
              />
              {newCampus && !isValidCampusName(newCampus) && (
                <p className="text-xs text-red-500 mt-1">Campus name can be up to 50 characters</p>
              )}
              {newCampus && isDuplicateCampusName(newCampus) && (
                <p className="text-xs text-red-500 mt-1">A campus with this name already exists</p>
              )}
            </div>
            <Button 
              type="submit" 
              className="whitespace-nowrap" 
              disabled={loading || !newCampus.trim() || !isValidCampusName(newCampus) || isDuplicateCampusName(newCampus)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                </> 
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Add Campus
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
              placeholder="Search campuses..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={clearFilter}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results Info */}
        {searchFilter && (
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredCampuses.length} of {campuses.length} campuses
          </div>
        )}
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campus Name</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-4">
                  <Loader text="Loading campuses..." />
                </TableCell>
              </TableRow>
            ) : filteredCampuses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                  {campuses.length === 0 
                    ? "No campuses available. Add your first campus above."
                    : "No campuses match your search criteria."
                  }
                </TableCell>
              </TableRow>
            ) : (
              paginatedCampuses.map((campus) => (
                <TableRow key={campus.id}>
                  <TableCell>{campus.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditOpen(campus)}
                        disabled={loading}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      {(() => {
                        const refInfo = campusReferences[campus.id];
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
                        onClick={() => handleDeleteClick(campus)}
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
        {filteredCampuses.length > itemsPerPage && (
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Campus</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the campus "{campusToDelete?.name}"? 
                This action cannot be undone. If this campus is linked to any incidents, 
                classes, or facilities, deletion will be prevented.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setDeleteDialogOpen(false);
                setCampusToDelete(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Dialog */}
        {editingCampus && (
          <EditDialog
            title="Edit Campus"
            description="Update the campus name below"
            fieldLabel="Campus name"
            value={editingCampus.name}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onChange={() => {}} // Not needed for this pattern
            onSave={handleEditSave}
            onClose={handleEditClose}
            maxLength={20}
            validationFunction={isValidCampusName}
            validationMessage="Campus name can only contain letters, numbers, and spaces (max 20 characters)"
            isRequired={true}
          />
        )}
      </CardContent>
    </Card>
  );
};
