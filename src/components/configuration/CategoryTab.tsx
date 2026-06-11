
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { EditDialog } from './EditDialog';
import { CategoryItem } from '@/services/incident/categoryService';
import { incidentReferenceService, IncidentReferenceCheck } from '@/services/incident/incidentReferenceService';
import { useAuth } from '@/contexts/auth/useAuth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CategoryTabProps {
  categories: CategoryItem[];
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => Promise<void>;
  canCreate?: boolean;
}

// Validation: allow any characters, up to 50 characters
const isValidCategoryName = (name: string) => {
  const categoryNameRegex = /^.{1,50}$/;
  return categoryNameRegex.test(name);
};

export const CategoryTab = ({ 
  categories, 
  addCategory, 
  updateCategory, 
  deleteCategory,
  canCreate = true,
}: CategoryTabProps) => {
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{id: string, name: string} | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [categoryReferences, setCategoryReferences] = useState<Record<string, IncidentReferenceCheck>>({});
  const { employeeData } = useAuth();

  // Pre-load reference info so we can disable delete button for linked categories
  useEffect(() => {
    const clientId = employeeData?.clientId || employeeData?.client_id;
    if (!clientId || categories.length === 0) {
      setCategoryReferences({});
      return;
    }

    let isCancelled = false;

    const fetchReferences = async () => {
      try {
        const results = await Promise.all(
          categories.map(async (category) => {
            const refInfo = await incidentReferenceService.checkCategoryReferences(category.id, clientId);
            return { id: category.id, refInfo };
          })
        );

        if (isCancelled) return;

        const map: Record<string, IncidentReferenceCheck> = {};
        results.forEach(({ id, refInfo }) => {
          map[id] = refInfo;
        });
        setCategoryReferences(map);
      } catch (error) {
        console.error('Error preloading category reference info:', error);
      }
    };

    fetchReferences();

    return () => {
      isCancelled = true;
    };
  }, [categories, employeeData]);

  const handleCategoryAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategory.trim()) {
      setError("Category name cannot be empty");
      return;
    }

    if (!isValidCategoryName(newCategory.trim())) {
      setError("Category name must be 1–50 characters");
      return;
    }
    
    try {
      setError(null);
      setIsAdding(true);
      await addCategory(newCategory.trim());
      setNewCategory('');
    } catch (error: any) {
      console.error('Error in handleCategoryAdd:', error);
      setError(error.message || 'Failed to add category');
    } finally {
      setIsAdding(false);
    }
  };

  const handleCategoryDelete = (category: CategoryItem) => {
    setCategoryToDelete({
      id: category.id,
      name: category.name
    });
    setDeleteError(null); // Clear any previous error
    setIsDeleteDialogOpen(true);
  };

  const confirmCategoryDelete = async () => {
    console.log('Component: confirmCategoryDelete called');
    
    if (categoryToDelete) {
      try {
        console.log('Component: Starting delete process for category:', categoryToDelete);
        setIsDeleting(true);
        setIsRefreshing(true);
        setDeleteError(null); // Clear any previous error
        await deleteCategory(categoryToDelete.id);
        console.log('Component: Delete completed successfully');
        setIsDeleteDialogOpen(false);
        setCategoryToDelete(null);
      } catch (error: any) {
        console.error('Component: Error in confirmCategoryDelete:', error);
        // Show the specific error message to the user
        setDeleteError(error.message || 'Failed to delete category');
        // Don't close the dialog on error - let user see the error message
      } finally {
        setIsDeleting(false);
        setIsRefreshing(false);
      }
    }
  };

  const cancelCategoryDelete = () => {
    setIsDeleteDialogOpen(false);
    setCategoryToDelete(null);
    setDeleteError(null); // Clear error when canceling
  };

  const handleEditOpen = (category: CategoryItem) => {
    console.log("Opening edit dialog for category:", category);
    setEditingCategory({
      id: category.id,
      name: category.name
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async (updatedName: string) => {
    if (!updatedName.trim()) {
      setError("Category name cannot be empty");
      return;
    }
    
    if (editingCategory) {
      try {
        setError(null);
        setIsUpdating(true);
        console.log("Updating category:", editingCategory.id, "with name:", updatedName.trim());
        await updateCategory(editingCategory.id, updatedName.trim());
        handleEditClose();
      } catch (error: any) {
        console.error('Error in handleEditSave:', error);
        setError(error.message || 'Failed to update category');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleEditClose = () => {
    console.log("Closing edit dialog");
    setIsEditDialogOpen(false);
    setEditingCategory(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incident Categories</CardTitle>
        <CardDescription>Manage available incident categories</CardDescription>
      </CardHeader>
      <CardContent>
        {canCreate && (
        <form onSubmit={handleCategoryAdd} className="flex gap-4 mb-6">
          <Input
            placeholder="New category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            maxLength={50}
            className={newCategory && !isValidCategoryName(newCategory) ? 'border-red-500' : ''}
          />
          {newCategory && !isValidCategoryName(newCategory) && (
            <p className="text-xs text-red-500 mt-1">Category name must be 1–50 characters</p>
          )}
          <Button type="submit" disabled={isAdding}>
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </>
            )}
          </Button>
        </form>
        )}
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category Name</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isRefreshing ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-gray-500">Refreshing data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-4 text-gray-500">
                  No categories found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>
                    {canCreate && (
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditOpen(category)}
                        disabled={isRefreshing}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      {(() => {
                        const refInfo = categoryReferences[category.id];
                        const isLinked = refInfo?.hasReferences;

                        // When linked, we visually disable the button and show a tooltip.
                        // We avoid the native `disabled` attribute so that TooltipTrigger still works.
                        if (isLinked) {
                          const message =
                            refInfo?.message ||
                            `This category is linked to ${refInfo?.count ?? 0} incident(s) and cannot be deleted.`;

                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      aria-disabled="true"
                                      className="text-red-400 hover:text-red-400 hover:bg-transparent cursor-not-allowed opacity-60"
                                      // No onClick when linked
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

                        // Not linked → regular enabled delete button
                        return (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleCategoryDelete(category)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={isRefreshing}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        );
                      })()}
                    </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Edit Dialog */}
        {editingCategory && canCreate && (
          <EditDialog
            title="Edit Category"
            description="Update the category name below"
            fieldLabel="Category name"
            value={editingCategory.name}
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) {
                setError(null);
              }
            }}
            onChange={(value) => {
              setEditingCategory(prev => prev ? { ...prev, name: value } : null);
            }}
            onSave={handleEditSave}
            onClose={handleEditClose}
            maxLength={50}
            isRequired={true}
            error={error}
            isLoading={isUpdating}
            validationFunction={isValidCategoryName}
            validationMessage="Category name must be 1–50 characters"
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen && canCreate} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the category "{categoryToDelete?.name}"? 
                This action cannot be undone. If this category is linked to any incidents, 
                the deletion will be prevented to maintain data integrity.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {deleteError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
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
              <AlertDialogCancel onClick={cancelCategoryDelete} disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={(e) => { e.preventDefault(); confirmCategoryDelete(); }} 
                disabled={isDeleting}
                className="bg-red-600 text-white hover:bg-red-700"
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
      </CardContent>
    </Card>
  );
};
