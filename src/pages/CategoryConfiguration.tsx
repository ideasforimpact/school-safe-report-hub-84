
import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIncidents } from '@/contexts/IncidentContext';
import { toast } from '@/components/ui/sonner';
import { CategoryTab } from '@/components/configuration/CategoryTab';
import { SubcategoryTab } from '@/components/configuration/SubcategoryTab';
import { AlertTriangle } from 'lucide-react';
import { ConfigItem } from '@/contexts/types';

const CategoryConfiguration = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const [isAddingDigitalSafety, setIsAddingDigitalSafety] = useState(false);
  const [digitalSafetyAdded, setDigitalSafetyAdded] = useState(false);
  
  // Local state to track categories and subcategories
  const [localCategories, setLocalCategories] = useState<ConfigItem[]>([]);
  const [localSubcategoryMappings, setLocalSubcategoryMappings] = useState<Record<string, any>>({});

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

  // Sync local state with context when it changes
  useEffect(() => {
    setLocalCategories(categories);
    setLocalSubcategoryMappings(subcategoryMappings);
  }, [categories, subcategoryMappings]);

  // Add Digital Safety category if it doesn't exist
  useEffect(() => {
    // Don't attempt to add Digital Safety if we're already trying to add it,
    // or if categories haven't loaded yet, or if we've already successfully added it
    if (isAddingDigitalSafety || localCategories.length === 0 || digitalSafetyAdded) {
      return;
    }
    
    // Check if Digital Safety already exists
    const digitalSafetyExists = localCategories.some(cat => 
      cat.name.toLowerCase() === 'digital safety'
    );
    
    console.log("Digital Safety exists:", digitalSafetyExists);
    
    // Only try to add if it doesn't exist
    if (!digitalSafetyExists) {
      setIsAddingDigitalSafety(true);
      
      try {
        const newCategory = addCategory('Digital Safety');
        // Update local state immediately for the UI - ensure we only add valid objects
        if (newCategory) {
          setLocalCategories(prevCategories => [...prevCategories, newCategory as ConfigItem]);
          toast.success("Digital Safety category added successfully");
          setDigitalSafetyAdded(true);
        }
      } catch (error) {
        console.error("Error adding Digital Safety category:", error);
        // Only show error toast if it's not because the category already exists
        if (error instanceof Error && !error.message.includes("already exists")) {
          toast.error(`Failed to add Digital Safety category: ${error.message}`);
        } else {
          // If the error is because it already exists, mark it as added
          setDigitalSafetyAdded(true);
        }
      } finally {
        setIsAddingDigitalSafety(false);
      }
    } else {
      // Mark as added if it already exists
      setDigitalSafetyAdded(true);
    }
  }, [localCategories, addCategory, isAddingDigitalSafety, digitalSafetyAdded]);

  const handleAddCategory = (name: string) => {
    if (!name.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }
    
    try {
      const newCategory = addCategory(name);
      // Update local state immediately - ensure we only add valid objects
      if (newCategory) {
        setLocalCategories(prevCategories => [...prevCategories, newCategory as ConfigItem]);
        console.log("Category added successfully:", newCategory);
        toast.success("Category added successfully");
      }
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add category");
    }
  };

  const handleUpdateCategory = (id: string, name: string) => {
    try {
      updateCategory(id, name);
      // Update local state immediately
      setLocalCategories(prevCategories => prevCategories.map(cat => 
        cat.id === id ? { ...cat, name } : cat
      ));
      console.log("Category updated:", id, name);
      toast.success("Category updated successfully");
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update category");
    }
  };

  const handleDeleteCategory = (id: string) => {
    try {
      deleteCategory(id);
      // Update local state immediately
      setLocalCategories(prevCategories => prevCategories.filter(cat => cat.id !== id));
      // Also remove from subcategory mappings
      const { [id]: _, ...rest } = localSubcategoryMappings;
      setLocalSubcategoryMappings(rest);
      console.log("Category deleted:", id);
      toast.success("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete category");
    }
  };

  const handleAddSubcategory = (categoryId: string, name: string) => {
    try {
      const newSubcategory = addSubcategory(categoryId, name);
      // Update local state immediately
      if (newSubcategory) {
        setLocalSubcategoryMappings(prev => ({
          ...prev,
          [categoryId]: [...(prev[categoryId] || []), newSubcategory]
        }));
        toast.success("Subcategory added successfully");
      }
    } catch (error) {
      console.error("Error adding subcategory:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add subcategory");
    }
  };

  const handleUpdateSubcategory = (categoryId: string, id: string, name: string) => {
    try {
      updateSubcategory(categoryId, id, name);
      // Update local state immediately
      setLocalSubcategoryMappings(prev => ({
        ...prev,
        [categoryId]: (prev[categoryId] || []).map(sub => 
          sub.id === id ? { ...sub, name } : sub
        )
      }));
      toast.success("Subcategory updated successfully");
    } catch (error) {
      console.error("Error updating subcategory:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update subcategory");
    }
  };

  const handleDeleteSubcategory = (categoryId: string, id: string) => {
    try {
      deleteSubcategory(categoryId, id);
      // Update local state immediately
      setLocalSubcategoryMappings(prev => ({
        ...prev,
        [categoryId]: (prev[categoryId] || []).filter(sub => sub.id !== id)
      }));
      toast.success("Subcategory deleted successfully");
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete subcategory");
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
                  categories={localCategories}
                  addCategory={handleAddCategory}
                  updateCategory={handleUpdateCategory}
                  deleteCategory={handleDeleteCategory}
                />
              </TabsContent>
              
              <TabsContent value="subcategories">
                <SubcategoryTab 
                  categories={localCategories}
                  subcategoryMappings={localSubcategoryMappings}
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
