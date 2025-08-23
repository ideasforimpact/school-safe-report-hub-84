
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
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { CategoryItem, SubcategoryItem } from '@/services/incident/categoryService';
import { EditDialog } from './EditDialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth/useAuth';

interface SubcategoryTabProps {
  categories: CategoryItem[];
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
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [editingSubcategory, setEditingSubcategory] = useState<{id: string, name: string, categoryId: string} | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<{id: string, name: string} | null>(null);
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
    
    try {
      setError(null);
      // Client ID check is now handled in the hook and service
      await addSubcategory(selectedCategoryId, newSubcategoryName.trim());
      setNewSubcategoryName('');
    } catch (error: any) {
      console.error('Error in handleAddSubcategory:', error);
      setError(error.message || 'Failed to add subcategory');
    }
  };
  
  const handleDeleteClick = (subcategory: SubcategoryItem) => {
    setSubcategoryToDelete({
      id: subcategory.id,
      name: subcategory.name
    });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (subcategoryToDelete) {
      try {
        await deleteSubcategory(selectedCategoryId, subcategoryToDelete.id);
        setDeleteDialogOpen(false);
        setSubcategoryToDelete(null);
      } catch (error: any) {
        // Error handling is done in the hook, just close the dialog
        setDeleteDialogOpen(false);
        setSubcategoryToDelete(null);
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
          
          {selectedCategoryId && (
            <form className="flex gap-4 mt-4" onSubmit={handleAddSubcategory}>
              <Input
                placeholder={`Add subcategory for ${selectedCategory?.name || 'selected category'}`}
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                maxLength={25}
              />
              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" /> Add
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
              {currentSubcategories.length === 0 ? (
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
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditOpen(subcategory)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteClick(subcategory)}
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
        )}
        
        {!selectedCategoryId && (
          <div className="text-center py-6 bg-gray-50 rounded-md">
            <p className="text-gray-500">Select a category to manage its subcategories</p>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Subcategory</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the subcategory "{subcategoryToDelete?.name}"? 
                This action cannot be undone. If this subcategory is linked to any incidents, 
                deletion will be prevented.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setDeleteDialogOpen(false);
                setSubcategoryToDelete(null);
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
        {editingSubcategory && (
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
            maxLength={25}
            isRequired={true}
            error={error}
          />
        )}
      </CardContent>
    </Card>
  );
};
