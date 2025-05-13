
import React, { useState, useEffect } from 'react';
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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { EditDialog } from './EditDialog';
import { toast } from 'sonner';
import { useCategories } from '@/hooks/useCategories';
import { useSubcategories } from '@/hooks/useSubcategories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const SubcategoryTab = () => {
  const { categories, loading: categoriesLoading } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const { 
    subcategories, 
    loading: subcategoriesLoading, 
    addSubcategory, 
    updateSubcategory, 
    deleteSubcategory 
  } = useSubcategories(selectedCategoryId);
  
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [editingSubcategory, setEditingSubcategory] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    // Set the first category as selected when categories are loaded
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const handleSubcategoryAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSubcategoryName.trim() || !selectedCategoryId) {
      toast.error("Subcategory name and category are required");
      return;
    }
    
    try {
      await addSubcategory(newSubcategoryName.trim());
      setNewSubcategoryName('');
      toast.success("Subcategory added successfully");
    } catch (error) {
      toast.error("Failed to add subcategory");
    }
  };

  const handleSubcategoryDelete = async (id: string) => {
    try {
      await deleteSubcategory(id);
      toast.success("Subcategory deleted successfully");
    } catch (error) {
      toast.error("Failed to delete subcategory");
    }
  };

  const handleSubcategoryUpdate = async () => {
    if (!editingSubcategory || !editingSubcategory.name.trim()) {
      toast.error("Subcategory name cannot be empty");
      return;
    }
    
    try {
      await updateSubcategory(editingSubcategory.id, { name: editingSubcategory.name.trim() });
      setEditingSubcategory(null);
      toast.success("Subcategory updated successfully");
    } catch (error) {
      toast.error("Failed to update subcategory");
    }
  };

  const loading = categoriesLoading || subcategoriesLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subcategories</CardTitle>
        <CardDescription>Manage subcategories for each category</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading...</span>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select Category</label>
              <Select 
                value={selectedCategoryId} 
                onValueChange={setSelectedCategoryId}
                disabled={categories.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCategoryId && (
              <form onSubmit={handleSubcategoryAdd} className="flex gap-2 mb-6">
                <Input
                  placeholder="New subcategory name"
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  className="flex-grow"
                  required
                />
                <Button type="submit">
                  <Plus className="mr-2 h-4 w-4" /> Add
                </Button>
              </form>
            )}
            
            {selectedCategoryId && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subcategory Name</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subcategories.length > 0 ? (
                    subcategories.map((subcategory) => (
                      <TableRow key={subcategory.id}>
                        <TableCell>{subcategory.name}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <EditDialog
                              title="Edit Subcategory"
                              description="Update the subcategory name below"
                              fieldLabel="Subcategory name"
                              value={subcategory.name}
                              onOpenChange={(open) => {
                                if (open) {
                                  setEditingSubcategory({
                                    id: subcategory.id,
                                    name: subcategory.name
                                  });
                                } else {
                                  setEditingSubcategory(null);
                                }
                              }}
                              onChange={(value) => setEditingSubcategory(prev => 
                                prev ? {...prev, name: value} : null
                              )}
                              onSave={handleSubcategoryUpdate}
                              triggerButton={
                                <Button variant="ghost" size="icon">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              }
                            />
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleSubcategoryDelete(subcategory.id)}
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
                        No subcategories found for this category
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
