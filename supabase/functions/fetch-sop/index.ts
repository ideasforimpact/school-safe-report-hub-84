import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FetchSOPRequest {
  client_id?: string | null;
  employee_id?: string | null;
  is_super_admin: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      getSupabaseUrl(),
      getSupabaseServiceRoleKey()
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const requestData: FetchSOPRequest = await req.json()
    const { client_id, employee_id, is_super_admin } = requestData

    let formattedSOPs: any[] = [];

    if (is_super_admin) {
      // Super admin: Fetch SOPs from sop table filtered by client_id and employee_id
      let query = supabaseClient
        .from('sop')
        .select(`
          id,
          title,
          category_id,
          description,
          status,
          procedure_steps,
          important_notes,
          client_id,
          employee_id,
          created_at,
          updated_at
        `);

      // Filter by client_id if provided
      if (client_id) {
        query = query.eq('client_id', client_id);
      }

      // Filter by employee_id if provided
      if (employee_id) {
        query = query.eq('employee_id', employee_id);
      }

      const { data: sopData, error: sopError } = await query.order('created_at', { ascending: false });

      if (sopError) {
        throw sopError;
      }

      // Fetch category names separately
      const categoryIds = [...new Set((sopData || []).map((s: any) => s.category_id))];
      const { data: categories } = await supabaseClient
        .from('sop_categories')
        .select('id, category_name')
        .in('id', categoryIds);

      const categoryMap = new Map((categories || []).map((c: any) => [c.id, c.category_name]));

      // Get SOP IDs to fetch assigned counts and group details
      const sopIds = (sopData || []).map((s: any) => s.id);
      
      // Fetch assigned counts and group/creator details for each SOP
      const assignedCountMap = new Map<string, number>();
      const assignmentsBySopId = new Map<string, any[]>();

      if (sopIds.length > 0) {
        const { data: assignedData, error: assignedError } = await supabaseClient
          .from('sop_assigned')
          .select(`
            sop_id,
            created_by,
            group:groups (
              id,
              name,
              group_type,
              status,
              group_employees:group_employees!group_employees_group_id_fkey (
                employee_id,
                employee:employees!group_employees_employee_id_fkey (
                  id,
                  first_name,
                  last_name,
                  email
                )
              )
            ),
            creator:employees!sop_assigned_created_by_fkey (
              id,
              first_name,
              last_name
            )
          `)
          .in('sop_id', sopIds);

        if (assignedError) {
          console.error('[fetch-sop] Error fetching assignments (admin):', assignedError);
        }

        if (assignedData) {
          assignedData.forEach((item: any) => {
            const count = assignedCountMap.get(item.sop_id) || 0;
            assignedCountMap.set(item.sop_id, count + 1);

            const existing = assignmentsBySopId.get(item.sop_id) || [];
            existing.push(item);
            assignmentsBySopId.set(item.sop_id, existing);
          });
        }
      }

      // Fetch SOP creator names
      const creatorIds = [
        ...new Set((sopData || []).map((s: any) => s.employee_id).filter(Boolean)),
      ];

      const creatorMap = new Map<string, { id: string; first_name: string; last_name: string }>();

      if (creatorIds.length > 0) {
        const { data: creators } = await supabaseClient
          .from('employees')
          .select('id, first_name, last_name')
          .in('id', creatorIds);

        (creators || []).forEach((emp: any) => {
          creatorMap.set(emp.id, emp);
        });
      }

      // Format data
      formattedSOPs = (sopData || []).map((sop: any) => {
        const creator = sop.employee_id ? creatorMap.get(sop.employee_id) : null;
        const assignments = assignmentsBySopId.get(sop.id) || [];

        const formattedAssignments = assignments.map((item: any) => {
          const group = item.group;
          const createdByEmp = item.creator;
          const members = (group?.group_employees || []) as { 
            employee_id: string;
            employee?: {
              id: string;
              first_name: string | null;
              last_name: string | null;
              email: string | null;
            } | null;
          }[];
          const employees = members
            .filter((m) => m.employee)
            .map((m) => ({
              id: m.employee!.id,
              first_name: m.employee!.first_name || '',
              last_name: m.employee!.last_name || '',
              email: m.employee!.email || '',
              full_name: `${m.employee!.first_name || ''} ${m.employee!.last_name || ''}`.trim() || m.employee!.email || 'Unknown',
            }));
          return {
            group_id: group?.id || null,
            group_name: group?.name || null,
            group_type: group?.group_type || null,
            group_status: group?.status ?? null,
            employee_count: members.length,
            employees: employees,
            created_by_id: createdByEmp?.id || null,
            created_by_name: createdByEmp
              ? `${createdByEmp.first_name ?? ''} ${createdByEmp.last_name ?? ''}`.trim()
              : null,
          };
        });

        const assignedGroupCount = formattedAssignments.length;
        const assignedEmployeeCount = formattedAssignments.reduce(
          (sum: number, a: any) => sum + (a.employee_count || 0),
          0,
        );

        return {
          id: sop.id,
          title: sop.title,
          category_id: sop.category_id,
          category_name: categoryMap.get(sop.category_id) || null,
          description: sop.description,
          status: sop.status,
          procedure_steps: Array.isArray(sop.procedure_steps) ? sop.procedure_steps : [],
          important_notes: sop.important_notes,
          client_id: sop.client_id,
          employee_id: sop.employee_id,
          created_at: sop.created_at,
          updated_at: sop.updated_at,
          assigned_sop: assignedGroupCount,
          assigned_group_count: assignedGroupCount,
          assigned_employee_count: assignedEmployeeCount,
          creator_name: creator
            ? `${creator.first_name ?? ''} ${creator.last_name ?? ''}`.trim()
            : null,
          assignments: formattedAssignments,
        };
      });
    } else {
      // Normal user: Fetch SOPs from sop_assigned table filtered by client_id and employee_id
      if (!client_id || !employee_id) {
        return new Response(
          JSON.stringify({ error: 'Validation error', details: 'Client ID and Employee ID are required for non-admin users' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const { data, error } = await supabaseClient
        .from('sop_assigned')
        .select(`
          sop_id,
          sop:sop!inner(
            id,
            title,
            category_id,
            description,
            status,
            procedure_steps,
            important_notes,
            client_id,
            employee_id,
            created_at,
            updated_at
          )
        `)
        .eq('client_id', client_id)
        .eq('employee_id', employee_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching SOPs:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to fetch SOPs', 
            details: error.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Extract category IDs and fetch category names
      const categoryIds = [...new Set((data || []).filter((item: any) => item.sop).map((item: any) => item.sop.category_id))];
      
      const { data: categories } = await supabaseClient
        .from('sop_categories')
        .select('id, category_name')
        .in('id', categoryIds);

      const categoryMap = new Map((categories || []).map((c: any) => [c.id, c.category_name]));

      // Get unique SOP IDs to fetch assigned counts
      const uniqueSopIds = [...new Set((data || []).filter((item: any) => item.sop).map((item: any) => item.sop.id))];
      
      // Fetch assigned counts and group/creator details for each SOP
      const assignedCountMap = new Map<string, number>();
      const assignmentsBySopId = new Map<string, any[]>();
      if (uniqueSopIds.length > 0) {
        const { data: assignedData, error: assignedError } = await supabaseClient
          .from('sop_assigned')
          .select(`
            sop_id,
            created_by,
            group:groups (
              id,
              name,
              group_type,
              status,
              group_employees:group_employees!group_employees_group_id_fkey (
                employee_id,
                employee:employees!group_employees_employee_id_fkey (
                  id,
                  first_name,
                  last_name,
                  email
                )
              )
            ),
            creator:employees!sop_assigned_created_by_fkey (
              id,
              first_name,
              last_name
            )
          `)
          .in('sop_id', uniqueSopIds);

        if (assignedError) {
          console.error('[fetch-sop] Error fetching assignments (user):', assignedError);
        }

        if (assignedData) {
          assignedData.forEach((item: any) => {
            const count = assignedCountMap.get(item.sop_id) || 0;
            assignedCountMap.set(item.sop_id, count + 1);

            const existing = assignmentsBySopId.get(item.sop_id) || [];
            existing.push(item);
            assignmentsBySopId.set(item.sop_id, existing);
          });
        }
      }

      // Fetch SOP creator names
      const creatorIds = [
        ...new Set(
          (data || [])
            .filter((item: any) => item.sop)
            .map((item: any) => item.sop.employee_id)
            .filter(Boolean),
        ),
      ];

      const creatorMap = new Map<string, { id: string; first_name: string; last_name: string }>();

      if (creatorIds.length > 0) {
        const { data: creators } = await supabaseClient
          .from('employees')
          .select('id, first_name, last_name')
          .in('id', creatorIds);

        (creators || []).forEach((emp: any) => {
          creatorMap.set(emp.id, emp);
        });
      }

      // Format for normal user (from sop_assigned with nested sop)
      formattedSOPs = (data || [])
        .filter((item: any) => item.sop) // Filter out any items without sop
        .map((item: any) => {
          const sop = item.sop;
          const creator = sop.employee_id ? creatorMap.get(sop.employee_id) : null;
          const assignments = assignmentsBySopId.get(sop.id) || [];

          const formattedAssignments = assignments.map((a: any) => {
            const group = a.group;
            const createdByEmp = a.creator;
            const members = (group?.group_employees || []) as { 
              employee_id: string;
              employee?: {
                id: string;
                first_name: string | null;
                last_name: string | null;
                email: string | null;
              } | null;
            }[];
            const employees = members
              .filter((m) => m.employee)
              .map((m) => ({
                id: m.employee!.id,
                first_name: m.employee!.first_name || '',
                last_name: m.employee!.last_name || '',
                email: m.employee!.email || '',
                full_name: `${m.employee!.first_name || ''} ${m.employee!.last_name || ''}`.trim() || m.employee!.email || 'Unknown',
              }));
            return {
              group_id: group?.id || null,
              group_name: group?.name || null,
              group_type: group?.group_type || null,
              group_status: group?.status ?? null,
              employee_count: members.length,
              employees: employees,
              created_by_id: createdByEmp?.id || null,
              created_by_name: createdByEmp
                ? `${createdByEmp.first_name ?? ''} ${createdByEmp.last_name ?? ''}`.trim()
                : null,
            };
          });

          const assignedGroupCount = formattedAssignments.length;
          const assignedEmployeeCount = formattedAssignments.reduce(
            (sum: number, a: any) => sum + (a.employee_count || 0),
            0,
          );

          return {
            id: sop.id,
            title: sop.title,
            category_id: sop.category_id,
            category_name: categoryMap.get(sop.category_id) || null,
            description: sop.description,
            status: sop.status,
            procedure_steps: Array.isArray(sop.procedure_steps) ? sop.procedure_steps : [],
            important_notes: sop.important_notes,
            client_id: sop.client_id,
            employee_id: sop.employee_id,
            created_at: sop.created_at,
            updated_at: sop.updated_at,
            assigned_sop: assignedGroupCount,
            assigned_group_count: assignedGroupCount,
            assigned_employee_count: assignedEmployeeCount,
            creator_name: creator
              ? `${creator.first_name ?? ''} ${creator.last_name ?? ''}`.trim()
              : null,
            assignments: formattedAssignments,
          };
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: formattedSOPs,
        message: 'SOPs fetched successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in fetch-sop function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

