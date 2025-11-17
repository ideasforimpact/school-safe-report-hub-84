
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { getSupabaseUrl, getSupabaseAnonKey } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
  maxRating?: number;
  allowMultiple?: boolean;
  maxFiles?: number;
  allowedFileTypes?: string[];
}

interface CustomFormPayload {
  client_id: string;
  title?: string;
  description?: string;
  fields?: FormField[];
  is_active?: boolean;
  created_by?: string;
  client_logo?: string | null;
}

async function fetchClientLogo(supabaseClient: any, clientId: string): Promise<string | null> {
  const { data, error } = await supabaseClient
    .from('clients')
    .select('logo')
    .eq('id', clientId)
    .maybeSingle();
  if (error) {
    console.log('fetchClientLogo error (non-fatal):', error.message);
    return null;
  }
  return (data as any)?.logo || null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { operation, formId, ...payload } = await req.json();
    
    // Validate that client_id is present in payload for all operations
    if (!payload.client_id) {
      return new Response(
        JSON.stringify({ 
          error: 'client_id is required for all custom forms operations',
          code: 'MISSING_CLIENT_ID'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Custom forms operation: ${operation} for client: ${payload.client_id}`);

    let result;

    switch (operation) {
      case 'create':
        result = await createForm(supabaseClient, payload as CustomFormPayload);
        break;
      case 'update':
        if (!formId) {
          return new Response(
            JSON.stringify({ error: 'formId is required for update operation' }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        result = await updateForm(supabaseClient, formId, payload as CustomFormPayload);
        break;
      case 'delete':
        if (!formId) {
          return new Response(
            JSON.stringify({ error: 'formId is required for delete operation' }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        result = await deleteForm(supabaseClient, formId, payload.client_id);
        break;
      case 'deactivate':
        if (!formId) {
          return new Response(
            JSON.stringify({ error: 'formId is required for deactivate operation' }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        result = await deactivateForm(supabaseClient, formId, payload.client_id);
        break;
      case 'activate':
        if (!formId) {
          return new Response(
            JSON.stringify({ error: 'formId is required for activate operation' }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        result = await activateForm(supabaseClient, formId, payload.client_id);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid operation. Supported operations: create, update, delete, deactivate, activate' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in custom-forms-management function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function createForm(supabaseClient: any, payload: CustomFormPayload) {
  console.log('Creating form for client:', payload.client_id);

  const resolvedLogo = payload.client_logo ?? await fetchClientLogo(supabaseClient, payload.client_id);
  
  const { data, error } = await supabaseClient
    .from('custom_forms')
    .insert([{
      client_id: payload.client_id,
      title: payload.title,
      description: payload.description,
      fields: payload.fields || [],
      is_active: payload.is_active !== undefined ? payload.is_active : true,
      created_by: payload.created_by,
      client_logo: resolvedLogo
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating form:', error);
    throw new Error(`Failed to create form: ${error.message}`);
  }

  return { success: true, data, message: 'Form created successfully' };
}

async function updateForm(supabaseClient: any, formId: string, payload: CustomFormPayload) {
  console.log('Updating form:', formId, 'for client:', payload.client_id);

  // First verify the form belongs to the client
  const { data: existingForm, error: fetchError } = await supabaseClient
    .from('custom_forms')
    .select('client_id, client_logo')
    .eq('id', formId)
    .single();

  if (fetchError) {
    console.error('Error fetching form:', fetchError);
    throw new Error(`Form not found: ${fetchError.message}`);
  }

  if (existingForm.client_id !== payload.client_id) {
    throw new Error('Unauthorized: Form does not belong to this client');
  }

  const updateData: any = {};
  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.description !== undefined) updateData.description = payload.description;
  if (payload.fields !== undefined) updateData.fields = payload.fields;
  if (payload.is_active !== undefined) updateData.is_active = payload.is_active;

  // If caller explicitly sends null, populate from clients.logo
  if (payload.client_logo === null) {
    updateData.client_logo = await fetchClientLogo(supabaseClient, payload.client_id);
  }
  // If caller provided a value (string), use it
  if (typeof payload.client_logo === 'string') {
    updateData.client_logo = payload.client_logo;
  }

  const { data, error } = await supabaseClient
    .from('custom_forms')
    .update(updateData)
    .eq('id', formId)
    .eq('client_id', payload.client_id)
    .select()
    .single();

  if (error) {
    console.error('Error updating form:', error);
    throw new Error(`Failed to update form: ${error.message}`);
  }

  return { success: true, data, message: 'Form updated successfully' };
}

async function deleteForm(supabaseClient: any, formId: string, clientId: string) {
  console.log('Deleting form:', formId, 'for client:', clientId);

  // First verify the form belongs to the client
  const { data: existingForm, error: fetchError } = await supabaseClient
    .from('custom_forms')
    .select('client_id')
    .eq('id', formId)
    .single();

  if (fetchError) {
    console.error('Error fetching form:', fetchError);
    throw new Error(`Form not found: ${fetchError.message}`);
  }

  if (existingForm.client_id !== clientId) {
    throw new Error('Unauthorized: Form does not belong to this client');
  }

  const { error } = await supabaseClient
    .from('custom_forms')
    .delete()
    .eq('id', formId)
    .eq('client_id', clientId);

  if (error) {
    console.error('Error deleting form:', error);
    throw new Error(`Failed to delete form: ${error.message}`);
  }

  return { success: true, message: 'Form deleted successfully' };
}

async function deactivateForm(supabaseClient: any, formId: string, clientId: string) {
  console.log('Deactivating form:', formId, 'for client:', clientId);

  // First verify the form belongs to the client
  const { data: existingForm, error: fetchError } = await supabaseClient
    .from('custom_forms')
    .select('client_id')
    .eq('id', formId)
    .single();

  if (fetchError) {
    console.error('Error fetching form:', fetchError);
    throw new Error(`Form not found: ${fetchError.message}`);
  }

  if (existingForm.client_id !== clientId) {
    throw new Error('Unauthorized: Form does not belong to this client');
  }

  const { data, error } = await supabaseClient
    .from('custom_forms')
    .update({ is_active: false })
    .eq('id', formId)
    .eq('client_id', clientId)
    .select()
    .single();

  if (error) {
    console.error('Error deactivating form:', error);
    throw new Error(`Failed to deactivate form: ${error.message}`);
  }

  return { success: true, data, message: 'Form deactivated successfully' };
}

async function activateForm(supabaseClient: any, formId: string, clientId: string) {
  console.log('Activating form:', formId, 'for client:', clientId);

  // First verify the form belongs to the client
  const { data: existingForm, error: fetchError } = await supabaseClient
    .from('custom_forms')
    .select('client_id')
    .eq('id', formId)
    .single();

  if (fetchError) {
    console.error('Error fetching form:', fetchError);
    throw new Error(`Form not found: ${fetchError.message}`);
  }

  if (existingForm.client_id !== clientId) {
    throw new Error('Unauthorized: Form does not belong to this client');
  }

  const { data, error } = await supabaseClient
    .from('custom_forms')
    .update({ is_active: true })
    .eq('id', formId)
    .eq('client_id', clientId)
    .select()
    .single();

  if (error) {
    console.error('Error activating form:', error);
    throw new Error(`Failed to activate form: ${error.message}`);
  }

  return { success: true, data, message: 'Form activated successfully' };
}
