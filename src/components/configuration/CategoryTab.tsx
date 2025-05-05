
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
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { ConfigItem } from '@/contexts/types';
import { EditDialog } from './EditDialog';
import { toast } from '@/components/ui/sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface CategoryTabProps {
  categories: ConfigItem[];
  addCategory: (name: string) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
}

export const CategoryTab = ({ 
  categories, 
  addCategory, 
  updateCategory, 
  deleteCategory 
}: CategoryTabProps) => {
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentDeleteId, setCurrentDeleteId] = useState<string | null>(null);

  const handleCategoryAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategory.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    
    try {
      addCategory(newCategory.trim());
      setNewCategory('');
      toast.success("Category added successfully");
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    }
  };

  const handleCategoryDelete = (id: string) => {
    setIsDeleting(true);
    try {
      deleteCategory(id);
      toast.success("Category deleted successfully");
      console.log("Category deleted:", id);
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    } finally {
      setIsDeleting(false);
      setCurrentDeleteId(null);
    }
  };

  const handleCategoryUpdate = (id: string, name: string) => {
    if (!name.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    
    try {
      updateCategory(id, name.trim());
      setEditingCategory(null);
      toast.success("Category updated successfully");
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    }
  };

  const prepareDelete = (id: string) => {
    setCurrentDeleteId(id);
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
            className="flex-1"
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
                      <EditDialog
                        title="Edit Category"
                        description="Update the category name below"
                        fieldLabel="Category name"
                        value={category.name}
                        onOpenChange={(open) => {
                          if (open) {
                            setEditingCategory({id: category.id, name: category.name});
                          }
                        }}
                        onChange={(value) => {
                          if (editingCategory) {
                            setEditingCategory({...editingCategory, name: value});
                          }
                        }}
                        onSave={() => {
                          if (editingCategory) {
                            handleCategoryUpdate(category.id, editingCategory.name);
                          }
                        }}
                        triggerButton={
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => prepareDelete(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Category</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this category? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleCategoryDelete(category.id)}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={isDeleting}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
