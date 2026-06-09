import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';

// School templates
import schoolCategories from './templates/school/categories.json' assert { type: 'json' };
import schoolContribFactors from './templates/school/contributing-factors.json' assert { type: 'json' };
import schoolReportTypes from './templates/school/report-types.json' assert { type: 'json' };
import schoolPriorities from './templates/school/priorities.json' assert { type: 'json' };
import schoolForm from './templates/school/forms.json' assert { type: 'json' };
import schoolAssessments from './templates/school/assessment-templates.json' assert { type: 'json' };
import schoolEduResources from './templates/school/edu-resources.json' assert { type: 'json' };

// Work templates
import workCategories from './templates/work/categories.json' assert { type: 'json' };
import workContribFactors from './templates/work/contributing-factors.json' assert { type: 'json' };
import workReportTypes from './templates/work/report-types.json' assert { type: 'json' };
import workPriorities from './templates/work/priorities.json' assert { type: 'json' };
import workForm from './templates/work/forms.json' assert { type: 'json' };
import workAssessments from './templates/work/assessment-templates.json' assert { type: 'json' };
import workEduResources from './templates/work/edu-resources.json' assert { type: 'json' };

// Institute templates
import instituteCategories from './templates/institute/categories.json' assert { type: 'json' };
import instituteContribFactors from './templates/institute/contributing-factors.json' assert { type: 'json' };
import instituteReportTypes from './templates/institute/report-types.json' assert { type: 'json' };
import institutePriorities from './templates/institute/priorities.json' assert { type: 'json' };
import instituteForm from './templates/institute/forms.json' assert { type: 'json' };
import instituteAssessments from './templates/institute/assessment-templates.json' assert { type: 'json' };
import instituteEduResources from './templates/institute/edu-resources.json' assert { type: 'json' };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type PerTableLog = {
  inserted_ids: string[];
  already_existing_ids: string[];
  errors: string[];
}

const TEMPLATES_BY_TYPE: Record<string, {
  categories: any[];
  contributing_factors: any[];
  report_types: any[];
  priorities: any[];
  forms: any[];
  assessment_templates: any[];
  edu_resources: any[];
}> = {
  school: {
    categories: (schoolCategories as any).categories,
    contributing_factors: (schoolContribFactors as any).contributing_factors,
    report_types: (schoolReportTypes as any).report_types,
    priorities: (schoolPriorities as any).priorities,
    forms: [schoolForm],
    assessment_templates: schoolAssessments as any[],
    edu_resources: schoolEduResources as any[],
  },
  work: {
    categories: (workCategories as any).categories,
    contributing_factors: (workContribFactors as any).contributing_factors,
    report_types: (workReportTypes as any).report_types,
    priorities: (workPriorities as any).priorities,
    forms: [workForm],
    assessment_templates: workAssessments as any[],
    edu_resources: workEduResources as any[],
  },
  institute: {
    categories: (instituteCategories as any).categories,
    contributing_factors: (instituteContribFactors as any).contributing_factors,
    report_types: (instituteReportTypes as any).report_types,
    priorities: (institutePriorities as any).priorities,
    forms: [instituteForm],
    assessment_templates: instituteAssessments as any[],
    edu_resources: instituteEduResources as any[],
  },
};

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

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'client_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Import all 3 client types for this client
    for (const typeKey of ['school', 'work', 'institute']) {
      const templates = TEMPLATES_BY_TYPE[typeKey];

      // ── Contributing Factors ──────────────────────────────────────────────
      for (const factor of templates.contributing_factors) {
        const name = factor.name?.trim();
        if (!name) continue;
        const { data: existing } = await supabase
          .from('contributing_factors').select('id')
          .eq('client_id', clientId).eq('name', name).eq('client_type_key', typeKey);
        if (existing && existing.length > 0) {
          tableLogs.contributing_factors.already_existing_ids.push(existing[0].id);
          continue;
        }
        const { data, error } = await supabase
          .from('contributing_factors')
          .insert({ name, description: factor.description ?? null, weight: null, client_id: clientId, client_type_key: typeKey })
          .select('id').single();
        if (error) { tableLogs.contributing_factors.errors.push(error.message); responseStatus = 'failed'; responseCode = 207; }
        else if (data?.id) tableLogs.contributing_factors.inserted_ids.push(data.id);
        }
      // ── Report Types ──────────────────────────────────────────────────────
      for (const rt of templates.report_types) {
        const name = rt.name?.trim();
        if (!name) continue;
        const { data: existing } = await supabase
          .from('incident_report_types').select('id')
          .eq('client_id', clientId).eq('name', name).eq('client_type_key', typeKey);
        if (existing && existing.length > 0) {
          tableLogs.report_types.already_existing_ids.push(existing[0].id);
          continue;
        }
        const { data, error } = await supabase
          .from('incident_report_types')
          .insert({ name, description: rt.description ?? null, is_active: rt.is_active ?? true, client_id: clientId, client_type_key: typeKey })
          .select('id').single();
        if (error) { tableLogs.report_types.errors.push(error.message); responseStatus = 'failed'; responseCode = 207; }
        else if (data?.id) tableLogs.report_types.inserted_ids.push(data.id);
      }
      // ── Priorities ────────────────────────────────────────────────────────
      for (const pr of templates.priorities) {
        const name = pr.name?.trim();
        if (!name) continue;
        const { data: existing } = await supabase
          .from('incident_priorities').select('id')
          .eq('client_id', clientId).eq('name', name).eq('client_type_key', typeKey);
        if (existing && existing.length > 0) {
          tableLogs.priorities.already_existing_ids.push(existing[0].id);
          continue;
        }
        const { data, error } = await supabase
          .from('incident_priorities')
          .insert({ name, description: pr.description ?? null, color: pr.color ?? null, weight: pr.weight ?? null, is_active: pr.is_active ?? true, client_id: clientId, client_type_key: typeKey })
          .select('id').single();
        if (error) { tableLogs.priorities.errors.push(error.message); responseStatus = 'failed'; responseCode = 207; }
        else if (data?.id) tableLogs.priorities.inserted_ids.push(data.id);
        }
      // ── Categories + Subcategories ────────────────────────────────────────
      for (const cat of templates.categories) {
        const catName = cat.name?.trim();
        if (!catName) continue;
        const { data: existCat } = await supabase
          .from('incident_categories').select('id')
          .eq('client_id', clientId).eq('name', catName).eq('client_type_key', typeKey);
        let categoryId: string | null = null;
        if (existCat && existCat.length > 0) {
          categoryId = existCat[0].id;
          tableLogs.categories.already_existing_ids.push(categoryId);
        } else {
          const { data: insertedCat, error: catError } = await supabase
            .from('incident_categories')
            .insert({ name: catName, description: cat.description ?? null, client_id: clientId, client_type_key: typeKey })
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
              .insert({ name: subName, description: sub.description ?? null, category_id: categoryId, client_id: clientId, client_type_key: typeKey })
              .select('id').single();
            if (subError) { tableLogs.sub_categories.errors.push(subError.message); responseStatus = 'failed'; responseCode = 207; }
            else if (insertedSub?.id) tableLogs.sub_categories.inserted_ids.push(insertedSub.id);
          }
        }
      }

      // ── Custom Forms ──────────────────────────────────────────────────────
      let clientLogo: string | null = null;
      try {
        const { data: clientData } = await supabase
          .from('clients').select('logo, client_logo, logo_url').eq('id', clientId).single();
        clientLogo = (clientData as any)?.client_logo || (clientData as any)?.logo || (clientData as any)?.logo_url || null;
      } catch (_) {}

      for (const form of templates.forms) {
        const title = form.title?.trim();
        if (!title) continue;
        const { data: existForm } = await supabase
          .from('custom_forms').select('id')
          .eq('client_id', clientId).eq('title', title).eq('client_type_key', typeKey);
        if (existForm && existForm.length > 0) {
          tableLogs.custom_forms.already_existing_ids.push(existForm[0].id);
          continue;
        }
        const { data, error } = await supabase
          .from('custom_forms')
          .insert({ client_id: clientId, title, description: form.description ?? null, is_active: form.is_active ?? true, fields: form.fields, client_logo: (form as any).client_logo ?? clientLogo ?? null, client_type_key: typeKey })
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

      for (const template of templates.assessment_templates) {
        const title = template.title?.trim();
        if (!title) continue;
        const { data: existTemplate } = await supabase
          .from('assessment_templates').select('id')
          .eq('client_id', clientId).eq('title', title).eq('client_type_key', typeKey);
        if (existTemplate && existTemplate.length > 0) {
          tableLogs.assessment_templates.already_existing_ids.push(existTemplate[0].id);
          continue;
        }
        let categoryId: string | null = null;
        if (template.category_name) {
          const { data: catData } = await supabase
            .from('template_categories').select('id').eq('name', template.category_name.trim()).single();
          categoryId = catData?.id || null;
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
          .insert({ client_id: clientId, title, description: template.description ?? null, category_id: categoryId, questions: questionsWithIds, is_active: template.is_active ?? true, created_by: superAdminId, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), client_type_key: typeKey })
          .select('id').single();
        if (error) { tableLogs.assessment_templates.errors.push(error.message); responseStatus = 'failed'; responseCode = 207; }
        else if (data?.id) tableLogs.assessment_templates.inserted_ids.push(data.id);
      }

      // ── Edu Resources (global table, keyed by client_type_id) ─────────────
      const { data: clientTypeData } = await supabase
        .from('client_type').select('id').eq('key', typeKey).single();
      const clientTypeId: string | null = clientTypeData?.id || null;

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

        for (const resource of templates.edu_resources) {
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
          if (documentUrl) documentUrl = documentUrl.replace(/client_type_id/g, clientTypeId);
          const { data, error } = await supabase
            .from('backoffice_edusafe_resource')
            .insert({ id: crypto.randomUUID(), title, description: resource.description ?? null, category: resource.category ?? null, tags: resource.tags ?? null, document_url: documentUrl, created_at: resource.created_at || new Date().toISOString(), updated_at: resource.updated_at || new Date().toISOString(), uploaded_by: uploadedById, client_type_id: clientTypeId })
            .select('id').single();
          if (error) { tableLogs.backoffice_edusafe_resource.errors.push(error.message); responseStatus = 'failed'; responseCode = 207; }
          else if (data?.id) tableLogs.backoffice_edusafe_resource.inserted_ids.push(data.id);
        }
      }
    } // end for typeKey

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

        if (groupId && employeeIds.length > 0) {
          const { data: existingGE } = await supabase
            .from('group_employees').select('employee_id').eq('group_id', groupId);
          const existingSet = new Set((existingGE || []).map((ge: any) => ge.employee_id));
          const toAdd = employeeIds.filter((id: string) => !existingSet.has(id));
          if (toAdd.length > 0) {
            await supabase.from('group_employees').insert(
              toAdd.map((empId: string) => ({ group_id: groupId, employee_id: empId, role_id: null, client_id: clientId, created_by_employee_id: superAdminEmployeeId }))
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
  } catch (e: any) {
    return new Response(
      JSON.stringify({ status: 'failed', code: 500, error: e?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
