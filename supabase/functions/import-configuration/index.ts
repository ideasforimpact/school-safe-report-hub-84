import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CategoryPayload {
  id?: string; // empty in templates
  name: string;
  description?: string;
  client_id?: string; // empty in templates
  subcategories?: Array<{
    id?: string;
    name: string;
    description?: string;
    category_id?: string;
    client_id?: string;
  }>
}

interface ContributingFactorPayload {
  id?: string;
  name: string;
  description?: string;
  weight?: string | null;
  client_id?: string;
}

interface ReportTypePayload {
  id?: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
  client_id?: string;
}

interface PriorityPayload {
  id?: string;
  name: string;
  description?: string | null;
  color?: string | null;
  weight?: number | null;
  is_active?: boolean;
  client_id?: string;
}

interface AssessmentTemplatePayload {
  title: string;
  description?: string | null;
  category_id?: string | null;
  category_name?: string | null; // Look up category_id from template_categories table
  questions?: unknown;
  is_active?: boolean;
  client_id?: string | null;
}

interface EduResourcePayload {
  id?: string; // empty in templates
  title: string;
  description?: string;
  category?: string;
  tags?: string[] | null;
  document_url?: string;
  created_at?: string;
  updated_at?: string;
  uploaded_by?: string; // empty in templates
  client_type_id?: string; // empty in templates
}

interface ImportRequest {
  client_id: string;
  categories?: CategoryPayload[];
  contributing_factors?: ContributingFactorPayload[];
  report_types?: ReportTypePayload[];
  priorities?: PriorityPayload[];
  forms?: Array<{
    title: string;
    description?: string | null;
    is_active?: boolean;
    client_logo?: string | null;
    fields: unknown;
  }>;
  assessment_templates?: AssessmentTemplatePayload[];
  edu_resources?: EduResourcePayload[];
  // Optional: when true, load default templates from /templates
  use_defaults?: boolean;
}

type PerTableLog = {
  inserted_ids: string[];
  already_existing_ids: string[];
  errors: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

    const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

  let responseStatus = 'success';
  let responseCode = 200;

  const tableLogs: Record<string, PerTableLog> = {
    categories: { inserted_ids: [], already_existing_ids: [], errors: [] },
    sub_categories: { inserted_ids: [], already_existing_ids: [], errors: [] },
    contributing_factors: { inserted_ids: [], already_existing_ids: [], errors: [] },
    report_types: { inserted_ids: [], already_existing_ids: [], errors: [] },
    priorities: { inserted_ids: [], already_existing_ids: [], errors: [] },
    custom_forms: { inserted_ids: [], already_existing_ids: [], errors: [] },
    assessment_templates: { inserted_ids: [], already_existing_ids: [], errors: [] },
    backoffice_edusafe_resource: { inserted_ids: [], already_existing_ids: [], errors: [] },
  };

  try {
    const body = (await req.json()) as ImportRequest;
    const clientId = body.client_id;

    if (!clientId) {
      responseStatus = 'failed';
      responseCode = 400;
      return new Response(JSON.stringify({ error: 'client_id is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Expect templates to be sent in the request body from the UI
    const contributingFactors = body.contributing_factors;
    const reportTypes = body.report_types;
    const priorities = body.priorities;
    const categories = body.categories;
    const forms = body.forms;
    const assessmentTemplates = body.assessment_templates;
    const eduResources = body.edu_resources;

    console.log('Received forms:', forms ? `${forms.length} forms` : 'undefined');
    console.log('Received assessment templates:', assessmentTemplates ? `${assessmentTemplates.length} assessment templates` : 'undefined');
    console.log('Received edu resources:', eduResources ? `${eduResources.length} edu resources` : 'undefined');

    // Validate required templates
    const missing: string[] = [];
    if (!Array.isArray(categories) || categories.length === 0) missing.push('categories');
    if (!Array.isArray(contributingFactors) || contributingFactors.length === 0) missing.push('contributing_factors');
    if (!Array.isArray(reportTypes) || reportTypes.length === 0) missing.push('report_types');
    if (!Array.isArray(priorities) || priorities.length === 0) missing.push('priorities');

    if (missing.length > 0) {
      responseStatus = 'failed';
      responseCode = 400;
      const message = `Missing template(s): ${missing.join(', ')}`;
      // Log a minimal failure entry
      await supabase.from('configuration_import_logs').insert({
        client_id: clientId,
        response_status: responseStatus,
        response_code: responseCode,
        log: { error: message }
      });
      return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    

    // Insert/Reuse Contributing Factors
    if (Array.isArray(contributingFactors) && contributingFactors.length > 0) {
      for (const factor of contributingFactors) {
        const name = factor.name?.trim();
        if (!name) continue;
        // Check existing by (client_id, lower(name))
        const { data: existing, error: findErr } = await supabase
          .from('contributing_factors')
          .select('id')
          .eq('client_id', clientId)
          .eq('name', name);
        if (!findErr && existing && existing.length > 0) {
          tableLogs.contributing_factors.already_existing_ids.push(existing[0].id);
          continue;
        }

        const record = {
          name,
          description: factor.description ?? null,
          // Coerce weight to null unless string (many schemas store text like 'Low'|'Medium'|'High')
          weight: typeof (factor as any).weight === 'string' ? (factor as any).weight : null,
          client_id: clientId,
        };
        const { data, error } = await supabase
          .from('contributing_factors')
          .insert(record)
          .select('id')
          .single();
        if (error) {
          tableLogs.contributing_factors.errors.push(error.message);
          responseStatus = 'failed';
          responseCode = 207; // multi-status
        } else if (data?.id) {
          tableLogs.contributing_factors.inserted_ids.push(data.id);
        }
      }
    }

    // Insert/Reuse Report Types
    if (Array.isArray(reportTypes) && reportTypes.length > 0) {
      for (const rt of reportTypes) {
        const name = rt.name?.trim();
        if (!name) continue;
        const { data: existing, error: findErr } = await supabase
          .from('incident_report_types')
          .select('id')
          .eq('client_id', clientId)
          .eq('name', name);
        if (!findErr && existing && existing.length > 0) {
          tableLogs.report_types.already_existing_ids.push(existing[0].id);
          continue;
        }
        const record = {
          name,
          description: rt.description ?? null,
          is_active: rt.is_active ?? true,
          client_id: clientId,
        };
        const { data, error } = await supabase
          .from('incident_report_types')
          .insert(record)
          .select('id')
          .single();
        if (error) {
          tableLogs.report_types.errors.push(error.message);
          responseStatus = 'failed';
          responseCode = 207;
        } else if (data?.id) {
          tableLogs.report_types.inserted_ids.push(data.id);
        }
      }
    }

    // Insert/Reuse Priorities
    if (Array.isArray(priorities) && priorities.length > 0) {
      for (const pr of priorities) {
        const name = pr.name?.trim();
        if (!name) continue;
        const { data: existing, error: findErr } = await supabase
          .from('incident_priorities')
          .select('id')
          .eq('client_id', clientId)
          .eq('name', name);
        if (!findErr && existing && existing.length > 0) {
          tableLogs.priorities.already_existing_ids.push(existing[0].id);
          continue;
        }
        const record = {
          name,
          description: pr.description ?? null,
          color: pr.color ?? null,
          weight: pr.weight ?? null,
          is_active: pr.is_active ?? true,
          client_id: clientId,
        };
        const { data, error } = await supabase
          .from('incident_priorities')
          .insert(record)
          .select('id')
          .single();
        if (error) {
          tableLogs.priorities.errors.push(error.message);
          responseStatus = 'failed';
          responseCode = 207;
        } else if (data?.id) {
          tableLogs.priorities.inserted_ids.push(data.id);
        }
      }
    }

    // Insert/Reuse Categories and Subcategories
    if (Array.isArray(categories) && categories.length > 0) {
      for (const cat of categories) {
        const catName = cat.name?.trim();
        if (!catName) continue;
        // Check existing category
        const { data: existCat, error: findCatErr } = await supabase
          .from('incident_categories')
          .select('id')
          .eq('client_id', clientId)
          .eq('name', catName);
        let categoryId: string | null = null;
        if (!findCatErr && existCat && existCat.length > 0) {
          categoryId = existCat[0].id;
          tableLogs.categories.already_existing_ids.push(categoryId);
        } else {
          const catRecord = {
            name: catName,
            description: cat.description ?? null,
            client_id: clientId,
          };
          const { data: insertedCat, error: catError } = await supabase
            .from('incident_categories')
            .insert(catRecord)
            .select('id')
            .single();
          if (catError || !insertedCat?.id) {
            tableLogs.categories.errors.push(catError?.message || 'Unknown category insert error');
            responseStatus = 'failed';
            responseCode = 207;
            continue;
          }
          categoryId = insertedCat.id;
          tableLogs.categories.inserted_ids.push(categoryId);
        }

        // Subcategories for this category
        if (categoryId && Array.isArray(cat.subcategories) && cat.subcategories.length > 0) {
          for (const sub of cat.subcategories) {
            const subName = sub.name?.trim();
            if (!subName) continue;
            const { data: existSub, error: findSubErr } = await supabase
              .from('incident_subcategories')
              .select('id')
              .eq('client_id', clientId)
              .eq('category_id', categoryId)
              .eq('name', subName);
            if (!findSubErr && existSub && existSub.length > 0) {
              tableLogs.sub_categories.already_existing_ids.push(existSub[0].id);
              continue;
            }
            const subRecord = {
              name: subName,
              description: sub.description ?? null,
              category_id: categoryId,
              client_id: clientId,
            };
            const { data: insertedSub, error: subError } = await supabase
              .from('incident_subcategories')
              .insert(subRecord)
              .select('id')
              .single();
            if (subError) {
              tableLogs.sub_categories.errors.push(subError.message);
              responseStatus = 'failed';
              responseCode = 207;
            } else if (insertedSub?.id) {
              tableLogs.sub_categories.inserted_ids.push(insertedSub.id);
            }
          }
        }
      }
    }

    // Insert/Reuse Custom Forms
    if (Array.isArray(forms) && forms.length > 0) {
      console.log(`Processing ${forms.length} forms for client ${clientId}`);
      // Try to fetch client logo once (whatever column exists)
      let clientLogo: string | null = null;
      try {
        const { data: clientData } = await supabase
          .from('clients')
          .select('logo, client_logo, logo_url')
          .eq('id', clientId)
          .single();
        clientLogo = (clientData as any)?.client_logo || (clientData as any)?.logo || (clientData as any)?.logo_url || null;
      } catch (_) {}

      for (const form of forms) {
        const title = form.title?.trim();
        if (!title) continue;
        // Check existing by (client_id, title)
        const { data: existForm, error: findFormErr } = await supabase
          .from('custom_forms')
          .select('id')
          .eq('client_id', clientId)
          .eq('title', title);
        if (!findFormErr && existForm && existForm.length > 0) {
          tableLogs.custom_forms.already_existing_ids.push(existForm[0].id);
          continue;
        }

        const record: any = {
          client_id: clientId,
          title,
          description: form.description ?? null,
          is_active: form.is_active ?? true,
          fields: form.fields,
          client_logo: form.client_logo ?? clientLogo ?? null
        };

        const { data, error } = await supabase
          .from('custom_forms')
          .insert(record)
          .select('id')
          .single();
        if (error) {
          console.log(`Error inserting form "${title}":`, error.message);
          tableLogs.custom_forms.errors.push(error.message);
          responseStatus = 'failed';
          responseCode = 207;
        } else if (data?.id) {
          console.log(`Successfully inserted form "${title}" with ID: ${data.id}`);
          tableLogs.custom_forms.inserted_ids.push(data.id);
        }
      }
    }

    // Insert/Reuse Assessment Templates
    if (Array.isArray(assessmentTemplates) && assessmentTemplates.length > 0) {
      console.log(`Processing ${assessmentTemplates.length} assessment templates for client ${clientId}`);
      
      // Find super admin employee for created_by field
      let superAdminId: string | null = null;
      try {
        const { data: superAdminData } = await supabase
          .from('employees')
          .select('id')
          .eq('client_id', clientId)
          .eq('is_super_admin', true)
          .single();
        superAdminId = superAdminData?.id || null;
        console.log(`Found super admin ID: ${superAdminId}`);
      } catch (error) {
        console.log('No super admin found for client:', clientId);
      }

      for (const template of assessmentTemplates) {
        const title = template.title?.trim();
        if (!title) continue;
        
        // Check existing by (client_id, title)
        const { data: existTemplate, error: findTemplateErr } = await supabase
          .from('assessment_templates')
          .select('id')
          .eq('client_id', clientId)
          .eq('title', title);
        if (!findTemplateErr && existTemplate && existTemplate.length > 0) {
          tableLogs.assessment_templates.already_existing_ids.push(existTemplate[0].id);
          continue;
        }

        // Look up category_id from template_categories table if category_name is provided
        let categoryId: string | null = null;
        if (template.category_name) {
          const categoryName = template.category_name.trim();
          const { data: categoryData, error: categoryErr } = await supabase
            .from('template_categories')
            .select('id')
            .eq('name', categoryName)
            .single();
          if (!categoryErr && categoryData?.id) {
            categoryId = categoryData.id;
            console.log(`Mapped category_name "${categoryName}" to category_id: ${categoryId}`);
          } else {
            console.log(`Warning: Could not find category with name "${categoryName}" in template_categories table`);
          }
        } else if (template.category_id) {
          // Fallback to direct category_id if provided (for backward compatibility)
          categoryId = template.category_id;
        }

        const record: any = {
          client_id: clientId,
          title,
          description: template.description ?? null,
          category_id: categoryId,
          questions: template.questions ?? null,
          is_active: template.is_active ?? true,
          created_by: superAdminId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('assessment_templates')
          .insert(record)
          .select('id')
          .single();
        if (error) {
          console.log(`Error inserting assessment template "${title}":`, error.message);
          tableLogs.assessment_templates.errors.push(error.message);
          responseStatus = 'failed';
          responseCode = 207;
        } else if (data?.id) {
          console.log(`Successfully inserted assessment template "${title}" with ID: ${data.id}`);
          tableLogs.assessment_templates.inserted_ids.push(data.id);
        }
      }
    }

    // Insert/Reuse Edu Resources
    if (Array.isArray(eduResources) && eduResources.length > 0) {
      console.log(`Processing ${eduResources.length} edu resources for client ${clientId}`);
      
      // Get current user from auth header
      let uploadedById: string | null = null;
      try {
        const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
        if (authHeader) {
          const token = authHeader.replace('Bearer ', '');
          const { data: { user }, error: userError } = await supabase.auth.getUser(token);
          if (!userError && user) {
            // Get backoffice_users id from auth_user_id
            const { data: backofficeUser, error: backofficeError } = await supabase
              .from('backoffice_users')
              .select('id')
              .eq('auth_user_id', user.id)
              .single();
            if (!backofficeError && backofficeUser?.id) {
              uploadedById = backofficeUser.id;
              console.log(`Found backoffice user ID: ${uploadedById}`);
            } else {
              console.log('No backoffice user found for auth_user_id:', user.id);
            }
          }
        }
      } catch (error) {
        console.log('Error getting current user:', error);
      }

      // Get client_type_id where key = 'school'
      let clientTypeId: string | null = null;
      try {
        const { data: clientTypeData, error: clientTypeError } = await supabase
          .from('client_type')
          .select('id')
          .eq('key', 'school')
          .single();
        if (!clientTypeError && clientTypeData?.id) {
          clientTypeId = clientTypeData.id;
          console.log(`Found client_type_id for 'school': ${clientTypeId}`);
        } else {
          console.log('Warning: Could not find client_type with key "school"');
        }
      } catch (error) {
        console.log('Error getting client_type:', error);
      }

      for (const resource of eduResources) {
        const title = resource.title?.trim();
        if (!title) continue;
        
        // Check existing by (client_type_id, title)
        const { data: existResource, error: findResourceErr } = await supabase
          .from('backoffice_edusafe_resource')
          .select('id')
          .eq('client_type_id', clientTypeId)
          .eq('title', title);
        if (!findResourceErr && existResource && existResource.length > 0) {
          tableLogs.backoffice_edusafe_resource.already_existing_ids.push(existResource[0].id);
          continue;
        }

        // Generate UUID for id
        const resourceId = crypto.randomUUID();

        // Replace 'client_type_id' placeholder in document_url with actual client_type_id UUID
        let documentUrl = resource.document_url ?? null;
        if (documentUrl && clientTypeId) {
          documentUrl = documentUrl.replace(/client_type_id/g, clientTypeId);
        }

        const record: any = {
          id: resourceId,
          title,
          description: resource.description ?? null,
          category: resource.category ?? null,
          tags: resource.tags ?? null,
          document_url: documentUrl,
          created_at: resource.created_at || new Date().toISOString(),
          updated_at: resource.updated_at || new Date().toISOString(),
          uploaded_by: uploadedById,
          client_type_id: clientTypeId,
        };

        const { data, error } = await supabase
          .from('backoffice_edusafe_resource')
          .insert(record)
          .select('id')
          .single();
        if (error) {
          console.log(`Error inserting edu resource "${title}":`, error.message);
          tableLogs.backoffice_edusafe_resource.errors.push(error.message);
          responseStatus = 'failed';
          responseCode = 207;
        } else if (data?.id) {
          console.log(`Successfully inserted edu resource "${title}" with ID: ${data.id}`);
          tableLogs.backoffice_edusafe_resource.inserted_ids.push(data.id);
        }
      }
    }

    // Write log to intermediate table
    const logPayload = {
      client_id: clientId,
      response_status: responseStatus,
      response_code: responseCode,
      log: tableLogs,
    } as const;

    await supabase.from('configuration_import_logs').insert(logPayload);

    return new Response(
      JSON.stringify({ status: responseStatus, code: responseCode, details: tableLogs }),
      { status: responseCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    const errResp = { status: 'failed', code: 500, error: e?.message || 'Unknown error' };
    return new Response(JSON.stringify(errResp), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


