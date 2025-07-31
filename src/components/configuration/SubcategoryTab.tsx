
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
  const { employeeData } = useAuth();
  
  const handleAddSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategoryId) {
      toast.error("Please select a category");
      return;
    }
    
    if (!newSubcategoryName.trim()) {
      toast.error("Subcategory name cannot be empty");
      return;
    }
    
    // Client ID check is now handled in the hook and service
    addSubcategory(selectedCategoryId, newSubcategoryName.trim());
    setNewSubcategoryName('');
  };
  
  const handleDeleteSubcategory = async (categoryId: string, subcategoryId: string) => {
    try {
      await deleteSubcategory(categoryId, subcategoryId);
      toast.success('Subcategory deleted successfully');
    } catch (error: any) {
      console.error('Error deleting subcategory:', error);
      toast.error(error.message || 'Failed to delete subcategory');
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

  const handleEditSave = (updatedName: string) => {
    if (!updatedName.trim()) {
      toast.error("Subcategory name cannot be empty");
      return;
    }
    
    if (editingSubcategory) {
      console.log("Updating subcategory:", editingSubcategory.id, "with name:", updatedName.trim());
      updateSubcategory(
        editingSubcategory.categoryId, 
        editingSubcategory.id, 
        updatedName.trim()
      );
      handleEditClose();
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
                          onClick={() => handleDeleteSubcategory(selectedCategoryId, subcategory.id)}
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

        {/* Edit Dialog */}
        {editingSubcategory && (
          <EditDialog
            title="Edit Subcategory"
            description="Update the subcategory name below"
            fieldLabel="Subcategory name"
            value={editingSubcategory.name}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onChange={(value) => {
              setEditingSubcategory(prev => prev ? { ...prev, name: value } : null);
            }}
            onSave={handleEditSave}
            onClose={handleEditClose}
          />
        )}
      </CardContent>
    </Card>
  );
};
