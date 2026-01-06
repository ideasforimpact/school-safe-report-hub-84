import { supabase } from "@/integrations/supabase/client";

interface School {
    id: string;
    name: string;
}

interface GetSchoolsResponse {
    success: boolean;
    data: School[];
}

export async function getSchoolsList(): Promise<GetSchoolsResponse> {
    const { data, error } = await supabase.functions.invoke<GetSchoolsResponse>(
        'integrate-client-details'
    );

    if (error) {
        console.error('Error fetching schools list:', error);
        throw error;
    }

    return {
        success: data?.success ?? false,
        data: data?.data ?? [],
    };
}

export async function saveClientIntegration(payload: {
    clientId: string;
    targetClientId: string;
    targetClientName: string;
    isLinked: boolean;
    updatedBy: string;
}) {
    const { error } = await supabase
        .from('client_integration')
        .upsert(
            {
                client_id: payload.clientId,
                target_client_id: payload.targetClientId,
                target_client_name: payload.targetClientName,
                is_linked: payload.isLinked,
                active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                updated_by: payload.updatedBy,
            },
            {
                onConflict: 'client_id',
            }
        );

    if (error) {
        console.error('Failed to save client integration', error);
        throw error;
    }
}

export async function fetchClientIntegrations() {
  const { data, error } = await supabase
    .from('client_integration')
    .select(`
      client_id,
      target_client_id,
      target_client_name,
      is_linked
    `);

  if (error) throw error;
  return data ?? [];
}

