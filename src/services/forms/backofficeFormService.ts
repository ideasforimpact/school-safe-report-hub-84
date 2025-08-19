import { supabase } from '@/integrations/supabase/client';
import { CustomForm, FormSubmission } from '@/types/formTypes';

export const backofficeFormService = {
  // Fetch forms for a specific client
  async fetchForms(clientId: string): Promise<CustomForm[]> {
    try {
      console.log('Fetching forms for client:', clientId);
      
      const { data, error } = await supabase.functions.invoke('backoffice-form-management', {
        body: { 
          action: 'fetch-forms',
          data: { client_id: clientId }
        }
      });

      if (error) {
        console.error('Error calling backoffice-form-management function:', error);
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch forms');
      }

      return data.data || [];
    } catch (err) {
      console.error('Error fetching forms:', err);
      throw err;
    }
  },

  // Create a new form
  async createForm(form: Omit<CustomForm, 'id' | 'preview_url' | 'created_at' | 'updated_at'>): Promise<CustomForm> {
    try {
      console.log('Creating new form:', form.title);
      
      const { data, error } = await supabase.functions.invoke('backoffice-form-management', {
        body: { 
          action: 'create-form',
          data: { form }
        }
      });

      if (error) {
        console.error('Error calling backoffice-form-management function:', error);
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create form');
      }

      return data.data;
    } catch (err) {
      console.error('Error creating form:', err);
      throw err;
    }
  },

  // Update an existing form
  async updateForm(id: string, updates: Partial<CustomForm>): Promise<CustomForm> {
    try {
      console.log('Updating form:', id);
      
      const { data, error } = await supabase.functions.invoke('backoffice-form-management', {
        body: { 
          action: 'update-form',
          data: { id, updates }
        }
      });

      if (error) {
        console.error('Error calling backoffice-form-management function:', error);
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update form');
      }

      return data.data;
    } catch (err) {
      console.error('Error updating form:', err);
      throw err;
    }
  },

  // Delete a form
  async deleteForm(id: string): Promise<void> {
    try {
      console.log('Deleting form:', id);
      
      const { data, error } = await supabase.functions.invoke('backoffice-form-management', {
        body: { 
          action: 'delete-form',
          data: { id }
        }
      });

      if (error) {
        console.error('Error calling backoffice-form-management function:', error);
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete form');
      }
    } catch (err) {
      console.error('Error deleting form:', err);
      throw err;
    }
  },

  // Fetch submissions for a form
  async fetchSubmissions(formId: string): Promise<FormSubmission[]> {
    try {
      console.log('Fetching submissions for form:', formId);
      
      const { data, error } = await supabase.functions.invoke('backoffice-form-management', {
        body: { 
          action: 'fetch-submissions',
          data: { form_id: formId }
        }
      });

      if (error) {
        console.error('Error calling backoffice-form-management function:', error);
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch submissions');
      }

      return data.data || [];
    } catch (err) {
      console.error('Error fetching submissions:', err);
      throw err;
    }
  },

  // Update submission status
  async updateSubmissionStatus(id: string, status: FormSubmission['status'], comments?: string): Promise<FormSubmission> {
    try {
      console.log('Updating submission status:', id, status);
      
      const { data, error } = await supabase.functions.invoke('backoffice-form-management', {
        body: { 
          action: 'update-submission-status',
          data: { id, status, comments }
        }
      });

      if (error) {
        console.error('Error calling backoffice-form-management function:', error);
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update submission status');
      }

      return data.data;
    } catch (err) {
      console.error('Error updating submission status:', err);
      throw err;
    }
  }
}; 