
import { useState, useEffect, useRef } from 'react';
import { categoryService, CategoryItem, SubcategoryItem } from '@/services/incident/categoryService';
import { ContributingFactorItem } from '@/services/incident/contributingFactorService';
import { ReportTypeItem } from '@/services/incident/reportTypeService';
import { PriorityItem } from '@/services/incident/priorityService';
import { useAuth } from '@/contexts/auth/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

function buildSubcategoryMappings(subcategories: SubcategoryItem[]): Record<string, SubcategoryItem[]> {
  const mappings: Record<string, SubcategoryItem[]> = {};
  subcategories.forEach(sub => {
    if (sub.category_id) {
      if (!mappings[sub.category_id]) mappings[sub.category_id] = [];
      mappings[sub.category_id].push(sub);
    }
  });
  return mappings;
}

export function useIncidentCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [subcategoryMappings, setSubcategoryMappings] = useState<Record<string, SubcategoryItem[]>>({});
  const [contributingFactors, setContributingFactors] = useState<ContributingFactorItem[]>([]);
  const [reportTypes, setReportTypes] = useState<ReportTypeItem[]>([]);
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { employeeData } = useAuth();
  const fetchedForClientRef = useRef<string | null>(null);

  // Single edge-function call fetches all incident config data from the server
  const loadData = async () => {
    if (!employeeData?.clientId) {
      toast.error('Client information not available');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('init-incident-data', {
        body: { action: 'fetch-all', clientId: employeeData.clientId },
      });

      if (error) throw error;

      setCategories(data?.categories ?? []);
      setSubcategoryMappings(buildSubcategoryMappings(data?.subcategories ?? []));
      setContributingFactors(data?.contributingFactors ?? []);
      setReportTypes(data?.reportTypes ?? []);
      setPriorities(data?.priorities ?? []);
    } catch (error) {
      console.error('Error loading incident config:', error);
      toast.error('Failed to load incident configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!employeeData?.clientId || fetchedForClientRef.current === employeeData.clientId) return;
    fetchedForClientRef.current = employeeData.clientId;
    loadData();
  }, [employeeData?.clientId]);

  // After mutations, refresh only categories + subcategories (targeted, not full reload)
  const refreshCategories = async () => {
    if (!employeeData?.clientId) return;
    const [cats, subs] = await Promise.all([
      categoryService.getCategories(employeeData.clientId),
      categoryService.getSubcategories(undefined, employeeData.clientId),
    ]);
    setCategories(cats);
    setSubcategoryMappings(buildSubcategoryMappings(subs));
  };

  // Category operations
  const addCategory = async (name: string) => {
    if (!employeeData?.clientId) { toast.error('Client information not available'); return; }
    try {
      await categoryService.addCategory(name, undefined, employeeData.clientId);
      await refreshCategories();
      toast.success('Category added successfully');
    } catch (error: any) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateCategory = async (id: string, name: string) => {
    if (!employeeData?.clientId) { toast.error('Client information not available'); return; }
    try {
      await categoryService.updateCategory(id, name, undefined, employeeData.clientId);
      await refreshCategories();
      toast.success('Category updated successfully');
    } catch (error: any) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    if (!employeeData?.clientId) { toast.error('Client information not available'); return; }
    try {
      await categoryService.deleteCategory(id, employeeData.clientId);
      await refreshCategories();
      toast.success('Category deleted successfully');
    } catch (error: any) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  // Subcategory operations
  const addSubcategory = async (categoryId: string, name: string) => {
    if (!employeeData?.clientId) { toast.error('Client information not available'); return; }
    try {
      await categoryService.addSubcategory(name, categoryId, undefined, employeeData.clientId);
      const subs = await categoryService.getSubcategories(undefined, employeeData.clientId);
      setSubcategoryMappings(buildSubcategoryMappings(subs));
      toast.success('Subcategory added successfully');
    } catch (error: any) {
      console.error('Error adding subcategory:', error);
      throw error;
    }
  };

  const updateSubcategory = async (categoryId: string, id: string, name: string) => {
    if (!employeeData?.clientId) { toast.error('Client information not available'); return; }
    try {
      await categoryService.updateSubcategory(id, name, categoryId, undefined, employeeData.clientId);
      const subs = await categoryService.getSubcategories(undefined, employeeData.clientId);
      setSubcategoryMappings(buildSubcategoryMappings(subs));
      toast.success('Subcategory updated successfully');
    } catch (error: any) {
      console.error('Error updating subcategory:', error);
      throw error;
    }
  };

  const deleteSubcategory = async (categoryId: string, id: string) => {
    if (!employeeData?.clientId) { toast.error('Client information not available'); return; }
    try {
      await categoryService.deleteSubcategory(id, employeeData.clientId);
      const subs = await categoryService.getSubcategories(undefined, employeeData.clientId);
      setSubcategoryMappings(buildSubcategoryMappings(subs));
      toast.success('Subcategory deleted successfully');
    } catch (error: any) {
      console.error('Error deleting subcategory:', error);
      throw error;
    }
  };

  return {
    categories,
    subcategoryMappings,
    contributingFactors,
    setContributingFactors,
    reportTypes,
    setReportTypes,
    priorities,
    setPriorities,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    loadData,
  };
}
