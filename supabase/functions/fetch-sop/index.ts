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
  search?: string | null;
  status?: string | null;
  category_id?: string | null;
  page?: number;
  limit?: number;
}

interface SOPRow {
  id: string;
  title: string;
  category_id: string | null;
  description: string | null;
  status: boolean;
  procedure_steps: unknown;
  important_notes: string | null;
  client_id: string;
  employee_id: string | null;
  created_at: string;
  updated_at: string;
}

interface EmployeeRef {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email?: string | null;
}

interface GroupRef {
  id: string;
  name: string | null;
  group_type: string | null;
  status: boolean | null;
  group_employees?: { employee_id: string; employee?: EmployeeRef | null }[] | null;
}

interface SopAssignmentRow {
  sop_id: string;
  created_by: string | null;
  group: GroupRef | null;
  creator: EmployeeRef | null;
}

interface FormattedAssignment {
  group_id: string | null;
  group_name: string | null;
  group_type: string | null;
  group_status: boolean | null;
  employee_count: number;
  employees: { id: string; first_name: string; last_name: string; email: string; full_name: string }[];
  created_by_id: string | null;
  created_by_name: string | null;
}

interface CategoryRow {
  id: string;
  category_name: string;
}

interface SignoffRow {
  sop_id: string;
  employee_id: string;
  is_completed?: boolean;
  completed_date?: string | null;
}

interface SopAssignedJoinRow {
  sop_id: string;
  sop: SOPRow | null;
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
    const { client_id, employee_id, is_super_admin, search, status, category_id } = requestData
    const page = Math.max(1, Number(requestData.page || 1));
    const limit = Math.max(1, Number(requestData.limit || 10));

    let formattedSOPs: unknown[] = [];
    let total = 0;

    if (is_super_admin) {
      // Super admin: Fetch SOPs from sop table filtered by client_id and employee_id
      // Require client_id even for super admin
      if (!client_id) {
        return new Response(
          JSON.stringify({ error: 'Validation error', details: 'Client ID is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

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
        `, { count: 'exact' })
        .eq('client_id', client_id);

      // Filter by employee_id if provided
      if (employee_id && !is_super_admin) {
        query = query.eq('employee_id', employee_id);
      }

      if (status === 'active') {
        query = query.eq('status', true);
      } else if (status === 'inactive') {
        query = query.eq('status', false);
      }

      if (category_id) {
        query = query.eq('category_id', category_id);
      }

      if (search) {
        const orParts = [`title.ilike.%${search}%`, `description.ilike.%${search}%`];
        const { data: catMatches } = await supabaseClient
          .from('sop_categories')
          .select('id')
          .ilike('category_name', `%${search}%`);
        const matchingCategoryIds = (catMatches || []).map((c: { id: string }) => c.id);
        if (matchingCategoryIds.length > 0) {
          orParts.push(`category_id.in.(${matchingCategoryIds.join(',')})`);
        }
        query = query.or(orParts.join(','));
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data: sopData, error: sopError, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      total = count ?? 0;

      if (sopError) {
        throw sopError;
      }

      // Fetch category names separately
      const categoryIds = [...new Set((sopData || []).map((s: SOPRow) => s.category_id))];
      const { data: categories } = await supabaseClient
        .from('sop_categories')
        .select('id, category_name')
        .in('id', categoryIds);

      const categoryMap = new Map((categories || []).map((c: CategoryRow) => [c.id, c.category_name]));

      // Get SOP IDs to fetch assigned counts and group details
      const sopIds = (sopData || []).map((s: SOPRow) => s.id);

      // Fetch assigned counts and group/creator details for each SOP
      const assignedCountMap = new Map<string, number>();
      const assignmentsBySopId = new Map<string, SopAssignmentRow[]>();

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
          assignedData.forEach((item: SopAssignmentRow) => {
            const count = assignedCountMap.get(item.sop_id) || 0;
            assignedCountMap.set(item.sop_id, count + 1);

            const existing = assignmentsBySopId.get(item.sop_id) || [];
            existing.push(item);
            assignmentsBySopId.set(item.sop_id, existing);
          });
        }
      }

      // Fetch signoff request counts for each SOP (how many unique employees have signed off)
      const signoffCountBySopId = new Map<string, Set<string>>();
      if (sopIds.length > 0) {
        const { data: signoffData, error: signoffError } = await supabaseClient
          .from('sop_signoff_request')
          .select('sop_id, employee_id')
          .in('sop_id', sopIds);

        if (signoffError) {
          console.error('[fetch-sop] Error fetching signoff requests:', signoffError);
        }

        if (signoffData) {
          signoffData.forEach((item: SignoffRow) => {
            if (!signoffCountBySopId.has(item.sop_id)) {
              signoffCountBySopId.set(item.sop_id, new Set<string>());
            }
            signoffCountBySopId.get(item.sop_id)!.add(item.employee_id);
          });
        }
      }

      // Fetch SOP creator names
      const creatorIds = [
        ...new Set((sopData || []).map((s: SOPRow) => s.employee_id).filter(Boolean)),
      ];

      const creatorMap = new Map<string, { id: string; first_name: string; last_name: string }>();

      if (creatorIds.length > 0) {
        const { data: creators } = await supabaseClient
          .from('employees')
          .select('id, first_name, last_name')
          .in('id', creatorIds);

        (creators || []).forEach((emp: { id: string; first_name: string; last_name: string }) => {
          creatorMap.set(emp.id, emp);
        });
      }

      // Format data
      formattedSOPs = (sopData || []).map((sop: SOPRow) => {
        const creator = sop.employee_id ? creatorMap.get(sop.employee_id) : null;
        const assignments = assignmentsBySopId.get(sop.id) || [];

        const formattedAssignments: FormattedAssignment[] = assignments.map((item: SopAssignmentRow) => {
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
        
        // Deduplicate employees across all groups to get unique employee count
        const uniqueEmployeeIds = new Set<string>();
        formattedAssignments.forEach((a: FormattedAssignment) => {
          (a.employees || []).forEach((emp) => {
            if (emp.id) {
              uniqueEmployeeIds.add(emp.id);
            }
          });
        });
        const assignedEmployeeCount = uniqueEmployeeIds.size;

        // Get completed count (unique employees who have signed off for this SOP)
        const signedOffEmployees = signoffCountBySopId.get(sop.id);
        const completedCount = signedOffEmployees ? signedOffEmployees.size : 0;
        const toBeDoneCount = assignedEmployeeCount - completedCount;

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
          completed_count: completedCount,
          to_be_done_count: toBeDoneCount >= 0 ? toBeDoneCount : 0,
          creator_name: creator
            ? `${creator.first_name ?? ''} ${creator.last_name ?? ''}`.trim()
            : null,
          assignments: formattedAssignments,
        };
      });
    } else {
      // Normal user: Fetch SOPs from sop_assigned table where employee is a member of assigned groups
      if (!client_id || !employee_id) {
        return new Response(
          JSON.stringify({ error: 'Validation error', details: 'Client ID and Employee ID are required for non-admin users' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Step 1: Find all groups where the employee is a member
      const { data: employeeGroups, error: egError } = await supabaseClient
        .from('group_employees')
        .select('group_id')
        .eq('employee_id', employee_id);

      if (egError) {
        console.error('Error fetching employee groups:', egError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to fetch employee groups', 
            details: egError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const groupIds = (employeeGroups || []).map((g: { group_id: string }) => g.group_id);
      
      if (groupIds.length === 0) {
        // Employee is not a member of any groups, return empty array
        return new Response(
          JSON.stringify({
            success: true,
            data: [],
            pagination: { total: 0 },
            message: 'No SOPs found - employee is not a member of any groups'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Step 2: Find all SOPs assigned to these groups
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
        .in('group_id', groupIds)
        .not('group_id', 'is', null)
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
      const categoryIds = [...new Set((data || []).filter((item: SopAssignedJoinRow) => item.sop).map((item: SopAssignedJoinRow) => item.sop!.category_id))];

      const { data: categories } = await supabaseClient
        .from('sop_categories')
        .select('id, category_name')
        .in('id', categoryIds);

      const categoryMap = new Map((categories || []).map((c: CategoryRow) => [c.id, c.category_name]));

      // Get unique SOP IDs
      const uniqueSopIds = [...new Set((data || []).filter((item: SopAssignedJoinRow) => item.sop).map((item: SopAssignedJoinRow) => item.sop!.id))];

      // Fetch groups assigned to each SOP (will filter to only groups where employee is a member)
      const assignmentsBySopId = new Map<string, SopAssignmentRow[]>();
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
          .eq('client_id', client_id)
          .in('sop_id', uniqueSopIds)
          .not('group_id', 'is', null);

        if (assignedError) {
          console.error('[fetch-sop] Error fetching assignments (user):', assignedError);
        }

        if (assignedData) {
          // Filter to only include groups where the current employee is a member
          assignedData.forEach((item: SopAssignmentRow) => {
            const group = item.group;
            if (group && group.id) {
              // Check if this group is in the employee's groups
              if (groupIds.includes(group.id)) {
                const existing = assignmentsBySopId.get(item.sop_id) || [];
                existing.push(item);
                assignmentsBySopId.set(item.sop_id, existing);
              }
            }
          });
        }
      }

      // Deduplicate SOPs by SOP ID (employee might be in multiple groups assigned to same SOP)
      const uniqueSopMap = new Map<string, SOPRow>();
      (data || []).forEach((item: SopAssignedJoinRow) => {
        if (item.sop && !uniqueSopMap.has(item.sop.id)) {
          uniqueSopMap.set(item.sop.id, item.sop);
        }
      });

      // Apply search/status/category filters (the joined query above can't filter
      // on the embedded `sop` relation directly, so filter the deduplicated list).
      let uniqueSops = Array.from(uniqueSopMap.values());

      if (status === 'active') {
        uniqueSops = uniqueSops.filter((sop) => sop.status === true);
      } else if (status === 'inactive') {
        uniqueSops = uniqueSops.filter((sop) => sop.status === false);
      }

      if (category_id) {
        uniqueSops = uniqueSops.filter((sop) => sop.category_id === category_id);
      }

      if (search) {
        const searchLower = search.toLowerCase();
        uniqueSops = uniqueSops.filter((sop) =>
          (sop.title || '').toLowerCase().includes(searchLower) ||
          (sop.description || '').toLowerCase().includes(searchLower) ||
          (categoryMap.get(sop.category_id) || '').toLowerCase().includes(searchLower)
        );
      }

      total = uniqueSops.length;

      const sopIdsForSignoffCheck = uniqueSops.map((sop: SOPRow) => sop.id);

      // Check signoff request status for the employee and get completed_date
      const signoffStatusMap = new Map<string, boolean>();
      const signoffCompletedDateMap = new Map<string, string>();
      if (sopIdsForSignoffCheck.length > 0 && employee_id) {
        const { data: signoffData, error: signoffError } = await supabaseClient
          .from('sop_signoff_request')
          .select('sop_id, completed_date')
          .eq('employee_id', employee_id)
          .eq('client_id', client_id)
          .in('sop_id', sopIdsForSignoffCheck)
          .not('completed_date', 'is', null);

        if (signoffError) {
          console.error('[fetch-sop] Error fetching signoff requests:', signoffError);
        }

        if (signoffData) {
          signoffData.forEach((item: SignoffRow) => {
            signoffStatusMap.set(item.sop_id, true);
            if (item.completed_date) {
              signoffCompletedDateMap.set(item.sop_id, item.completed_date);
            }
          });
        }
      }

      // Fetch SOP creator names
      const creatorIds = [
        ...new Set(
          uniqueSops
            .map((sop: SOPRow) => sop.employee_id)
            .filter(Boolean),
        ),
      ];

      const creatorMap = new Map<string, { id: string; first_name: string; last_name: string }>();

      if (creatorIds.length > 0) {
        const { data: creators } = await supabaseClient
          .from('employees')
          .select('id, first_name, last_name')
          .in('id', creatorIds);

        (creators || []).forEach((emp: { id: string; first_name: string; last_name: string }) => {
          creatorMap.set(emp.id, emp);
        });
      }

      // Format function for non-super admin users
      const formatSOPForNonAdmin = (sop: SOPRow) => {
        const creator = sop.employee_id ? creatorMap.get(sop.employee_id) : null;
        const assignments = assignmentsBySopId.get(sop.id) || [];

        const formattedAssignments: FormattedAssignment[] = assignments.map((a: SopAssignmentRow) => {
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
        
        // Deduplicate employees across all groups to get unique employee count
        const uniqueEmployeeIds = new Set<string>();
        formattedAssignments.forEach((a: FormattedAssignment) => {
          (a.employees || []).forEach((emp) => {
            if (emp.id) {
              uniqueEmployeeIds.add(emp.id);
            }
          });
        });
        const assignedEmployeeCount = uniqueEmployeeIds.size;

        // Check if signoff request exists for this SOP and employee
        const sopSignoffRequestExist = signoffStatusMap.has(sop.id);
        const signoffRequestStatus = sopSignoffRequestExist ? 'Completed' : 'In-progress';
        const completedDate = signoffCompletedDateMap.get(sop.id) || null;

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
          assigned_group_count: assignedGroupCount,
          assigned_employee_count: assignedEmployeeCount,
          creator_name: creator
            ? `${creator.first_name ?? ''} ${creator.last_name ?? ''}`.trim()
            : null,
          assignments: formattedAssignments, // Array of all groups assigned to this SOP
          signoff_request_status: signoffRequestStatus,
          sop_signoff_request_exist: sopSignoffRequestExist,
          completed_date: completedDate,
          };
      };

      // Format all unique SOPs, then apply pagination to the filtered set
      const from = (page - 1) * limit;
      const to = from + limit;
      formattedSOPs = uniqueSops.slice(from, to).map(formatSOPForNonAdmin);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: formattedSOPs,
        pagination: { total },
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
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

