
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIncidents } from '@/contexts/IncidentContext';
import { toast } from '@/components/ui/sonner';
import { CategoryTab } from '@/components/configuration/CategoryTab';
import { SubcategoryTab } from '@/components/configuration/SubcategoryTab';
import { AlertTriangle } from 'lucide-react';

const CategoryConfiguration = () => {
  const [activeTab, setActiveTab] = useState('categories');

  const { 
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    subcategoryMappings,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory
  } = useIncidents();

  const handleAddCategory = (name: string) => {
    try {
      addCategory(name);
      toast.success("Category added successfully");
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    }
  };

  const handleUpdateCategory = (id: string, name: string) => {
    try {
      updateCategory(id, name);
      toast.success("Category updated successfully");
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    }
  };

  const handleDeleteCategory = (id: string) => {
    try {
      deleteCategory(id);
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const handleAddSubcategory = (categoryId: string, name: string) => {
    try {
      addSubcategory(categoryId, name);
      toast.success("Subcategory added successfully");
    } catch (error) {
      console.error("Error adding subcategory:", error);
      toast.error("Failed to add subcategory");
    }
  };

  const handleUpdateSubcategory = (categoryId: string, id: string, name: string) => {
    try {
      updateSubcategory(categoryId, id, name);
      toast.success("Subcategory updated successfully");
    } catch (error) {
      console.error("Error updating subcategory:", error);
      toast.error("Failed to update subcategory");
    }
  };

  const handleDeleteSubcategory = (categoryId: string, id: string) => {
    try {
      deleteSubcategory(categoryId, id);
      toast.success("Subcategory deleted successfully");
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      toast.error("Failed to delete subcategory");
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto p-4">
        <div>
          <h1 className="text-2xl font-bold">Category Configuration</h1>
          <p className="text-gray-600 mt-1">
            Manage categories and subcategories for incident reporting
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="categories" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Categories</span>
                </TabsTrigger>
                <TabsTrigger value="subcategories" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Subcategories</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="categories">
                <CategoryTab 
                  categories={categories}
                  addCategory={handleAddCategory}
                  updateCategory={handleUpdateCategory}
                  deleteCategory={handleDeleteCategory}
                />
              </TabsContent>
              
              <TabsContent value="subcategories">
                <SubcategoryTab 
                  categories={categories}
                  subcategoryMappings={subcategoryMappings}
                  addSubcategory={handleAddSubcategory}
                  updateSubcategory={handleUpdateSubcategory}
                  deleteSubcategory={handleDeleteSubcategory}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CategoryConfiguration;
