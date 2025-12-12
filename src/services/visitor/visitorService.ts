import { supabase } from '@/integrations/supabase/client';

export interface VisitorKYC {
  id: string;
  client_id: string;
  employee_id: string;
  visitor_id: string;
  document_type: string;
  document_no: string;
  created_at: string;
  updated_at: string;
}

export interface VisitorEvidenceFile {
  name: string;
  path: string;
  url: string;
  type: string;
}

export interface Visitor {
  id: string;
  name: string;
  mobile_no: string;
  purpose: string;
  whom_to_meet: string;
  evidence_files: VisitorEvidenceFile[];
  client_id: string;
  employee_id: string;
  created_at: string;
  updated_at: string;
  vehicle_no?: string | null;
  vehicle_type?: string | null;
  is_exit: boolean;
  visitor_kyc: VisitorKYC[];
}

export interface VisitorResponse {
  data: Visitor[];
}

export const visitorService = {
  /**
   * Get all visitors for a specific client and employee
   * Fetches visitors with their corresponding KYC details as an array of objects
   */
  async getVisitors(clientId: string, employeeId?: string | null): Promise<Visitor[]> {
    try {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      // Build query to fetch visitors with nested KYC details
      // Using type assertion because visitors table may not be in generated types yet
      let query = (supabase as any)
        .from('visitors')
        .select(`
          id,
          name,
          mobile_no,
          purpose,
          whom_to_meet,
          evidence_files,
          client_id,
          employee_id,
          created_at,
          updated_at,
          vehicle_no,
          vehicle_type,
          is_exit,
          visitor_kyc (
            id,
            client_id,
            employee_id,
            visitor_id,
            document_type,
            document_no,
            created_at,
            updated_at
          )
        `)
        .eq('client_id', clientId);

      // Optionally filter by employee_id if provided
      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching visitors:', error);
        throw new Error(`Failed to fetch visitors: ${error.message}`);
      }

      // Transform the data to ensure visitor_kyc is always an array
      const visitors: Visitor[] = (data || []).map((visitor: any) => ({
        ...visitor,
        visitor_kyc: Array.isArray(visitor.visitor_kyc) ? visitor.visitor_kyc : [],
        evidence_files: Array.isArray(visitor.evidence_files) ? visitor.evidence_files : []
      }));

      return visitors;
    } catch (error) {
      console.error('Error in getVisitors:', error);
      throw error;
    }
  },

  /**
   * Get a single visitor by ID
   */
  async getVisitorById(visitorId: string, clientId: string): Promise<Visitor> {
    try {
      if (!visitorId) {
        throw new Error('Visitor ID is required');
      }

      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const { data, error } = await (supabase as any)
        .from('visitors')
        .select(`
          id,
          name,
          mobile_no,
          purpose,
          whom_to_meet,
          evidence_files,
          client_id,
          employee_id,
          created_at,
          updated_at,
          vehicle_no,
          vehicle_type,
          is_exit,
          visitor_kyc (
            id,
            client_id,
            employee_id,
            visitor_id,
            document_type,
            document_no,
            created_at,
            updated_at
          )
        `)
        .eq('id', visitorId)
        .eq('client_id', clientId)
        .single();

      if (error) {
        console.error('Error fetching visitor:', error);
        throw new Error(`Failed to fetch visitor: ${error.message}`);
      }

      if (!data) {
        throw new Error('Visitor not found');
      }

      // Ensure visitor_kyc is always an array
      return {
        ...data,
        visitor_kyc: Array.isArray(data.visitor_kyc) ? data.visitor_kyc : [],
        evidence_files: Array.isArray(data.evidence_files) ? data.evidence_files : []
      } as Visitor;
    } catch (error) {
      console.error('Error in getVisitorById:', error);
      throw error;
    }
  },

  /**
   * Create a new visitor
   */
  async createVisitor(visitorData: {
    name: string;
    mobile_no: string;
    purpose: string;
    whom_to_meet: string;
    client_id: string;
    employee_id?: string | null;
    vehicle_no?: string | null;
    vehicle_type?: string | null;
    files?: Array<{ name: string; type: string; base64: string }>;
    kyc_details?: Array<{ document_type: string; document_no: string }>;
  }): Promise<Visitor> {
    try {
      // Insert visitor record
      const { data: visitor, error: visitorError } = await (supabase as any)
        .from('visitors')
        .insert({
          name: visitorData.name,
          mobile_no: visitorData.mobile_no,
          purpose: visitorData.purpose,
          whom_to_meet: visitorData.whom_to_meet,
          client_id: visitorData.client_id,
          employee_id: visitorData.employee_id,
          vehicle_no: visitorData.vehicle_no,
          vehicle_type: visitorData.vehicle_type,
          evidence_files: visitorData.files ? [] : [],
          is_exit: false
        })
        .select()
        .single();

      if (visitorError || !visitor) {
        throw new Error(`Failed to create visitor: ${visitorError?.message || 'Unknown error'}`);
      }

      // Insert KYC details if provided
      if (visitorData.kyc_details && visitorData.kyc_details.length > 0) {
        const kycRecords = visitorData.kyc_details.map(kyc => ({
          visitor_id: visitor.id,
          client_id: visitorData.client_id,
          employee_id: visitorData.employee_id,
          document_type: kyc.document_type,
          document_no: kyc.document_no
        }));

        const { error: kycError } = await (supabase as any)
          .from('visitor_kyc')
          .insert(kycRecords);

        if (kycError) {
          console.error('Error creating KYC records:', kycError);
          // Continue even if KYC insertion fails
        }
      }

      // Fetch the complete visitor with KYC details
      return await this.getVisitorById(visitor.id, visitorData.client_id);
    } catch (error) {
      console.error('Error in createVisitor:', error);
      throw error;
    }
  },

  /**
   * Update an existing visitor
   */
  async updateVisitor(
    visitorId: string,
    clientId: string,
    updates: {
    name?: string;
    mobile_no?: string;
    purpose?: string;
    whom_to_meet?: string;
    employee_id?: string;
    vehicle_no?: string | null;
    vehicle_type?: string | null;
    files?: Array<{ name: string; type: string; base64: string }>;
    kyc_details?: Array<{ document_type: string; document_no: string }>;
    }
  ): Promise<Visitor> {
    try {
      // Update visitor record
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.mobile_no !== undefined) updateData.mobile_no = updates.mobile_no;
      if (updates.purpose !== undefined) updateData.purpose = updates.purpose;
      if (updates.whom_to_meet !== undefined) updateData.whom_to_meet = updates.whom_to_meet;
      if (updates.employee_id !== undefined) updateData.employee_id = updates.employee_id;
      if (updates.vehicle_no !== undefined) updateData.vehicle_no = updates.vehicle_no;
      if (updates.vehicle_type !== undefined) updateData.vehicle_type = updates.vehicle_type;

      const { error: visitorError } = await (supabase as any)
        .from('visitors')
        .update(updateData)
        .eq('id', visitorId)
        .eq('client_id', clientId);

      if (visitorError) {
        throw new Error(`Failed to update visitor: ${visitorError.message}`);
      }

      // Update KYC details if provided
      if (updates.kyc_details !== undefined) {
        // Delete existing KYC records
        const { error: deleteError } = await (supabase as any)
          .from('visitor_kyc')
          .delete()
          .eq('visitor_id', visitorId)
          .eq('client_id', clientId);

        if (deleteError) {
          console.error('Error deleting existing KYC records:', deleteError);
        }

        // Insert new KYC records
        if (updates.kyc_details.length > 0) {
          const kycRecords = updates.kyc_details.map(kyc => ({
            visitor_id: visitorId,
            client_id: clientId,
            employee_id: updates.employee_id || null,
            document_type: kyc.document_type,
            document_no: kyc.document_no
          }));

          const { error: kycError } = await (supabase as any)
            .from('visitor_kyc')
            .insert(kycRecords);

          if (kycError) {
            console.error('Error creating KYC records:', kycError);
      }
        }
      }

      // Fetch the updated visitor with KYC details
      return await this.getVisitorById(visitorId, clientId);
    } catch (error) {
      console.error('Error in updateVisitor:', error);
      throw error;
    }
  },

  /**
   * Delete a visitor
   */
  async deleteVisitor(visitorId: string, clientId: string): Promise<void> {
    try {
      // Delete KYC records first (due to foreign key constraint)
      const { error: kycError } = await (supabase as any)
        .from('visitor_kyc')
        .delete()
        .eq('visitor_id', visitorId)
        .eq('client_id', clientId);

      if (kycError) {
        console.error('Error deleting KYC records:', kycError);
      }

      // Delete visitor record
      const { error: visitorError } = await (supabase as any)
        .from('visitors')
        .delete()
        .eq('id', visitorId)
        .eq('client_id', clientId);

      if (visitorError) {
        throw new Error(`Failed to delete visitor: ${visitorError.message}`);
      }
    } catch (error) {
      console.error('Error in deleteVisitor:', error);
      throw error;
    }
  },

  /**
   * Mark visitor as exited
   */
  async markVisitorAsExited(visitorId: string, clientId: string, employeeId: string): Promise<Visitor> {
    try {
      const { error } = await (supabase as any)
        .from('visitors')
        .update({ is_exit: true })
        .eq('id', visitorId)
        .eq('client_id', clientId);

      if (error) {
        console.error('Error marking visitor as exited:', error);
        throw new Error(`Failed to mark visitor as exited: ${error.message}`);
      }

      // Fetch the updated visitor
      return await this.getVisitorById(visitorId, clientId);
    } catch (error) {
      console.error('Error in markVisitorAsExited:', error);
      throw error;
    }
  }
};

