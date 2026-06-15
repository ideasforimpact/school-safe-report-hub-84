import { supabase } from "@/integrations/supabase/client";

export interface AiCategorySuggestion {
  categoryId: string;
  categoryName: string;
  subcategoryId: string | null;
  subcategoryName: string | null;
  rank: number;
}

export async function classifyIncident(
  description: string,
  categories: { id: string; name: string }[],
  subcategories: { id: string; name: string; category_id: string | null }[],
): Promise<AiCategorySuggestion[]> {
  if (!description || description.trim().length < 10) return [];

  // Build the nested structure classify-incident expects
  const payload = categories.map((cat) => ({
    name: cat.name,
    subcategories: subcategories
      .filter((sub) => sub.category_id === cat.id)
      .map((sub) => ({ name: sub.name })),
  }));

  const { data, error } = await supabase.functions.invoke("classify-incident", {
    body: { description, categories: payload },
  });

  if (error || !data?.suggestions) {
    console.error("classify-incident failed:", error || data?.error);
    return [];
  }

  // Map names back to IDs
  const results: AiCategorySuggestion[] = [];
  for (const suggestion of data.suggestions) {
    const matchedCat = categories.find((c) => c.name === suggestion.category);
    if (!matchedCat) continue;

    const topSub = suggestion.subcategory?.[0];
    const matchedSub = topSub
      ? subcategories.find(
          (s) => s.name === topSub.name && s.category_id === matchedCat.id,
        )
      : null;

    results.push({
      categoryId: matchedCat.id,
      categoryName: matchedCat.name,
      subcategoryId: matchedSub?.id ?? null,
      subcategoryName: matchedSub?.name ?? null,
      rank: suggestion.rank,
    });
  }

  return results.sort((a, b) => a.rank - b.rank);
}
