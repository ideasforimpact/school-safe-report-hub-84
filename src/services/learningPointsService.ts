import { supabase } from '@/integrations/supabase/client';

export interface LearningPointRecord {
  id: string; // incident row id (acts as learning point id for now)
  incidentId: string; // same as ticket_id for display
  category: string;
  subcategory: string;
  learningPoints: string;
  createdBy: string;
  createdAt: Date;
}

export interface LearningPointFilters {
  search?: string; // matches incidentId, category, subcategory, learningPoints
  category?: string; // category name
  subcategory?: string; // subcategory name
}

export interface PaginatedLearningPoints {
  data: LearningPointRecord[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  categories: string[];
  subcategories: string[];
}

export async function fetchLearningPoints(
  clientId: string,
  page = 1,
  pageSize = 10,
  filters: LearningPointFilters = {}
): Promise<PaginatedLearningPoints> {
  const anyClient = supabase as any;
  // Base select with required joins
  let query = anyClient
    .from('incidents')
    .select(
      `id, ticket_id, learning_points, created_at,
       incident_categories:category_id(name),
       incident_subcategories:subcategory_id(name),
       created_by_employee:employees!created_by(id, first_name, last_name)`,
      { count: 'exact' }
    )
    .eq('client_id', clientId)
    .not('learning_points', 'is', null)
    .neq('learning_points', '')
    .order('created_at', { ascending: false });

  // Note: For simplicity and reliability across DBs, do text filters client-side
  const { data, error } = await query;
  if (error) {
    throw error;
  }

  const records: LearningPointRecord[] = (data || []).map((row: any) => ({
    id: row.id,
    incidentId: row.ticket_id,
    category: row.incident_categories?.name || 'Unknown',
    subcategory: row.incident_subcategories?.name || '',
    learningPoints: row.learning_points || '',
    createdBy: row.created_by_employee
      ? `${row.created_by_employee.first_name} ${row.created_by_employee.last_name}`
      : 'Unknown',
    createdAt: new Date(row.created_at)
  }));

  // Apply client-side filters (search, category, subcategory)
  const search = (filters.search || '').toLowerCase();
  const categoryFilter = (filters.category || '').toLowerCase();
  const subcategoryFilter = (filters.subcategory || '').toLowerCase();

  const filtered = records.filter((r) => {
    const matchesSearch = !search
      || r.incidentId.toLowerCase().includes(search)
      || r.learningPoints.toLowerCase().includes(search)
      || r.category.toLowerCase().includes(search)
      || r.subcategory.toLowerCase().includes(search);

    const matchesCategory = !categoryFilter || r.category.toLowerCase() === categoryFilter;
    const matchesSubcategory = !subcategoryFilter || r.subcategory.toLowerCase() === subcategoryFilter;

    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  // When filters are applied client-side, recompute paging on filtered set
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageData = filtered.slice(start, end);

  const categories = Array.from(new Set(records.map(r => r.category))).filter(Boolean);
  const subcategories = Array.from(new Set(records.map(r => r.subcategory))).filter(Boolean);

  return {
    data: pageData,
    totalCount: filtered.length,
    currentPage: page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
    categories,
    subcategories
  };
}


