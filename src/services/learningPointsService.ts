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

const learningPointsInflight = new Map<string, Promise<unknown[]>>();

export async function fetchLearningPoints(
  clientId: string,
  page = 1,
  pageSize = 10,
  filters: LearningPointFilters = {}
): Promise<PaginatedLearningPoints> {
  // Fetch (and de-dupe concurrent fetches) via the fetch-incidents edge function;
  // search/category/subcategory filters and pagination are still applied client-side below.
  let request = learningPointsInflight.get(clientId);
  if (!request) {
    request = (async () => {
      const { data, error } = await supabase.functions.invoke('fetch-incidents', {
        body: { operation: 'get_learning_points', clientId },
      });

      if (error) throw error;
      if (!data?.success) throw new Error('Failed to fetch learning points');

      return (data.data || []) as unknown[];
    })();

    learningPointsInflight.set(clientId, request);
    request.finally(() => learningPointsInflight.delete(clientId));
  }

  const data = await request;

  interface LearningPointQueryRow {
    id: string;
    ticket_id: string;
    learning_points: string | null;
    created_at: string;
    incident_categories: { name: string } | null;
    incident_subcategories: { name: string } | null;
    created_by_employee: { id: string; first_name: string; last_name: string } | null;
  }

  const records: LearningPointRecord[] = (data as LearningPointQueryRow[] || []).map((row) => ({
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


