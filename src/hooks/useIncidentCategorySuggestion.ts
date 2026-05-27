import { useState, useEffect, useRef } from "react";
import { AiCategorySuggestion, classifyIncident } from "@/services/incidentAiService";

const DEBOUNCE_MS = 1200;
const MIN_LENGTH = 20;

export function useIncidentCategorySuggestion(
  description: string,
  categories: { id: string; name: string }[],
  subcategories: { id: string; name: string; category_id: string | null }[],
) {
  const [suggestions, setSuggestions] = useState<AiCategorySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [noMatch, setNoMatch] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDescRef = useRef<string>("");

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!description || description.trim().length < MIN_LENGTH || categories.length === 0) {
      setSuggestions([]);
      setNoMatch(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      if (description === lastDescRef.current) return;
      lastDescRef.current = description;
      setLoading(true);
      setNoMatch(false);
      try {
        const results = await classifyIncident(description, categories, subcategories);
        setSuggestions(results);
        setNoMatch(results.length === 0);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [description, categories, subcategories]);

  const clearSuggestions = () => {
    setSuggestions([]);
    setNoMatch(false);
  };

  return { suggestions, loading, noMatch, clearSuggestions };
}
