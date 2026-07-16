import { supabase } from "@/integrations/supabase/client";

type IncidentConfigResource =
  | "categories"
  | "subcategories"
  | "priorities"
  | "reportTypes"
  | "contributingFactors";

type IncidentConfigOperation =
  | "list"
  | "checkDuplicate"
  | "create"
  | "update"
  | "delete"
  | "toggleStatus";

type IncidentConfigPayload = {
  resource: IncidentConfigResource;
  operation: IncidentConfigOperation;
  clientId?: string;
  clientTypeId?: string;
  id?: string;
  categoryId?: string;
  excludeId?: string;
  activeOnly?: boolean;
  payload?: Record<string, unknown>;
};

export async function invokeIncidentConfig<T>(body: IncidentConfigPayload): Promise<T> {
  const { data, error } = await supabase.functions.invoke("incident-configuration", {
    body,
  });

  if (error) {
    const context = (error as Record<string, unknown>).context;
    if (context && typeof (context as Record<string, unknown>).json === "function") {
      try {
        const errorBody = await (context as { json: () => Promise<Record<string, string>> }).json();
        throw new Error(errorBody?.message || errorBody?.error || error.message);
      } catch (parseError) {
        const typedParseError = parseError as { message?: string };
        if (typedParseError?.message && parseError !== error) {
          throw parseError;
        }
      }
    }

    throw new Error(error.message || "Failed to call incident configuration service");
  }

  if (data?.error) {
    throw new Error(data.message || data.error);
  }

  return (data?.data ?? data) as T;
}
