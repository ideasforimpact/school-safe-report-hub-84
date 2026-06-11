import { supabase } from '@/integrations/supabase/client';
import { AssessmentAuditLogEntry, AssessmentAuditLogEntryWithUser } from '@/types/assessmentAudit';

export const assessmentAuditLogService = {
  async getAuditLogs(assessmentId: string): Promise<AssessmentAuditLogEntryWithUser[]> {
    // First get the audit logs
    const { data: auditData, error: auditError } = await supabase
      .from('assessment_audit_log')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('changed_at', { ascending: false });

    if (auditError) {
      console.error('Failed to fetch assessment audit logs:', auditError);
      throw auditError;
    }

    if (!auditData || auditData.length === 0) {
      return [];
    }

    // Get unique user IDs
    const userIds = [...new Set(auditData.map(log => log.changed_by).filter(Boolean))];

    // Fetch user details
    const { data: userData, error: userError } = await supabase
      .from('employees')
      .select('user_id, first_name, last_name, email')
      .in('user_id', userIds);

    if (userError) {
      console.warn('Failed to fetch user details:', userError);
    }

    // Create a user lookup map
    const userMap = new Map();
    if (userData) {
      userData.forEach(user => {
        userMap.set(user.user_id, {
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email
        });
      });
    }

    // Combine audit logs with user data
    return auditData.map(log => ({
      ...log,
      changed_by_user: log.changed_by ? userMap.get(log.changed_by) : undefined
    })) as AssessmentAuditLogEntryWithUser[];
  },

  async createAuditLog(entry: Omit<AssessmentAuditLogEntry, 'id' | 'changed_at'>): Promise<string> {
    const { data, error } = await supabase
      .from('assessment_audit_log')
      .insert(entry)
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create assessment audit log:', error);
      throw error;
    }

    return data.id;
  },

  // Manual logging functions for specific actions
  async logAssessmentAssignment(
    assessmentId: string,
    clientId: string,
    assignedToId: string,
    assignedBy: string,
    previousAssigneeId?: string
  ): Promise<void> {
    await this.createAuditLog({
      assessment_id: assessmentId,
      client_id: clientId,
      field_changed: 'assigned_to',
      old_value: previousAssigneeId || null,
      new_value: assignedToId,
      changed_by: assignedBy,
      change_type: 'assignment',
      description: 'Assessment assigned to user',
      metadata: {}
    });
  },

  async logAssessmentSubmission(
    assessmentId: string,
    clientId: string,
    submittedBy: string,
    score?: number
  ): Promise<void> {
    await this.createAuditLog({
      assessment_id: assessmentId,
      client_id: clientId,
      field_changed: 'status',
      old_value: 'In Progress',
      new_value: 'Submitted',
      changed_by: submittedBy,
      change_type: 'status_change',
      description: `Assessment submitted${score !== undefined ? ` with score ${score}` : ''}`,
      metadata: { score }
    });
  },

  async logAssessmentCompletion(
    assessmentId: string,
    clientId: string,
    completedBy: string,
    closureComments?: string
  ): Promise<void> {
    await this.createAuditLog({
      assessment_id: assessmentId,
      client_id: clientId,
      field_changed: 'status',
      old_value: 'Submitted',
      new_value: 'Completed',
      changed_by: completedBy,
      change_type: 'completion',
      description: 'Assessment marked as completed',
      metadata: { closure_comments: closureComments }
    });
  },

  async logAssessmentRework(
    assessmentId: string,
    clientId: string,
    reworkBy: string,
    reworkComments: string
  ): Promise<void> {
    await this.createAuditLog({
      assessment_id: assessmentId,
      client_id: clientId,
      field_changed: 'status',
      old_value: 'Submitted',
      new_value: 'Draft',
      changed_by: reworkBy,
      change_type: 'rework',
      description: 'Assessment sent back for rework',
      metadata: { rework_comments: reworkComments }
    });
  }
};