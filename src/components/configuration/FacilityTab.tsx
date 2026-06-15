
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
import { ConfigItem, CampusItem } from '@/contexts/types';
import { useAuth } from '@/contexts/auth/useAuth';

interface FacilityItem extends ConfigItem {
  campusId: string;
}
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

interface FacilityTabProps {
  facilities: FacilityItem[];
  campuses: CampusItem[];
  addFacility: (name: string, campusId: string) => void;
  updateFacility: (id: string, name: string, campusId: string) => void;
  deleteFacility: (id: string) => void;
  loading?: boolean;
  canCreate?: boolean;
}

export const FacilityTab = ({ 
  facilities, 
  campuses,
  addFacility, 
  updateFacility, 
  deleteFacility,
  loading = false,
  canCreate = true,
}: FacilityTabProps) => {
  const { employeeData } = useAuth();
  const [newFacility, setNewFacility] = useState('');
  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [editingFacility, setEditingFacility] = useState<FacilityItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState<{id: string, name: string} | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [filterCampusId, setFilterCampusId] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Validation: allow any characters, max 50 length
  const isValidFacilityName = (name: string) => {
    const nameRegex = /^.{1,50}$/;
    return nameRegex.test(name);
  };

  // Check for duplicate facility names within the same campus
  const isDuplicateFacilityName = (name: string, campusId: string, excludeId?: string) => {
    return facilities.some(facility => 
      facility.name.toLowerCase() === name.toLowerCase() && 
      facility.campusId === campusId &&
      facility.id !== excludeId
    );
  };

  const handleFacilityAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    const facilityName = newFacility.trim();
    
    if (!facilityName) {
      toast.error("Facility name cannot be empty");
      return;
    }
    
    if (!isValidFacilityName(facilityName)) {
      toast.error("Facility name can be up to 50 characters");
      return;
    }
    
    if (!selectedCampusId) {
      toast.error("Please select a campus for this facility");
      return;
    }
    
    if (isDuplicateFacilityName(facilityName, selectedCampusId)) {
      toast.error("A facility with this name already exists in the selected campus");
      return;
    }
    
    addFacility(facilityName, selectedCampusId);
    setNewFacility('');
    setSelectedCampusId('');
    // toast.success("Facility added successfully");
  };

  const handleDeleteClick = (facility: FacilityItem) => {
    if (!canCreate) return;
    setFacilityToDelete({
      id: facility.id,
      name: facility.name
    });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (facilityToDelete) {
      try {
        await deleteFacility(facilityToDelete.id);
        setDeleteDialogOpen(false);
        setFacilityToDelete(null);
      } catch (error: any) {
        // Error handling is done in the hook, just close the dialog
        setDeleteDialogOpen(false);
        setFacilityToDelete(null);
      }
    }
  };

  const handleEditOpen = (facility: FacilityItem) => {
    if (!canCreate) return;
    console.log("Opening edit dialog for facility:", facility);
    setEditingFacility({
      id: facility.id,
      name: facility.name,
      campusId: facility.campusId || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSave = (updatedName: string) => {
    const facilityName = updatedName.trim();
    
    if (!facilityName) {
      toast.error("Facility name cannot be empty");
      return;
    }
    
    if (!isValidFacilityName(facilityName)) {
      toast.error("Facility name can be up to 50 characters");
      return;
    }
    
    if (editingFacility) {
      if (!editingFacility.campusId) {
        toast.error("Please select a campus for this facility");
        return;
      }
      
      if (isDuplicateFacilityName(facilityName, editingFacility.campusId, editingFacility.id)) {
        toast.error("A facility with this name already exists in the selected campus");
        return;
      }
      
      console.log("Updating facility:", editingFacility.id, facilityName, editingFacility.campusId);
      updateFacility(editingFacility.id, facilityName, editingFacility.campusId);
      handleEditClose();
      // toast.success("Facility updated successfully");
    }
  };

  const handleEditClose = () => {
    console.log("Closing edit dialog");
    setIsEditDialogOpen(false);
    setEditingFacility(null);
  };

  const handleCampusChange = (campusId: string) => {
    if (editingFacility) {
      setEditingFacility(prev => prev ? { ...prev, campusId } : null);
    }
  };

  const getCampusName = (campusId: string) => {
    const campus = campuses.find(c => c.id === campusId);
    return campus ? campus.name : 'Unknown Campus';
  };

  // Filter facilities based on search term and campus
  const filteredFacilities = useMemo(() => {
    let filtered = facilities;
    
    if (searchFilter.trim()) {
      filtered = filtered.filter(facility => 
        facility.name.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }
    
    if (filterCampusId) {
      filtered = filtered.filter(facility => (facility as any).campusId === filterCampusId);
    }
    
    return filtered;
  }, [facilities, searchFilter, filterCampusId]);

  // Pagination logic
  const totalPages = Math.ceil(filteredFacilities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFacilities = filteredFacilities.slice(startIndex, endIndex);

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
        <CardTitle>School Facilities</CardTitle>
        <CardDescription>Manage facilities for your institution</CardDescription>
      </CardHeader>
      <CardContent>
        {canCreate && (
        <form onSubmit={handleFacilityAdd} className="flex gap-4 mb-6 flex-col sm:flex-row">
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
            <Label htmlFor="facility-input" className="mb-2 block">Facility Name</Label>
            <Input
              id="facility-input"
              placeholder="New facility name (e.g., Laboratory)"
              value={newFacility}
              onChange={(e) => setNewFacility(e.target.value)}
              maxLength={50}
              className={newFacility && !isValidFacilityName(newFacility) ? 'border-red-500' : ''}
            />
            {newFacility && !isValidFacilityName(newFacility) && (
              <p className="text-xs text-red-500 mt-1">Facility name can only contain letters, numbers, and spaces (max 20 characters)</p>
            )}
            {newFacility && selectedCampusId && isDuplicateFacilityName(newFacility, selectedCampusId) && (
              <p className="text-xs text-red-500 mt-1">A facility with this name already exists in the selected campus</p>
            )}
          </div>
          <div className="self-end">
            <Button 
              type="submit" 
              className="whitespace-nowrap w-full" 
              disabled={loading || !newFacility.trim() || !isValidFacilityName(newFacility) || !selectedCampusId || isDuplicateFacilityName(newFacility, selectedCampusId)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Add Facility
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
              placeholder="Search facilities..."
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
            Showing {filteredFacilities.length} of {facilities.length} facilities
          </div>
        )}
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Facility Name</TableHead>
              <TableHead>Campus</TableHead>
              {canCreate && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={canCreate ? 3 : 2} className="text-center py-4">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading facilities...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredFacilities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canCreate ? 3 : 2} className="text-center py-4 text-muted-foreground">
                  {facilities.length === 0 
                    ? "No facilities available. Add your first facility above."
                    : "No facilities match your search criteria."
                  }
                </TableCell>
              </TableRow>
            ) : (
              paginatedFacilities.map((facility: FacilityItem) => (
                <TableRow key={facility.id}>
                  <TableCell>{facility.name}</TableCell>
                  <TableCell>
                    {getCampusName(facility.campusId)}
                  </TableCell>
                  {canCreate && (
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditOpen(facility)}
                        disabled={loading}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(facility)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {filteredFacilities.length > itemsPerPage && (
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
        <AlertDialog open={deleteDialogOpen && canCreate} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Facility</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the facility "{facilityToDelete?.name}"? 
                This action cannot be undone. If this facility is linked to any incidents, 
                deletion will be prevented.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setDeleteDialogOpen(false);
                setFacilityToDelete(null);
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
        {editingFacility && canCreate && (
          <EditDialog
            title="Edit Facility"
            description="Update the facility details below"
            fieldLabel="Facility name"
            value={editingFacility.name}
            open={isEditDialogOpen && canCreate}
            onOpenChange={setIsEditDialogOpen}
            onChange={(value) => {
              setEditingFacility(prev => prev ? { ...prev, name: value } : null);
            }}
            onSave={handleEditSave}
            onClose={handleEditClose}
            maxLength={20}
            validationFunction={isValidFacilityName}
            validationMessage="Facility name can only contain letters, numbers, and spaces (max 20 characters)"
            isRequired={true}
            extraFields={[
              {
                type: "select",
                label: "Campus",
                options: campuses.map(campus => ({ value: campus.id, label: campus.name })),
                value: editingFacility.campusId,
                onChange: handleCampusChange
              }
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
};
