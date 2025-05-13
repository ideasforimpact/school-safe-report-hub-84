
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
import { EditDialog } from './EditDialog';
import { toast } from 'sonner';
import { useCategories } from '@/hooks/useCategories';
import { Loader2 } from 'lucide-react';

export const CategoryTab = () => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ id: string, name: string } | null>(null);
  const { categories, loading, error, addCategory, updateCategory, deleteCategory } = useCategories();

  const handleCategoryAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    
    try {
      await addCategory(newCategoryName.trim());
      setNewCategoryName('');
      toast.success("Category added successfully");
    } catch (error) {
      toast.error("Failed to add category");
    }
  };

  const handleCategoryDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      toast.success("Category deleted successfully");
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  const handleCategoryUpdate = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    
    try {
      await updateCategory(editingCategory.id, { name: editingCategory.name.trim() });
      setEditingCategory(null);
      toast.success("Category updated successfully");
    } catch (error) {
      toast.error("Failed to update category");
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center p-4 border border-red-200 rounded-md bg-red-50">
            <span className="text-red-600">Error loading categories: {error.message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
        <CardDescription>Manage incident categories</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCategoryAdd} className="flex gap-2 mb-6">
          <Input
            placeholder="New category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-grow"
            required
          />
          <Button type="submit">
            <Plus className="mr-2 h-4 w-4" /> Add
          </Button>
        </form>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading categories...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length > 0 ? (
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
                              setEditingCategory({ id: category.id, name: category.name });
                            } else {
                              setEditingCategory(null);
                            }
                          }}
                          onChange={(value) => setEditingCategory(prev => 
                            prev ? {...prev, name: value} : null
                          )}
                          onSave={handleCategoryUpdate}
                          triggerButton={
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                        />
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleCategoryDelete(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No categories found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
