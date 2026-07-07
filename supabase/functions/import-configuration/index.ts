import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type PerTableLog = {
  inserted_ids: string[];
  already_existing_ids: string[];
  errors: string[];
}

interface ClientLogoRow {
  logo?: string | null;
  client_logo?: string | null;
  logo_url?: string | null;
}

interface CustomFormRecord {
  client_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  fields: unknown;
  client_logo: string | null;
}

interface AssessmentTemplateRecord {
  client_id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  questions: unknown;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface EduResourceRecord {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  document_url: string | null;
  created_at: string;
  updated_at: string;
  uploaded_by: string | null;
  client_type_id: string | null;
}

interface GroupEmployeeRow {
  employee_id: string;
}

serve(async (req) => {
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
    const body = await req.json();
    const clientId: string = body.client_id;
    const types: { type_key: string; templates: any }[] = body.types;

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'client_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!types || !Array.isArray(types) || types.length === 0) {
      return new Response(
        JSON.stringify({ error: 'types array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    for (const { type_key: typeKey, templates } of types) {
    // Resolve client_type_id for the given type key
    const { data: clientTypeRow } = await supabase
      .from('client_type').select('id').eq('key', typeKey).single();
    const clientTypeId: string | null = clientTypeRow?.id || null;

        const record = {
          name,
          description: factor.description ?? null,
          // Coerce weight to null unless string (many schemas store text like 'Low'|'Medium'|'High')
          weight: typeof factor.weight === 'string' ? factor.weight : null,
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
      const { data, error } = await supabase
        .from('contributing_factors')
        .insert({ name, description: factor.description ?? null, weight: null, client_id: clientId, client_type_id: clientTypeId })
        .select('id').single();
      if (error) { tableLogs.contributing_factors.errors.push(error.message); responseStatus = 'failed'; responseCode = 207; }
      else if (data?.id) tableLogs.contributing_factors.inserted_ids.push(data.id);
    }

    // ── Report Types ──────────────────────────────────────────────────────
    for (const rt of templates.report_types ?? []) {
      const name = rt.name?.trim();
      if (!name) continue;
      const { data: existing } = await supabase
        .from('incident_report_types').select('id')
        .eq('client_id', clientId).eq('name', name).eq('client_type_id', clientTypeId);
      if (existing && existing.length > 0) {
        tableLogs.report_types.already_existing_ids.push(existing[0].id);
        continue;
      }
      const { data, error } = await supabase
        .from('incident_report_types')
        .insert({ name, description: rt.description ?? null, is_active: rt.is_active ?? true, client_id: clientId, client_type_id: clientTypeId })
        .select('id').single();
      if (error) { tableLogs.report_types.errors.push(error.message); responseStatus = 'failed'; responseCode = 207; }
      else if (data?.id) tableLogs.report_types.inserted_ids.push(data.id);
    }

    // ── Priorities ────────────────────────────────────────────────────────
    for (const pr of templates.priorities ?? []) {
      const name = pr.name?.trim();
      if (!name) continue;
      const { data: existing } = await supabase
        .from('incident_priorities').select('id')
        .eq('client_id', clientId).eq('name', name).eq('client_type_id', clientTypeId);
      if (existing && existing.length > 0) {
        tableLogs.priorities.already_existing_ids.push(existing[0].id);
        continue;
      }
      const { data, error } = await supabase
        .from('incident_priorities')
        .insert({ name, description: pr.description ?? null, color: pr.color ?? null, weight: pr.weight ?? null, is_active: pr.is_active ?? true, client_id: clientId, client_type_id: clientTypeId })
        .select('id').single();
      if (error) { tableLogs.priorities.errors.push(error.message); responseStatus = 'failed'; responseCode = 207; }
      else if (data?.id) tableLogs.priorities.inserted_ids.push(data.id);
    }

    // ── Categories + Subcategories ────────────────────────────────────────
    for (const cat of templates.categories ?? []) {
      const catName = cat.name?.trim();
      if (!catName) continue;
      const { data: existCat } = await supabase
        .from('incident_categories').select('id')
        .eq('client_id', clientId).eq('name', catName).eq('client_type_id', clientTypeId);
      let categoryId: string | null = null;
      if (existCat && existCat.length > 0) {
        categoryId = existCat[0].id;
        tableLogs.categories.already_existing_ids.push(categoryId);
      } else {
        const { data: insertedCat, error: catError } = await supabase
          .from('incident_categories')
          .insert({ name: catName, description: cat.description ?? null, client_id: clientId, client_type_id: clientTypeId })
          .select('id').single();
        if (catError || !insertedCat?.id) {
          tableLogs.categories.errors.push(catError?.message || 'Unknown category insert error');
          responseStatus = 'failed'; responseCode = 207;
          continue;
        }
        categoryId = insertedCat.id;
        tableLogs.categories.inserted_ids.push(categoryId);
      }

      if (categoryId && Array.isArray(cat.subcategories)) {
        for (const sub of cat.subcategories) {
          const subName = sub.name?.trim();
          if (!subName) continue;
          const { data: existSub } = await supabase
            .from('incident_subcategories').select('id')
            .eq('client_id', clientId).eq('category_id', categoryId).eq('name', subName);
          if (existSub && existSub.length > 0) {
            tableLogs.sub_categories.already_existing_ids.push(existSub[0].id);
            continue;
          }
          const { data: insertedSub, error: subError } = await supabase
            .from('incident_subcategories')
            .insert({ name: subName, description: sub.description ?? null, category_id: categoryId, client_id: clientId, client_type_id: clientTypeId })
            .select('id').single();
          if (subError) { tableLogs.sub_categories.errors.push(subError.message); responseStatus = 'failed'; responseCode = 207; }
          else if (insertedSub?.id) tableLogs.sub_categories.inserted_ids.push(insertedSub.id);
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
        const clientRow = clientData as ClientLogoRow | null;
        clientLogo = clientRow?.client_logo || clientRow?.logo || clientRow?.logo_url || null;
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

        const record: CustomFormRecord = {
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
      const { data, error } = await supabase
        .from('custom_forms')
        .insert({ client_id: clientId, title, description: form.description ?? null, is_active: form.is_active ?? true, fields: form.fields, client_logo: (form as any).client_logo ?? clientLogo ?? null, client_type_id: clientTypeId })
        .select('id').single();
      if (error) { tableLogs.custom_forms.errors.push(error.message); responseStatus = 'failed'; responseCode = 207; }
      else if (data?.id) tableLogs.custom_forms.inserted_ids.push(data.id);
    }

    // ── Assessment Templates ──────────────────────────────────────────────
    let superAdminId: string | null = null;
    try {
      const { data: sa } = await supabase
        .from('employees').select('id').eq('client_id', clientId).eq('is_super_admin', true).single();
      superAdminId = sa?.id || null;
    } catch (_) {}

    for (const template of templates.assessment_templates ?? []) {
      const title = template.title?.trim();
      if (!title) continue;
      const { data: existTemplate } = await supabase
        .from('assessment_templates').select('id')
        .eq('client_id', clientId).eq('title', title).eq('client_type_id', clientTypeId);
      if (existTemplate && existTemplate.length > 0) {
        tableLogs.assessment_templates.already_existing_ids.push(existTemplate[0].id);
        continue;
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

        const record: AssessmentTemplateRecord = {
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
      const questionsWithIds = (template.questions ?? []).map((q: any) => ({
        id: q.id || crypto.randomUUID(),
        text: q.text,
        allowComments: q.allowComments ?? false,
        allowAttachments: q.allowAttachments ?? false,
        required: q.required ?? false,
        files: q.files ?? [],
      }));
      const { data, error } = await supabase
        .from('assessment_templates')
        .insert({ client_id: clientId, title, description: template.description ?? null, category_id: categoryId, questions: questionsWithIds, is_active: template.is_active ?? true, created_by: superAdminId, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), client_type_id: clientTypeId })
        .select('id').single();
      if (error) { tableLogs.assessment_templates.errors.push(error.message); responseStatus = 'failed'; responseCode = 207; }
      else if (data?.id) tableLogs.assessment_templates.inserted_ids.push(data.id);
    }

    // ── Edu Resources ─────────────────────────────────────────────────────
    if (clientTypeId) {
      let uploadedById: string | null = null;
      try {
        const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
        if (authHeader) {
          const token = authHeader.replace('Bearer ', '');
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user) {
            const { data: bu } = await supabase.from('backoffice_users').select('id').eq('email', 'backofficesafeschool@gmail.com').single();
            uploadedById = bu?.id || null;
          }
        }
      } catch (_) {}

      for (const resource of templates.edu_resources ?? []) {
        const title = resource.title?.trim();
        if (!title) continue;
        const { data: existRes } = await supabase
          .from('backoffice_edusafe_resource').select('id')
          .eq('client_type_id', clientTypeId).eq('title', title);
        if (existRes && existRes.length > 0) {
          tableLogs.backoffice_edusafe_resource.already_existing_ids.push(existRes[0].id);
          continue;
        }
        let documentUrl = resource.document_url ?? null;
        if (documentUrl && clientTypeId) {
          documentUrl = documentUrl.replace(/client_type_id/g, clientTypeId);
        }

        const record: EduResourceRecord = {
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
          .insert({ id: crypto.randomUUID(), title, description: resource.description ?? null, category: resource.category ?? null, tags: resource.tags ?? null, document_url: documentUrl, created_at: resource.created_at || new Date().toISOString(), updated_at: resource.updated_at || new Date().toISOString(), uploaded_by: uploadedById, client_type_id: clientTypeId })
          .select('id').single();
        if (error) { tableLogs.backoffice_edusafe_resource.errors.push(error.message); responseStatus = 'failed'; responseCode = 207; }
        else if (data?.id) tableLogs.backoffice_edusafe_resource.inserted_ids.push(data.id);
      }
    }

    } // end for types loop

    // ── Create "All" group ────────────────────────────────────────────────
    try {
      const { data: superAdminData } = await supabase
        .from('employees').select('id').eq('client_id', clientId).eq('is_super_admin', true).single();
      const superAdminEmployeeId: string | null = superAdminData?.id || null;

      if (superAdminEmployeeId) {
        const { data: allEmployees } = await supabase
          .from('employees').select('id').eq('client_id', clientId).eq('status', true);
        const employeeIds = (allEmployees || []).map((e: any) => e.id);
        const { data: existingGroup, error: groupCheckError } = await supabase
          .from('groups').select('id').eq('client_id', clientId).eq('name', 'All').single();
        let groupId: string | null = null;

        if (groupCheckError?.code === 'PGRST116') {
          const { data: newGroup } = await supabase
            .from('groups')
            .insert({ name: 'All', description: 'All employees group - includes all employees in the organization', group_type: 'Employee', status: true, client_id: clientId, employee_id: superAdminEmployeeId })
            .select('id').single();
          groupId = newGroup?.id || null;
        } else if (existingGroup) {
          groupId = existingGroup.id;
        }

          let groupId: string | null = null;

          if (groupCheckError && groupCheckError.code === 'PGRST116' && superAdminEmployeeId) {
            // Group doesn't exist, create it
            console.log('Creating "All" group for client:', clientId);
            const { data: newGroup, error: createGroupError } = await supabase
              .from('groups')
              .insert({
                name: 'All',
                description: 'All employees group - includes all employees in the organization',
                group_type: 'Employee',
                status: true,
                client_id: clientId,
                employee_id: superAdminEmployeeId,
              })
              .select('id')
              .single();

            if (createGroupError || !newGroup) {
              console.log('Error creating "All" group:', createGroupError);
            } else {
              groupId = newGroup.id;
              console.log(`Successfully created "All" group with ID: ${groupId}`);
            }
          } else if (existingGroup) {
            // Group already exists
            groupId = existingGroup.id;
            console.log(`"All" group already exists with ID: ${groupId}`);
          } else if (groupCheckError) {
            console.log('Error checking for existing "All" group:', groupCheckError);
          }

          // If we have a group_id and superAdminEmployeeId, insert employees into group_employees
          if (groupId && superAdminEmployeeId) {
            // Get existing group_employees to avoid duplicates
            const { data: existingGroupEmployees, error: existingError } = await supabase
              .from('group_employees')
              .select('employee_id')
              .eq('group_id', groupId);

            const existingEmployeeIds = new Set(
              (existingGroupEmployees || []).map((ge: GroupEmployeeRow) => ge.employee_id).filter(Boolean)
            );
          }
        }
      }
    } catch (_) {}

    await supabase.from('configuration_import_logs').insert({
      client_id: clientId,
      response_status: responseStatus,
      response_code: responseCode,
      log: tableLogs,
    });

    return new Response(
      JSON.stringify({ status: responseStatus, code: responseCode, details: tableLogs }),
      { status: responseCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    const errResp = { status: 'failed', code: 500, error: e instanceof Error ? e.message : 'Unknown error' };
    return new Response(JSON.stringify(errResp), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
