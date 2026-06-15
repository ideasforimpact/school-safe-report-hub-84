
import React, { useEffect, useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { CategoryItem, SubcategoryItem } from '@/services/incident/categoryService';
import { EditDialog } from './EditDialog';
import { useAuth } from '@/contexts/auth/useAuth';
import Loader from '../common/Loader';

// Validation: allow any characters, up to 50 characters
const isValidSubcategoryName = (name: string) => {
  const subcategoryNameRegex = /^.{1,50}$/;
  return subcategoryNameRegex.test(name);
};

interface SubcategoryTabProps {
  categories: CategoryItem[];
  subcategoryMappings: Record<string, SubcategoryItem[]>;
  addSubcategory: (categoryId: string, name: string) => void;
  updateSubcategory: (categoryId: string, id: string, name: string) => void;
  deleteSubcategory: (categoryId: string, id: string) => void;
  canCreate?: boolean;
}

export const SubcategoryTab = ({
  categories,
  subcategoryMappings,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  canCreate = true,
}: SubcategoryTabProps) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [editingSubcategory, setEditingSubcategory] = useState<{id: string, name: string, categoryId: string} | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<{id: string, name: string} | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { employeeData } = useAuth();
  
  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategoryId) {
      setError("Please select a category");
      return;
    }
    
    if (!newSubcategoryName.trim()) {
      setError("Subcategory name cannot be empty");
      return;
    }

    if (!isValidSubcategoryName(newSubcategoryName.trim())) {
      setError("Subcategory name must be 1–50 characters");
      return;
    }
    
    try {
      setError(null);
      setIsAdding(true);
      // Client ID check is now handled in the hook and service
      await addSubcategory(selectedCategoryId, newSubcategoryName.trim());
      setNewSubcategoryName('');
    } catch (error: any) {
      console.error('Error in handleAddSubcategory:', error);
      setError(error.message || 'Failed to add subcategory');
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleDeleteClick = (subcategory: SubcategoryItem) => {
    setSubcategoryToDelete({
      id: subcategory.id,
      name: subcategory.name
    });
    setDeleteError(null); // Clear any previous error
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (subcategoryToDelete) {
      try {
        setIsDeleting(true);
        setIsRefreshing(true);
        setDeleteError(null); // Clear any previous error
        await deleteSubcategory(selectedCategoryId, subcategoryToDelete.id);
        setDeleteDialogOpen(false);
        setSubcategoryToDelete(null);
      } catch (error: any) {
        console.error('Error in handleConfirmDelete:', error);
        setDeleteError(error.message || 'Failed to delete subcategory');
        // Don't close the dialog on error - let user see the error message
      } finally {
        setIsDeleting(false);
        setIsRefreshing(false);
      }
    }
  };
  
  const handleEditOpen = (subcategory: SubcategoryItem) => {
    console.log("Opening edit dialog for subcategory:", subcategory);
    setEditingSubcategory({
      id: subcategory.id,
      name: subcategory.name,
      categoryId: selectedCategoryId
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async (updatedName: string) => {
    if (!updatedName.trim()) {
      setError("Subcategory name cannot be empty");
      return;
    }
    
    if (editingSubcategory) {
      try {
        setError(null);
        setIsUpdating(true);
        console.log("Updating subcategory:", editingSubcategory.id, "with name:", updatedName.trim());
        await updateSubcategory(
          editingSubcategory.categoryId, 
          editingSubcategory.id, 
          updatedName.trim()
        );
        handleEditClose();
      } catch (error: any) {
        console.error('Error in handleEditSave:', error);
        setError(error.message || 'Failed to update subcategory');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleEditClose = () => {
    console.log("Closing edit dialog");
    setIsEditDialogOpen(false);
    setEditingSubcategory(null);
  };
  
  // Get subcategories for selected category
  const currentSubcategories = selectedCategoryId 
    ? subcategoryMappings[selectedCategoryId] || []
    : [];
  
  // Find currently selected category name
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subcategories</CardTitle>
        <CardDescription>Manage subcategories for incident categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1">
              Select Category
            </label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedCategoryId && canCreate && (
            <form className="flex gap-4 mt-4" onSubmit={handleAddSubcategory}>
              <div className="flex-1">
                <Input
                  placeholder={`Add subcategory for ${selectedCategory?.name || 'selected category'}`}
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  maxLength={50}
                  className={newSubcategoryName && !isValidSubcategoryName(newSubcategoryName) ? 'border-red-500' : ''}
                />
                {newSubcategoryName && !isValidSubcategoryName(newSubcategoryName) && (
                  <p className="text-xs text-red-500 mt-1">Subcategory name must be 1–50 characters</p>
                )}
              </div>
              <Button type="submit" disabled={isAdding}>
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
        
        {selectedCategoryId && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subcategory Name</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isRefreshing ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-4">                    
                    <Loader text="Refreshing data..." />                    
                  </TableCell>
                </TableRow>
              ) : currentSubcategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-4 text-gray-500">
                    No subcategories found for this category. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                currentSubcategories.map(subcategory => (
                  <TableRow key={subcategory.id}>
                    <TableCell>{subcategory.name}</TableCell>
                    <TableCell>
                      {canCreate && (
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditOpen(subcategory)}
                          disabled={isRefreshing}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(subcategory)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={isRefreshing}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
        
        {!selectedCategoryId && (
          <div className="text-center py-6 bg-gray-50 rounded-md">
            <p className="text-gray-500">Select a category to manage its subcategories</p>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen && canCreate} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Subcategory</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the subcategory "{subcategoryToDelete?.name}"? 
                This action cannot be undone. If this subcategory is linked to any incidents, 
                deletion will be prevented.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {deleteError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{deleteError}</p>
                  </div>
                </div>
              </div>
            )}
            <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setSubcategoryToDelete(null);
              setDeleteError(null); // Clear error when canceling
            }} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
              <AlertDialogAction 
                onClick={(e) => { e.preventDefault(); handleConfirmDelete(); }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Dialog */}
        {editingSubcategory && canCreate && (
          <EditDialog
            title="Edit Subcategory"
            description="Update the subcategory name below"
            fieldLabel="Subcategory name"
            value={editingSubcategory.name}
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) {
                setError(null);
              }
            }}
            onChange={(value) => {
              setEditingSubcategory(prev => prev ? { ...prev, name: value } : null);
            }}
            onSave={handleEditSave}
            onClose={handleEditClose}
            maxLength={50}
            isRequired={true}
            error={error}
            isLoading={isUpdating}
            validationFunction={isValidSubcategoryName}
            validationMessage="Subcategory name must be 1–50 characters"
          />
        )}
      </CardContent>
    </Card>
  );
};
