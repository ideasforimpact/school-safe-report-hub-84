import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FetchAssignedSOPRequest {
  client_id: string;
  employee_id: string;
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
    const requestData: FetchAssignedSOPRequest = await req.json()
    const { client_id, employee_id } = requestData

    // Validate required fields
    if (!client_id || !employee_id) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: 'Client ID and Employee ID are required' }),
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

    const groupIds = (employeeGroups || []).map((g: any) => g.group_id);
    
    if (groupIds.length === 0) {
      // Employee is not a member of any groups, return empty array
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: [],
          message: 'No assigned SOPs found - employee is not a member of any groups' 
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
      console.error('Error fetching assigned SOPs:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch assigned SOPs', 
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Deduplicate SOPs by SOP ID (employee might be in multiple groups assigned to same SOP)
    const uniqueSopMap = new Map<string, any>();
    (data || []).forEach((item: any) => {
      if (item.sop && !uniqueSopMap.has(item.sop.id)) {
        uniqueSopMap.set(item.sop.id, item.sop);
      }
    });

    const uniqueSops = Array.from(uniqueSopMap.values());
    const uniqueSopIds = uniqueSops.map((sop: any) => sop.id);

    // Extract category IDs and fetch category names
    const categoryIds = [...new Set(uniqueSops.map((sop: any) => sop.category_id).filter(Boolean))];
    
    const { data: categories } = await supabaseClient
      .from('sop_categories')
      .select('id, category_name')
      .in('id', categoryIds);

    const categoryMap = new Map((categories || []).map((c: any) => [c.id, c.category_name]));

    // Check signoff request status for the employee and get completed_date
    const signoffStatusMap = new Map<string, boolean>();
    const signoffCompletedDateMap = new Map<string, string>();
    if (uniqueSopIds.length > 0) {
      const { data: signoffData, error: signoffError } = await supabaseClient
        .from('sop_signoff_request')
        .select('sop_id, completed_date')
        .eq('employee_id', employee_id)
        .eq('client_id', client_id)
        .in('sop_id', uniqueSopIds)
        .not('completed_date', 'is', null);

      if (signoffError) {
        console.error('[fetch-assigned-sop] Error fetching signoff requests:', signoffError);
      }

      if (signoffData) {
        signoffData.forEach((item: any) => {
          signoffStatusMap.set(item.sop_id, true);
          if (item.completed_date) {
            signoffCompletedDateMap.set(item.sop_id, item.completed_date);
          }
        });
      }
    }

    // Fetch groups assigned to each SOP (only groups where employee is a member)
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
        .eq('client_id', client_id)
        .in('sop_id', uniqueSopIds)
        .not('group_id', 'is', null);

      if (assignedError) {
        console.error('[fetch-assigned-sop] Error fetching assignments:', assignedError);
      }

      if (assignedData) {
        // Filter to only include groups where the current employee is a member
        assignedData.forEach((item: any) => {
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

    // Fetch SOP creator names
    const creatorIds = [
      ...new Set(
        uniqueSops
          .map((sop: any) => sop.employee_id)
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

    // Format SOPs
    const formattedSOPs = uniqueSops.map((sop: any) => {
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
      
      // Deduplicate employees across all groups to get unique employee count
      const uniqueEmployeeIds = new Set<string>();
      formattedAssignments.forEach((a: any) => {
        (a.employees || []).forEach((emp: any) => {
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
        assignments: formattedAssignments,
        signoff_request_status: signoffRequestStatus,
        sop_signoff_request_exist: sopSignoffRequestExist,
        completed_date: completedDate,
        };
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: formattedSOPs,
        message: 'Assigned SOPs fetched successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in fetch-assigned-sop function:', error);
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
