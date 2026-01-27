import { supabase } from '@/integrations/supabase/client';

/**
 * Get total count of SOPs for a client and optionally filtered by employee_id
 */
export const getTotalSOPsCount = async (
  clientId: string,
  employeeId?: string | null
): Promise<number> => {
  try {
    if (!clientId) {
      return 0;
    }

    let query = (supabase as any)
      .from('sop')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId);

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error fetching total SOPs count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getTotalSOPsCount:', error);
    return 0;
  }
};

/**
 * Get total number of employees involved across all SOPs
 * This sums up the employee count per SOP (deduplicated within each SOP)
 * Example: SOP1 has 2 employees, SOP2 has 11 employees = Total 13 employees
 */
export const getTotalEmployeesInvolved = async (
  clientId: string
): Promise<number> => {
  try {
    if (!clientId) {
      return 0;
    }

    // Step 1: Get all SOP IDs for this client
    const { data: sops, error: sopsError } = await (supabase as any)
      .from('sop')
      .select('id')
      .eq('client_id', clientId);

    if (sopsError) {
      console.error('Error fetching SOPs:', sopsError);
      return 0;
    }

    if (!sops || sops.length === 0) {
      return 0;
    }

    const sopIds = sops.map((s) => s.id);

    // Step 2: Get all assignments with group details for these SOPs
    const { data: assignedData, error: assignedError } = await (supabase as any)
      .from('sop_assigned')
      .select(`
        sop_id,
        group:groups (
          id,
          group_employees:group_employees!group_employees_group_id_fkey (
            employee_id
          )
        )
      `)
      .eq('client_id', clientId)
      .in('sop_id', sopIds)
      .not('group_id', 'is', null);

    if (assignedError) {
      console.error('Error fetching assigned groups:', assignedError);
      return 0;
    }

    if (!assignedData || assignedData.length === 0) {
      return 0;
    }

    // Step 3: Calculate employee count per SOP and sum them
    const employeeCountBySopId = new Map<string, Set<string>>();

    assignedData.forEach((assignment: any) => {
      const sopId = assignment.sop_id;
      const group = assignment.group;

      if (!sopId || !group) return;

      // Initialize Set for this SOP if not exists
      if (!employeeCountBySopId.has(sopId)) {
        employeeCountBySopId.set(sopId, new Set<string>());
      }

      const employeeSet = employeeCountBySopId.get(sopId)!;

      // Add all employees from this group to the SOP's employee set
      const groupEmployees = group.group_employees || [];
      groupEmployees.forEach((ge: any) => {
        if (ge.employee_id) {
          employeeSet.add(ge.employee_id);
        }
      });
    });

    // Step 4: Sum up all employee counts (each SOP's unique employee count)
    let totalEmployees = 0;
    employeeCountBySopId.forEach((employeeSet) => {
      totalEmployees += employeeSet.size;
    });

    return totalEmployees;
  } catch (error) {
    console.error('Error in getTotalEmployeesInvolved:', error);
    return 0;
  }
};

/**
 * Get total count of SOPs that have been signed off
 * A SOP is considered signed off if at least one employee has completed it (completed_count > 0)
 * This matches the logic used in the "Completed" column per SOP
 */
export const getTotalSOPsSignedOff = async (
  clientId: string
): Promise<number> => {
  try {
    if (!clientId) {
      return 0;
    }

    // Get all SOP IDs for this client
    const { data: sops, error: sopsError } = await (supabase as any)
      .from('sop')
      .select('id')
      .eq('client_id', clientId);

    if (sopsError) {
      console.error('Error fetching SOPs:', sopsError);
      return 0;
    }

    if (!sops || sops.length === 0) {
      return 0;
    }

    const sopIds = sops.map((s) => s.id);

    // For each SOP, calculate completed_count (unique employees who signed off)
    // Sum all completed_count values across all SOPs
    let totalCompletedCount = 0;
    const sopDetails: Array<{ sopId: string; completedCount: number }> = [];

    console.log('[getTotalSOPsSignedOff] Total SOPs found:', sopIds.length);
    console.log('[getTotalSOPsSignedOff] SOP IDs:', sopIds);

    for (const sopId of sopIds) {
      // Get unique employees who have signed off for this SOP
      const { data: signoffRequests, error: signoffError } = await (supabase as any)
        .from('sop_signoff_request')
        .select('employee_id')
        .eq('client_id', clientId)
        .eq('sop_id', sopId)
        .not('completed_date', 'is', null);

      if (signoffError) {
        console.error(`[getTotalSOPsSignedOff] Error fetching signoff requests for SOP ${sopId}:`, signoffError);
        continue;
      }

      let completedCount = 0;
      if (signoffRequests && signoffRequests.length > 0) {
        // Count unique employees who signed off
        const uniqueEmployees = new Set(
          signoffRequests.map((sr: any) => sr.employee_id).filter(Boolean)
        );
        
        completedCount = uniqueEmployees.size;
        console.log(`[getTotalSOPsSignedOff] SOP ${sopId}: ${completedCount} unique employees signed off`);
      } else {
        console.log(`[getTotalSOPsSignedOff] SOP ${sopId}: No signoff requests found`);
      }
      
      sopDetails.push({ sopId, completedCount });
      totalCompletedCount += completedCount;
    }

    console.log('[getTotalSOPsSignedOff] SOP Details:', sopDetails);
    console.log('[getTotalSOPsSignedOff] Final total completed count (sum):', totalCompletedCount);

    return totalCompletedCount;
  } catch (error) {
    console.error('Error in getTotalSOPsSignedOff:', error);
    return 0;
  }
};

/**
 * Get total count of employees that need to complete SOPs (To be Done)
 * This sums up the to_be_done_count across all SOPs
 * to_be_done_count = assigned_employee_count - completed_count per SOP
 */
export const getTotalSOPsToBeDone = async (
  clientId: string
): Promise<number> => {
  try {
    if (!clientId) {
      return 0;
    }

    // Get all SOP IDs for this client
    const { data: sops, error: sopsError } = await (supabase as any)
      .from('sop')
      .select('id')
      .eq('client_id', clientId);

    if (sopsError) {
      console.error('Error fetching SOPs:', sopsError);
      return 0;
    }

    if (!sops || sops.length === 0) {
      return 0;
    }

    const sopIds = sops.map((s) => s.id);

    // Get all assignments with group details for these SOPs
    const { data: assignedData, error: assignedError } = await (supabase as any)
      .from('sop_assigned')
      .select(`
        sop_id,
        group:groups (
          id,
          group_employees:group_employees!group_employees_group_id_fkey (
            employee_id
          )
        )
      `)
      .eq('client_id', clientId)
      .in('sop_id', sopIds)
      .not('group_id', 'is', null);

    if (assignedError) {
      console.error('Error fetching assigned groups:', assignedError);
      return 0;
    }

    // Calculate assigned_employee_count and completed_count per SOP
    const employeeCountBySopId = new Map<string, Set<string>>();
    const completedCountBySopId = new Map<string, Set<string>>();

    // Process assignments to get assigned employees per SOP
    assignedData?.forEach((assignment: any) => {
      const sopId = assignment.sop_id;
      const group = assignment.group;

      if (!sopId || !group) return;

      if (!employeeCountBySopId.has(sopId)) {
        employeeCountBySopId.set(sopId, new Set<string>());
      }

      const employeeSet = employeeCountBySopId.get(sopId)!;
      const groupEmployees = group.group_employees || [];
      groupEmployees.forEach((ge: any) => {
        if (ge.employee_id) {
          employeeSet.add(ge.employee_id);
        }
      });
    });

    // Get completed signoffs per SOP
    for (const sopId of sopIds) {
      const { data: signoffRequests, error: signoffError } = await (supabase as any)
        .from('sop_signoff_request')
        .select('employee_id')
        .eq('client_id', clientId)
        .eq('sop_id', sopId)
        .not('completed_date', 'is', null);

      if (!signoffError && signoffRequests) {
        const completedSet = new Set<string>(
          signoffRequests.map((sr: any) => sr.employee_id).filter(Boolean) as string[]
        );
        completedCountBySopId.set(sopId, completedSet);
      }
    }

    // Calculate to_be_done_count for each SOP and sum them
    let totalToBeDone = 0;
    const sopToBeDoneDetails: Array<{
      sopId: string;
      assignedCount: number;
      completedCount: number;
      toBeDoneCount: number;
    }> = [];

    console.log('[getTotalSOPsToBeDone] Processing SOPs for to_be_done calculation');
    console.log('[getTotalSOPsToBeDone] Total SOPs:', sopIds.length);
    console.log('[getTotalSOPsToBeDone] Employee count by SOP:', Array.from(employeeCountBySopId.entries()).map(([id, set]) => ({ sopId: id, count: set.size })));
    console.log('[getTotalSOPsToBeDone] Completed count by SOP:', Array.from(completedCountBySopId.entries()).map(([id, set]) => ({ sopId: id, count: set.size })));

    employeeCountBySopId.forEach((assignedSet, sopId) => {
      const assignedCount = assignedSet.size;
      const completedSet = completedCountBySopId.get(sopId) || new Set<string>();
      const completedCount = completedSet.size;
      const toBeDoneCount = Math.max(0, assignedCount - completedCount);
      
      sopToBeDoneDetails.push({
        sopId,
        assignedCount,
        completedCount,
        toBeDoneCount,
      });
      
      console.log(`[getTotalSOPsToBeDone] SOP ${sopId}: Assigned=${assignedCount}, Completed=${completedCount}, ToBeDone=${toBeDoneCount}`);
      
      totalToBeDone += toBeDoneCount;
    });

    console.log('[getTotalSOPsToBeDone] SOP Details:', sopToBeDoneDetails);
    console.log('[getTotalSOPsToBeDone] Final total to be done:', totalToBeDone);

    return totalToBeDone;
  } catch (error) {
    console.error('Error in getTotalSOPsToBeDone:', error);
    return 0;
  }
};

/**
 * Get all statistics at once (for convenience)
 */
export interface SOPStatistics {
  totalSOPs: number;
  totalEmployeesInvolved: number;
  totalSOPsSignedOff: number;
  totalSOPsToBeDone: number;
}

/**
 * Get employee-specific SOP statistics
 * For non-super admin users: counts SOPs assigned to this employee
 */
export interface EmployeeSOPStatistics {
  totalSOPs: number; // Total SOPs assigned to this employee
  totalSOPsSignedOff: number; // Total SOPs signed off by this employee
  totalSOPsToBeDone: number; // Remaining SOPs to be done
}

/**
 * Get SOP statistics for all employees in a single batch query
 * This is much more efficient than calling getEmployeeSOPStatistics for each employee
 */
export const getBatchEmployeeSOPStatistics = async (
  clientId: string,
  employeeIds: string[]
): Promise<Map<string, EmployeeSOPStatistics>> => {
  const statsMap = new Map<string, EmployeeSOPStatistics>();
  
  try {
    if (!clientId || !employeeIds || employeeIds.length === 0) {
      // Initialize all employees with zero stats
      employeeIds.forEach(id => {
        statsMap.set(id, {
          totalSOPs: 0,
          totalSOPsSignedOff: 0,
          totalSOPsToBeDone: 0,
        });
      });
      return statsMap;
    }

    console.log('[getBatchEmployeeSOPStatistics] Fetching stats for', employeeIds.length, 'employees with clientId:', clientId);

    // Step 1: Get all group memberships for all employees
    const { data: allEmployeeGroups, error: groupsError } = await (supabase as any)
      .from('group_employees')
      .select('employee_id, group_id')
      .in('employee_id', employeeIds);

    if (groupsError) {
      console.error('[getBatchEmployeeSOPStatistics] Error fetching employee groups:', groupsError);
      employeeIds.forEach(id => {
        statsMap.set(id, { totalSOPs: 0, totalSOPsSignedOff: 0, totalSOPsToBeDone: 0 });
      });
      return statsMap;
    }

    console.log('[getBatchEmployeeSOPStatistics] Found', allEmployeeGroups?.length || 0, 'group memberships');

    // Group by employee_id
    const groupsByEmployee = new Map<string, string[]>();
    (allEmployeeGroups || []).forEach((eg: any) => {
      if (!groupsByEmployee.has(eg.employee_id)) {
        groupsByEmployee.set(eg.employee_id, []);
      }
      if (eg.group_id) {
        groupsByEmployee.get(eg.employee_id)!.push(eg.group_id);
      }
    });

    console.log('[getBatchEmployeeSOPStatistics] Employees with groups:', groupsByEmployee.size);
    groupsByEmployee.forEach((groupIds, empId) => {
      console.log(`  Employee ${empId}: ${groupIds.length} groups`, groupIds);
    });

    // Step 2: Get all unique group IDs
    const allGroupIds = Array.from(new Set(
      Array.from(groupsByEmployee.values()).flat()
    ));

    console.log('[getBatchEmployeeSOPStatistics] Unique group IDs:', allGroupIds.length, allGroupIds);

    if (allGroupIds.length === 0) {
      console.log('[getBatchEmployeeSOPStatistics] No groups found for any employee - returning 0 counts');
      employeeIds.forEach(id => {
        statsMap.set(id, { totalSOPs: 0, totalSOPsSignedOff: 0, totalSOPsToBeDone: 0 });
      });
      return statsMap;
    }

    // Step 3: Get all SOP assignments for these groups
    const { data: allAssignedSOPs, error: assignedError } = await (supabase as any)
      .from('sop_assigned')
      .select('sop_id, group_id')
      .eq('client_id', clientId)
      .in('group_id', allGroupIds);

    if (assignedError) {
      console.error('[getBatchEmployeeSOPStatistics] Error fetching assigned SOPs:', assignedError);
      employeeIds.forEach(id => {
        statsMap.set(id, { totalSOPs: 0, totalSOPsSignedOff: 0, totalSOPsToBeDone: 0 });
      });
      return statsMap;
    }

    console.log('[getBatchEmployeeSOPStatistics] Found', allAssignedSOPs?.length || 0, 'SOP assignments');

    // Step 4: Map SOPs to employees (via groups)
    const sopsByEmployee = new Map<string, Set<string>>();
    employeeIds.forEach(id => {
      sopsByEmployee.set(id, new Set<string>());
    });

    (allAssignedSOPs || []).forEach((assignment: any) => {
      if (!assignment.sop_id || !assignment.group_id) return;
      
      // Find all employees in this group
      groupsByEmployee.forEach((groupIds, employeeId) => {
        if (groupIds.includes(assignment.group_id)) {
          sopsByEmployee.get(employeeId)?.add(assignment.sop_id);
        }
      });
    });

    // Log SOP counts per employee
    console.log('[getBatchEmployeeSOPStatistics] SOPs by employee:');
    sopsByEmployee.forEach((sopSet, empId) => {
      if (sopSet.size > 0) {
        console.log(`  Employee ${empId}: ${sopSet.size} SOPs`, Array.from(sopSet));
      }
    });

    // Step 5: Get all signoff requests for all employees and SOPs
    const allSopIds = Array.from(new Set(
      Array.from(sopsByEmployee.values()).flatMap(set => Array.from(set))
    ));

    console.log('[getBatchEmployeeSOPStatistics] Unique SOP IDs:', allSopIds.length, allSopIds);

    // Calculate stats for each employee (even if no signoffs)
    employeeIds.forEach(employeeId => {
      const totalSOPs = sopsByEmployee.get(employeeId)?.size || 0;
      let totalSOPsSignedOff = 0;
      let totalSOPsToBeDone = totalSOPs;

      // If there are SOPs, check for signoffs
      if (totalSOPs > 0 && allSopIds.length > 0) {
        // Get signoff requests for this employee and their SOPs
        const employeeSopIds = Array.from(sopsByEmployee.get(employeeId) || []);
        
        // We'll fetch signoffs in batch, but for now calculate what we can
        // The signoff check will be done in the next step
      }

      // Initialize with totalSOPs (signoffs will be updated below if available)
      statsMap.set(employeeId, {
        totalSOPs,
        totalSOPsSignedOff: 0,
        totalSOPsToBeDone: totalSOPs,
      });
    });

    // Step 6: Get all signoff requests for all employees and SOPs (if there are any SOPs)
    if (allSopIds.length > 0) {
      const { data: allSignoffRequests, error: signoffError } = await (supabase as any)
        .from('sop_signoff_request')
        .select('sop_id, employee_id')
        .eq('client_id', clientId)
        .in('employee_id', employeeIds)
        .in('sop_id', allSopIds)
        .not('completed_date', 'is', null);

      if (!signoffError && allSignoffRequests) {
        console.log('[getBatchEmployeeSOPStatistics] Found', allSignoffRequests.length, 'signoff requests');
        
        // Group signoffs by employee_id
        const signoffsByEmployee = new Map<string, Set<string>>();
        employeeIds.forEach(id => {
          signoffsByEmployee.set(id, new Set<string>());
        });

        allSignoffRequests.forEach((sr: any) => {
          if (sr.employee_id && sr.sop_id) {
            signoffsByEmployee.get(sr.employee_id)?.add(sr.sop_id);
          }
        });

        // Update stats with signoff counts
        employeeIds.forEach(employeeId => {
          const totalSOPs = sopsByEmployee.get(employeeId)?.size || 0;
          const totalSOPsSignedOff = signoffsByEmployee.get(employeeId)?.size || 0;
          const totalSOPsToBeDone = Math.max(0, totalSOPs - totalSOPsSignedOff);

          statsMap.set(employeeId, {
            totalSOPs,
            totalSOPsSignedOff,
            totalSOPsToBeDone,
          });
        });
      } else if (signoffError) {
        console.error('[getBatchEmployeeSOPStatistics] Error fetching signoff requests:', signoffError);
        // Stats already initialized above with totalSOPs
      }
    }

    console.log('[getBatchEmployeeSOPStatistics] Final stats:');
    statsMap.forEach((stats, empId) => {
      if (stats.totalSOPs > 0 || stats.totalSOPsSignedOff > 0) {
        console.log(`  Employee ${empId}: Total=${stats.totalSOPs}, SignedOff=${stats.totalSOPsSignedOff}, ToBeDone=${stats.totalSOPsToBeDone}`);
      }
    });
    console.log('[getBatchEmployeeSOPStatistics] Completed for', statsMap.size, 'employees');
    return statsMap;
  } catch (error) {
    console.error('[getBatchEmployeeSOPStatistics] Error:', error);
    employeeIds.forEach(id => {
      statsMap.set(id, { totalSOPs: 0, totalSOPsSignedOff: 0, totalSOPsToBeDone: 0 });
    });
    return statsMap;
  }
};

export const getEmployeeSOPStatistics = async (
  clientId: string,
  employeeId: string
): Promise<EmployeeSOPStatistics> => {
  try {
    if (!clientId || !employeeId) {
      return {
        totalSOPs: 0,
        totalSOPsSignedOff: 0,
        totalSOPsToBeDone: 0,
      };
    }

    console.log('[getEmployeeSOPStatistics] Starting calculation for clientId:', clientId, 'employeeId:', employeeId);

    // Step 1: Find groups this employee belongs to
    const { data: employeeGroups, error: groupsError } = await (supabase as any)
      .from('group_employees')
      .select('group_id')
      .eq('employee_id', employeeId);

    if (groupsError) {
      console.error('[getEmployeeSOPStatistics] Error fetching employee groups:', groupsError);
      return {
        totalSOPs: 0,
        totalSOPsSignedOff: 0,
        totalSOPsToBeDone: 0,
      };
    }

    console.log('[getEmployeeSOPStatistics] Employee groups found:', employeeGroups?.length || 0, employeeGroups);

    if (!employeeGroups || employeeGroups.length === 0) {
      console.log('[getEmployeeSOPStatistics] Employee has no groups - returning 0 counts');
      return {
        totalSOPs: 0,
        totalSOPsSignedOff: 0,
        totalSOPsToBeDone: 0,
      };
    }

    const groupIds = employeeGroups.map((eg: any) => eg.group_id).filter(Boolean);
    console.log('[getEmployeeSOPStatistics] Group IDs:', groupIds);

    // Step 2: Find SOPs assigned to these groups
    const { data: assignedSOPs, error: assignedError } = await (supabase as any)
      .from('sop_assigned')
      .select('sop_id')
      .eq('client_id', clientId)
      .in('group_id', groupIds);

    if (assignedError) {
      console.error('[getEmployeeSOPStatistics] Error fetching assigned SOPs:', assignedError);
      return {
        totalSOPs: 0,
        totalSOPsSignedOff: 0,
        totalSOPsToBeDone: 0,
      };
    }

    console.log('[getEmployeeSOPStatistics] Assigned SOPs found:', assignedSOPs?.length || 0, assignedSOPs);

    if (!assignedSOPs || assignedSOPs.length === 0) {
      console.log('[getEmployeeSOPStatistics] No SOPs assigned to employee groups - returning 0 counts');
      return {
        totalSOPs: 0,
        totalSOPsSignedOff: 0,
        totalSOPsToBeDone: 0,
      };
    }

    // Step 3: Deduplicate SOP IDs
    const uniqueSopIds = Array.from(new Set(assignedSOPs.map((as: any) => as.sop_id).filter(Boolean)));
    const totalSOPs = uniqueSopIds.length;

    // Step 4: Count how many SOPs this employee has signed off
    const { data: signoffRequests, error: signoffError } = await (supabase as any)
      .from('sop_signoff_request')
      .select('sop_id')
      .eq('client_id', clientId)
      .eq('employee_id', employeeId)
      .in('sop_id', uniqueSopIds)
      .not('completed_date', 'is', null);

    if (signoffError) {
      console.error('Error fetching signoff requests:', signoffError);
      return {
        totalSOPs,
        totalSOPsSignedOff: 0,
        totalSOPsToBeDone: totalSOPs,
      };
    }

    const uniqueSignedOffSopIds = new Set(
      (signoffRequests || []).map((sr: any) => sr.sop_id).filter(Boolean)
    );
    const totalSOPsSignedOff = uniqueSignedOffSopIds.size;
    const totalSOPsToBeDone = Math.max(0, totalSOPs - totalSOPsSignedOff);

    console.log('[getEmployeeSOPStatistics] Results:', {
      totalSOPs,
      totalSOPsSignedOff,
      totalSOPsToBeDone,
    });

    return {
      totalSOPs,
      totalSOPsSignedOff,
      totalSOPsToBeDone,
    };
  } catch (error) {
    console.error('Error in getEmployeeSOPStatistics:', error);
    return {
      totalSOPs: 0,
      totalSOPsSignedOff: 0,
      totalSOPsToBeDone: 0,
    };
  }
};

export const getAllSOPStatistics = async (
  clientId: string,
  employeeId?: string | null
): Promise<SOPStatistics> => {
  try {
    console.log('[getAllSOPStatistics] Starting calculation for clientId:', clientId, 'employeeId:', employeeId);
    
    const [totalSOPs, totalEmployeesInvolved, totalSOPsSignedOff, totalSOPsToBeDone] = await Promise.all([
      getTotalSOPsCount(clientId, employeeId),
      getTotalEmployeesInvolved(clientId),
      getTotalSOPsSignedOff(clientId),
      getTotalSOPsToBeDone(clientId), // Fixed: Call the function instead of calculating incorrectly
    ]);

    console.log('[getAllSOPStatistics] Results:', {
      totalSOPs,
      totalEmployeesInvolved,
      totalSOPsSignedOff,
      totalSOPsToBeDone,
    });

    return {
      totalSOPs,
      totalEmployeesInvolved,
      totalSOPsSignedOff,
      totalSOPsToBeDone,
    };
  } catch (error) {
    console.error('Error in getAllSOPStatistics:', error);
    return {
      totalSOPs: 0,
      totalEmployeesInvolved: 0,
      totalSOPsSignedOff: 0,
      totalSOPsToBeDone: 0,
    };
  }
};

