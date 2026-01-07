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
  // 1️⃣ Check if record exists
  const { data: existing, error: fetchError } = await supabase
    .from('client_integration')
    .select('id')
    .eq('client_id', payload.clientId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (!existing) {
    const { error } = await supabase.from('client_integration').insert({
      client_id: payload.clientId,
      target_client_id: payload.targetClientId,
      target_client_name: payload.targetClientName,
      is_linked: payload.isLinked,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: payload.updatedBy,
    });

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('client_integration')
      .update({
        target_client_id: payload.targetClientId,
        target_client_name: payload.targetClientName,
        is_linked: payload.isLinked,
        updated_at: new Date().toISOString(),
        updated_by: payload.updatedBy,
      })
      .eq('client_id', payload.clientId);

    if (error) throw error;
  }
}


