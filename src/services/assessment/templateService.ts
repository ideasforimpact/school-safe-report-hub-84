
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
    questions: Omit<AssessmentQuestion, 'id'>[];
  }): Promise<string> {
    // Get the current user's employee record
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data: employee } = await supabase
      .from('employees')
      .select('id, client_id')
      .eq('user_id', user.id)
      .single();

    if (!employee) throw new Error('Employee record not found');

    // Get category ID by name
    const { data: category } = await supabase
      .from('template_categories')
      .select('id')
      .eq('name', template.type)
      .single();

    // Add IDs to questions
    const questionsWithIds = template.questions.map((q, index) => ({
      ...q,
      id: `q_${Date.now()}_${index}`
    }));

    const { data, error } = await supabase
      .from('assessment_templates')
      .insert({
        client_id: employee.client_id,
        title: template.title,
        description: template.description,
        category_id: category?.id || null,
        questions: questionsWithIds,
        created_by: employee.id,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      throw error;
    }

    return data.id;
  },

  async updateTemplate(id: string, updates: Partial<AssessmentTemplate>): Promise<void> {
    const updateData: any = {};

    if (updates.title) updateData.title = updates.title;
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
      updateData.questions = updates.questions;
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
