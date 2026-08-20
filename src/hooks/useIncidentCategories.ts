
import { useState, useEffect, useCallback, useRef } from 'react';
import { categoryService, CategoryItem, SubcategoryItem } from '@/services/incident/categoryService';
import { invokeIncidentConfig } from '@/components/incident/incidentConfigurationEdgeService';
import { ContributingFactorItem } from '@/services/incident/contributingFactorService';
import { ReportTypeItem } from '@/services/incident/reportTypeService';
import { PriorityItem } from '@/services/incident/priorityService';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from 'sonner';

interface ListAllResult {
  categories: CategoryItem[];
  subcategories: SubcategoryItem[];
  priorities: PriorityItem[];
  reportTypes: ReportTypeItem[];
  contributingFactors: ContributingFactorItem[];
}

export function useIncidentCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [subcategoryMappings, setSubcategoryMappings] = useState<Record<string, SubcategoryItem[]>>({});
  // Populated alongside categories/subcategories by the same listAll call — lets
  // IncidentConfigurationContent seed its Report Types/Priorities/Contributing
  // Factors tabs from this one fetch instead of three separate edge-function calls.
  const [contributingFactors, setContributingFactors] = useState<ContributingFactorItem[]>([]);
  const [reportTypes, setReportTypes] = useState<ReportTypeItem[]>([]);
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { employeeData, user } = useAuth();

  // Load categories and subcategories on mount
  const clientTypeId = employeeData?.clientType?.id ?? user?.clientType?.id ?? undefined;

  // Dedupes overlapping calls (e.g. React.StrictMode's dev double-invoke)
  // without blocking legitimate re-fetches after create/update/delete.
  const inflightRef = useRef<Promise<void> | null>(null);

  // Single edge-function call fetches all incident config data from the server
  const loadData = useCallback(async () => {
    if (inflightRef.current) return inflightRef.current;

    const request = (async () => {
      if (!employeeData?.clientId) {
        toast.error('Client information not available');
        return;
      }

      try {
        setLoading(true);
        if (!employeeData?.clientId || !clientTypeId) {
          toast.error('Client information not available');
          return;
        }

        const result = await invokeIncidentConfig<ListAllResult>({
          resource: 'categories', // ignored by listAll, kept for type-shape consistency
          operation: 'listAll',
          clientId: employeeData.clientId,
          clientTypeId,
        });

        setCategories(result.categories);
        setContributingFactors(result.contributingFactors);
        setReportTypes(result.reportTypes);
        setPriorities(result.priorities);

        // Group subcategories by category_id
        const mappings: Record<string, SubcategoryItem[]> = {};
        result.subcategories.forEach(sub => {
          if (sub.category_id) {
            if (!mappings[sub.category_id]) {
              mappings[sub.category_id] = [];
            }
            mappings[sub.category_id].push(sub);
          }
        });

        setSubcategoryMappings(mappings);
      } catch (error) {
        console.error('Error loading categories and subcategories:', error);
        toast.error('Failed to load categories and subcategories');
      } finally {
        setLoading(false);
        inflightRef.current = null;
      }
    })();

    inflightRef.current = request;
    return request;
  }, [employeeData?.clientId, clientTypeId]);

  useEffect(() => {
    loadData();
  }, [employeeData?.clientId, loadData]);

  // Category operations
  const addCategory = async (name: string) => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    try {
      await categoryService.addCategory(name, undefined, employeeData.clientId, clientTypeId);
      
      // Refresh data from server to ensure consistency
      const [categoriesData, subcategoriesData] = await Promise.all([
        categoryService.getCategories(employeeData.clientId, clientTypeId),
        categoryService.getSubcategories(undefined, employeeData.clientId, clientTypeId)
      ]);

      setCategories(categoriesData);
      
      // Group subcategories by category_id
      const mappings: Record<string, SubcategoryItem[]> = {};
      subcategoriesData.forEach(sub => {
        if (sub.category_id) {
          if (!mappings[sub.category_id]) {
            mappings[sub.category_id] = [];
          }
          mappings[sub.category_id].push(sub);
        }
      });
      
      setSubcategoryMappings(mappings);
      toast.success('Category added successfully');
    } catch (error) {
      console.error('Error adding category:', error);
      // The service already shows the error toast, so we don't need to show another one
      throw error; // Re-throw to let the component handle it
    }
  };

  const updateCategory = async (id: string, name: string) => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    try {
      await categoryService.updateCategory(id, name, undefined, employeeData.clientId, clientTypeId);
      
      // Refresh data from server to ensure consistency
      const [categoriesData, subcategoriesData] = await Promise.all([
        categoryService.getCategories(employeeData.clientId, clientTypeId),
        categoryService.getSubcategories(undefined, employeeData.clientId, clientTypeId)
      ]);

      setCategories(categoriesData);
      
      // Group subcategories by category_id
      const mappings: Record<string, SubcategoryItem[]> = {};
      subcategoriesData.forEach(sub => {
        if (sub.category_id) {
          if (!mappings[sub.category_id]) {
            mappings[sub.category_id] = [];
          }
          mappings[sub.category_id].push(sub);
        }
      });
      
      setSubcategoryMappings(mappings);
      toast.success('Category updated successfully');
    } catch (error) {
      console.error('Error updating category:', error);
      // The service already shows the error toast, so we don't need to show another one
      throw error; // Re-throw to let the component handle it
    }
  };

  const deleteCategory = async (id: string) => {
    console.log('Hook: deleteCategory called with id:', id);
    
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    try {
      console.log('Hook: Calling categoryService.deleteCategory...');
      await categoryService.deleteCategory(id, employeeData.clientId);
      console.log('Hook: Category service delete completed successfully');
      
      // Refresh data from server to ensure consistency
      console.log('Hook: Refreshing data from server...');
      const [categoriesData, subcategoriesData] = await Promise.all([
        categoryService.getCategories(employeeData.clientId, clientTypeId),
        categoryService.getSubcategories(undefined, employeeData.clientId, clientTypeId)
      ]);

      console.log('Hook: Received refreshed data:', { 
        categoriesCount: categoriesData.length, 
        subcategoriesCount: subcategoriesData.length 
      });

      setCategories(categoriesData);
      
      // Group subcategories by category_id
      const mappings: Record<string, SubcategoryItem[]> = {};
      subcategoriesData.forEach(sub => {
        if (sub.category_id) {
          if (!mappings[sub.category_id]) {
            mappings[sub.category_id] = [];
          }
          mappings[sub.category_id].push(sub);
        }
      });
      
      setSubcategoryMappings(mappings);
      console.log('Hook: State updated successfully');
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  // Subcategory operations - Ensure client_id is passed
  const addSubcategory = async (categoryId: string, name: string) => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    try {
      await categoryService.addSubcategory(name, categoryId, undefined, employeeData.clientId, clientTypeId);
      
      // Refresh subcategories from server to ensure consistency
      const subcategoriesData = await categoryService.getSubcategories(undefined, employeeData.clientId, clientTypeId);
      
      // Group subcategories by category_id
      const mappings: Record<string, SubcategoryItem[]> = {};
      subcategoriesData.forEach(sub => {
        if (sub.category_id) {
          if (!mappings[sub.category_id]) {
            mappings[sub.category_id] = [];
          }
          mappings[sub.category_id].push(sub);
        }
      });
      
      setSubcategoryMappings(mappings);
      toast.success('Subcategory added successfully');
    } catch (error) {
      console.error('Error adding subcategory:', error);
      // The service already shows the error toast, so we don't need to show another one
      throw error; // Re-throw to let the component handle it
    }
  };

  const updateSubcategory = async (categoryId: string, id: string, name: string) => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    try {
      await categoryService.updateSubcategory(id, name, categoryId, undefined, employeeData.clientId);
      
      // Refresh subcategories from server to ensure consistency
      const subcategoriesData = await categoryService.getSubcategories(undefined, employeeData.clientId, clientTypeId);
      
      // Group subcategories by category_id
      const mappings: Record<string, SubcategoryItem[]> = {};
      subcategoriesData.forEach(sub => {
        if (sub.category_id) {
          if (!mappings[sub.category_id]) {
            mappings[sub.category_id] = [];
          }
          mappings[sub.category_id].push(sub);
        }
      });
      
      setSubcategoryMappings(mappings);
      toast.success('Subcategory updated successfully');
    } catch (error) {
      console.error('Error updating subcategory:', error);
      // The service already shows the error toast, so we don't need to show another one
      throw error; // Re-throw to let the component handle it
    }
  };

  const deleteSubcategory = async (categoryId: string, id: string) => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    try {
      await categoryService.deleteSubcategory(id, employeeData.clientId);
      
      // Refresh subcategories from server to ensure consistency
      const subcategoriesData = await categoryService.getSubcategories(undefined, employeeData.clientId, clientTypeId);
      
      // Group subcategories by category_id
      const mappings: Record<string, SubcategoryItem[]> = {};
      subcategoriesData.forEach(sub => {
        if (sub.category_id) {
          if (!mappings[sub.category_id]) {
            mappings[sub.category_id] = [];
          }
          mappings[sub.category_id].push(sub);
        }
      });
      
      setSubcategoryMappings(mappings);
      toast.success('Subcategory deleted successfully');
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      // Re-throw the error so the component can handle it and show the specific error message
      throw error;
    }
  };

  return {
    categories,
    subcategoryMappings,
    contributingFactors,
    reportTypes,
    priorities,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    loadData
  };
}
