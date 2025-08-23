
import React, { useState } from 'react';
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
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { EditDialog } from './EditDialog';
import { toast } from 'sonner';
import { CategoryItem } from '@/services/incident/categoryService';

interface CategoryTabProps {
  categories: CategoryItem[];
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => Promise<void>;
}

export const CategoryTab = ({ 
  categories, 
  addCategory, 
  updateCategory, 
  deleteCategory 
}: CategoryTabProps) => {
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{id: string, name: string} | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCategoryAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategory.trim()) {
      setError("Category name cannot be empty");
      return;
    }
    
    try {
      setError(null);
      await addCategory(newCategory.trim());
      setNewCategory('');
    } catch (error: any) {
      console.error('Error in handleCategoryAdd:', error);
      setError(error.message || 'Failed to add category');
    }
  };

  const handleCategoryDelete = (category: CategoryItem) => {
    setCategoryToDelete({
      id: category.id,
      name: category.name
    });
    setIsDeleteDialogOpen(true);
  };

  const confirmCategoryDelete = async () => {
    if (categoryToDelete) {
      try {
        await deleteCategory(categoryToDelete.id);
        setIsDeleteDialogOpen(false);
        setCategoryToDelete(null);
      } catch (error: any) {
        // Error is already handled by the service with toast
        setIsDeleteDialogOpen(false);
        setCategoryToDelete(null);
      }
    }
  };

  const cancelCategoryDelete = () => {
    setIsDeleteDialogOpen(false);
    setCategoryToDelete(null);
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
        console.log("Updating category:", editingCategory.id, "with name:", updatedName.trim());
        await updateCategory(editingCategory.id, updatedName.trim());
        handleEditClose();
      } catch (error: any) {
        console.error('Error in handleEditSave:', error);
        setError(error.message || 'Failed to update category');
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
        <form onSubmit={handleCategoryAdd} className="flex gap-4 mb-6">
          <Input
            placeholder="New category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            maxLength={25}
          />
          <Button type="submit">
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </form>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category Name</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
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
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditOpen(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleCategoryDelete(category)}
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
        {editingCategory && (
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
            maxLength={25}
            isRequired={true}
            error={error}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the category "{categoryToDelete?.name}"? 
                This action cannot be undone. If this category is linked to any incidents, 
                the deletion will be prevented to maintain data integrity.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelCategoryDelete}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmCategoryDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
