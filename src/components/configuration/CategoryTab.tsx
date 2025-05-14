
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
import { CategoryItem } from '@/services/incident/categoryService';

interface CategoryTabProps {
  categories: CategoryItem[];
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

  const handleCategoryAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategory.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    
    addCategory(newCategory.trim());
    setNewCategory('');
  };

  const handleCategoryDelete = (id: string) => {
    deleteCategory(id);
  };

  const handleCategoryUpdate = () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    
    updateCategory(editingCategory.id, editingCategory.name.trim());
    setEditingCategory(null);
  };

  const handleEditClose = () => {
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
                        value={editingCategory?.id === category.id ? editingCategory.name : category.name}
                        defaultValue={category.name}
                        onOpenChange={(open) => {
                          if (open) {
                            setEditingCategory({id: category.id, name: category.name});
                          } else if (!open && editingCategory) {
                            setEditingCategory(null);
                          }
                        }}
                        onChange={(value) => setEditingCategory(prev => prev ? {...prev, name: value} : null)}
                        onSave={handleCategoryUpdate}
                        onClose={handleEditClose}
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
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
