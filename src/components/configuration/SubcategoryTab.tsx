
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { ConfigItem, SubcategoryItem } from '@/contexts/types';
import { EditDialog } from './EditDialog';
import { toast } from '@/components/ui/sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface SubcategoryTabProps {
  categories: ConfigItem[];
  subcategoryMappings: Record<string, SubcategoryItem[]>;
  addSubcategory: (categoryId: string, name: string) => void;
  updateSubcategory: (categoryId: string, id: string, name: string) => void;
  deleteSubcategory: (categoryId: string, id: string) => void;
}

export const SubcategoryTab = ({ 
  categories, 
  subcategoryMappings,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory
}: SubcategoryTabProps) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [editingSubcategory, setEditingSubcategory] = useState<{id: string, name: string} | null>(null);
  
  const selectedCategorySubcategories = selectedCategoryId 
    ? subcategoryMappings[selectedCategoryId] || [] 
    : [];
  
  const selectedCategoryName = selectedCategoryId
    ? categories.find(cat => cat.id === selectedCategoryId)?.name
    : '';

  const handleSubcategoryAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategoryId) {
      toast.error("Please select a category first");
      return;
    }
    
    if (!newSubcategory.trim()) {
      toast.error("Subcategory name cannot be empty");
      return;
    }
    
    try {
      addSubcategory(selectedCategoryId, newSubcategory.trim());
      setNewSubcategory('');
      toast.success("Subcategory added successfully");
    } catch (error) {
      console.error("Error adding subcategory:", error);
      toast.error("Failed to add subcategory");
    }
  };

  const handleSubcategoryDelete = (id: string) => {
    if (!selectedCategoryId) return;
    
    try {
      deleteSubcategory(selectedCategoryId, id);
      toast.success("Subcategory deleted successfully");
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      toast.error("Failed to delete subcategory");
    }
  };

  const handleSubcategoryUpdate = (id: string, name: string) => {
    if (!selectedCategoryId) return;
    
    if (!name.trim()) {
      toast.error("Subcategory name cannot be empty");
      return;
    }
    
    try {
      updateSubcategory(selectedCategoryId, id, name.trim());
      setEditingSubcategory(null);
      toast.success("Subcategory updated successfully");
    } catch (error) {
      console.error("Error updating subcategory:", error);
      toast.error("Failed to update subcategory");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incident Subcategories</CardTitle>
        <CardDescription>Manage available incident subcategories for each category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1">
                Select Category
              </label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger id="category">
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
          </div>
          
          {selectedCategoryId && (
            <form onSubmit={handleSubcategoryAdd} className="flex gap-4 mb-6">
              <Input
                placeholder={`New subcategory for ${selectedCategoryName}`}
                value={newSubcategory}
                onChange={(e) => setNewSubcategory(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" /> Add Subcategory
              </Button>
            </form>
          )}
          
          {selectedCategoryId ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subcategory Name</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedCategorySubcategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-4 text-gray-500">
                      No subcategories found for this category. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  selectedCategorySubcategories.map((subcategory) => (
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
                                setEditingSubcategory({id: subcategory.id, name: subcategory.name});
                              }
                            }}
                            onChange={(value) => {
                              if (editingSubcategory) {
                                setEditingSubcategory({...editingSubcategory, name: value});
                              }
                            }}
                            onSave={() => {
                              if (editingSubcategory) {
                                handleSubcategoryUpdate(subcategory.id, editingSubcategory.name);
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
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Subcategory</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this subcategory? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleSubcategoryDelete(subcategory.id)}
                                  className="bg-red-600 hover:bg-red-700"
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
          ) : (
            <div className="text-center p-6 bg-gray-50 rounded-md">
              <p>Please select a category to manage its subcategories.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
