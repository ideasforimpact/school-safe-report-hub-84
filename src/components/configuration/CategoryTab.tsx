
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

  const handleCategoryAdd = () => {
    if (!newCategory.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    
    addCategory(newCategory);
    setNewCategory('');
    toast.success("Category added successfully");
  };

  const handleCategoryDelete = (id: string) => {
    deleteCategory(id);
    toast.success("Category deleted successfully");
  };

  const handleCategoryUpdate = () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    
    updateCategory(editingCategory.id, editingCategory.name);
    setEditingCategory(null);
    toast.success("Category updated successfully");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incident Categories</CardTitle>
        <CardDescription>Manage available incident categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="New category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <Button onClick={handleCategoryAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category Name</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
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
                        } else {
                          setEditingCategory(null);
                        }
                      }}
                      onChange={(value) => setEditingCategory(prev => prev ? {...prev, name: value} : null)}
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
