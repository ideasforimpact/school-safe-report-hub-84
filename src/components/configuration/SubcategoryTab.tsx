
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
import { ConfigItem, SubcategoryItem } from '@/contexts/types';
import { EditDialog } from './EditDialog';
import { toast } from 'sonner';

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
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategoryParent, setNewSubcategoryParent] = useState('');
  const [editingSubcategory, setEditingSubcategory] = useState<{id: string, name: string, parentId: string} | null>(null);

  const handleSubcategoryAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSubcategoryName.trim() || !newSubcategoryParent) {
      toast.error("Subcategory name and parent category are required");
      return;
    }
    
    addSubcategory(newSubcategoryParent, newSubcategoryName.trim());
    setNewSubcategoryName('');
    setNewSubcategoryParent('');
    toast.success("Subcategory added successfully");
  };

  const handleSubcategoryDelete = (parentId: string, id: string) => {
    deleteSubcategory(parentId, id);
    toast.success("Subcategory deleted successfully");
  };

  const handleSubcategoryUpdate = () => {
    if (!editingSubcategory || !editingSubcategory.name.trim()) {
      toast.error("Subcategory name cannot be empty");
      return;
    }
    
    updateSubcategory(
      editingSubcategory.parentId, 
      editingSubcategory.id, 
      editingSubcategory.name.trim()
    );
    setEditingSubcategory(null);
    toast.success("Subcategory updated successfully");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subcategories</CardTitle>
        <CardDescription>Manage subcategories for each category</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubcategoryAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Parent Category</label>
            <select
              className="border border-input bg-background px-3 py-2 rounded-md"
              value={newSubcategoryParent}
              onChange={(e) => setNewSubcategoryParent(e.target.value)}
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">New Subcategory</label>
            <div className="flex gap-2">
              <Input
                placeholder="New subcategory name"
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                required
              />
              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" /> Add
              </Button>
            </div>
          </div>
        </form>
        
        {categories.map((category) => (
          <div key={category.id} className="mb-8">
            <h3 className="text-lg font-medium mb-2">{category.name}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subcategory Name</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subcategoryMappings[category.id]?.map((subcategory) => (
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
                                name: subcategory.name,
                                parentId: category.id
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
                          onClick={() => handleSubcategoryDelete(category.id, subcategory.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!subcategoryMappings[category.id] || subcategoryMappings[category.id].length === 0) && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No subcategories found for this category
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
