
import { supabase } from '@/integrations/supabase/client';
import { AssessmentTemplate, AssessmentQuestion } from '@/types/assessment';

export interface TemplateCategory {
  id: string;
  name: string;
  description: string | null;
}

export interface DatabaseTemplate {
  id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  category_id: string | null;
  questions: any;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  template_categories?: {
    name: string;
  };
}

export const templateService = {
  async checkDuplicateTemplate(title: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('assessment_templates')
        .select('id')
        .eq('title', title.trim());

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data && data.length > 0;
    } catch (error: any) {
      console.error('Error checking duplicate template:', error);
      return false;
    }
  },

  async getTemplateCategories(): Promise<TemplateCategory[]> {
    const { data, error } = await supabase
      .from('template_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching template categories:', error);
      throw error;
    }

    return data || [];
  },

  async getTemplates(): Promise<AssessmentTemplate[]> {
    const { data, error } = await supabase
      .from('assessment_templates')
      .select(`
        *,
        template_categories (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }

    return (data || []).map(this.mapDatabaseTemplateToAssessmentTemplate);
  },

  async createTemplate(template: {
    title: string;
    description: string;
    type: string;
    questions: AssessmentQuestion[];
  }): Promise<string> {
    console.log('Creating template with data:', template);
    
    // Check for duplicate title
    const isDuplicate = await this.checkDuplicateTemplate(template.title);
    if (isDuplicate) {
      throw new Error('A template with this title already exists');
    }
    
    // Get category ID by name
    const { data: category } = await supabase
      .from('template_categories')
      .select('id')
      .eq('name', template.type)
      .single();

    // Add IDs to questions if they don't have them, preserve existing files
    const questionsWithIds = template.questions.map((q, index) => ({
      ...q,
      id: q.id || `q_${Date.now()}_${index}`,
      files: q.files || [] // Preserve existing files or initialize empty array
    }));
    
    console.log('Questions being saved to database:', JSON.stringify(questionsWithIds, null, 2));

    // Try to get the current user, but don't fail if not authenticated
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user);
    
    let employeeId = null;
    let clientId = null;

    // Only try to get employee data if user is authenticated
    if (user) {
      const { data: employee } = await supabase
        .from('employees')
        .select('id, client_id')
        .eq('user_id', user.id)
        .single();
      
      if (employee) {
        employeeId = employee.id;
        clientId = employee.client_id;
      }
    }

    console.log('Employee ID:', employeeId);
    console.log('Client ID:', clientId);

    const { data, error } = await supabase
      .from('assessment_templates')
      .insert({
        client_id: clientId,
        title: template.title,
        description: template.description,
        category_id: category?.id || null,
        questions: questionsWithIds as any,
        created_by: employeeId,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      throw error;
    }

    console.log('Template created successfully:', data);
    return data.id;
  },

  async updateTemplate(id: string, updates: Partial<AssessmentTemplate>): Promise<void> {
    const updateData: any = {};

    if (updates.title) {
      // Check for duplicate title (excluding current template)
      const isDuplicate = await this.checkDuplicateTemplate(updates.title, id);
      if (isDuplicate) {
        throw new Error('A template with this title already exists');
      }
      updateData.title = updates.title;
    }
    if (updates.description) updateData.description = updates.description;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    
    if (updates.type) {
      const { data: category } = await supabase
        .from('template_categories')
        .select('id')
        .eq('name', updates.type)
        .single();
      updateData.category_id = category?.id || null;
    }

    if (updates.questions) {
      console.log('Updating template with questions:', JSON.stringify(updates.questions, null, 2));
      updateData.questions = updates.questions as any;
    }

    const { error } = await supabase
      .from('assessment_templates')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  },

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('assessment_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  },

  mapDatabaseTemplateToAssessmentTemplate(dbTemplate: DatabaseTemplate): AssessmentTemplate {
    return {
      id: dbTemplate.id,
      title: dbTemplate.title,
      description: dbTemplate.description || '',
      type: dbTemplate.template_categories?.name || 'Safety',
      questions: Array.isArray(dbTemplate.questions) ? dbTemplate.questions : [],
      createdAt: dbTemplate.created_at,
      createdBy: dbTemplate.created_by || 'unknown',
      isActive: dbTemplate.is_active
    };
  }
};
