import { supabase } from '@/integrations/supabase/client';
import { AssessmentQuestion, AssessmentTemplate, QuestionFile } from '@/types/assessment';
import type { Json } from '@/integrations/supabase/types';

// A question's `files` entries can be a raw browser File (pending upload), a wrapper
// with a `.file` property (from prepareQuestionsWithFiles), or an already-processed
// QuestionFile — convertFilesToBase64 below normalizes all three.
type PendingQuestionFile = File | (Partial<QuestionFile> & { file?: File });

interface Base64QuestionFile {
  id: string;
  name?: string;
  size?: number;
  type?: string;
  fileData?: string;
  url?: string;
  path?: string;
  uploadedAt?: string;
}

interface ProcessedQuestion extends Omit<AssessmentQuestion, 'files'> {
  files?: Base64QuestionFile[];
}

export interface CreateTemplateRequest {
  title: string;
  description: string;
  type: string;
  isActive: boolean;
  questions: AssessmentQuestion[];
  clientId: string;
  employeeId: string;
  templateId?: string; // For updates
}

export interface CreateTemplateResponse {
  success: boolean;
  templateId: string;
  message: string;
}

// Convert File to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

// Convert pending files to base64 format for the edge function
async function convertFilesToBase64(questions: AssessmentQuestion[]): Promise<ProcessedQuestion[]> {
  const processedQuestions = await Promise.all(
    questions.map(async (question): Promise<ProcessedQuestion> => {
      if (!question.files || question.files.length === 0) {
        return question;
      }

      // Convert files to base64 format
      console.log(`Converting files for question ${question.id}:`, question.files);
      const base64Files = await Promise.all(
        (question.files as PendingQuestionFile[]).map(async (file) => {
          console.log('Processing file in convertFilesToBase64:', file);
          console.log('File instanceof File:', file instanceof File);
          console.log('File.file instanceof File:', 'file' in file && file.file instanceof File);
          console.log('File.fileData:', 'fileData' in file ? file.fileData : undefined);
          // If file is already a File object (from pending files), convert to base64
          if (file instanceof File) {
            console.log('File is instanceof File, converting to base64');
            const base64Data = await fileToBase64(file);
            return {
              id: file.name + '_' + Date.now(), // Generate unique ID
              name: file.name,
              size: file.size,
              type: file.type,
              fileData: base64Data
            };
          }
          
          // If file has a file property (from prepareQuestionsWithFiles), convert to base64
          if (file.file && file.file instanceof File) {
            console.log('File has file property, converting to base64');
            const base64Data = await fileToBase64(file.file);
            return {
              id: file.id,
              name: file.name,
              size: file.size,
              type: file.type,
              fileData: base64Data
            };
          }
          
          // If file is already processed (has URL), return as is
          console.log('File is already processed, returning as is');
          return {
            id: file.id,
            name: file.name,
            size: file.size,
            type: file.type,
            url: file.url,
            path: file.path,
            uploadedAt: file.uploadedAt
          };
        })
      );

      console.log(`Converted files for question ${question.id}:`, base64Files);
      return {
        ...question,
        files: base64Files
      };
    })
  );

  return processedQuestions;
}

export const templateService = {
  // Get all templates for a client
  getTemplates: async (clientId: string, clientTypeId?: string): Promise<AssessmentTemplate[]> => {
    try {
      const { data: result, error } = await supabase.functions.invoke('list-assessments', {
        body: { client_id: clientId, client_type_id: clientTypeId },
        headers: { path: 'templates' },
      });

      if (error) {
        console.error('Error fetching templates:', error);
        throw new Error(`Failed to fetch templates: ${error.message}`);
      }

      const data = result?.templates as Array<{
        id: string;
        title: string;
        description: string;
        template_categories?: { name?: string };
        category_id: string;
        questions: unknown;
        created_at: string;
        created_by: string;
        is_active: boolean;
      }> | undefined;

      // Transform data to include type from category relationship
      const templates = data?.map((template) => ({
        id: template.id,
        title: template.title,
        description: template.description,
        type: template.template_categories?.name || 'Unknown',
        category_id: template.category_id,
        questions: template.questions as unknown as AssessmentQuestion[],
        createdAt: template.created_at,
        createdBy: template.created_by,
        isActive: template.is_active
      })) || [];

      return templates;
    } catch (error) {
      console.error('Error in getTemplates:', error);
      throw error;
    }
  },

  // Create template (legacy method for backward compatibility)
  createTemplate: async (templateData: {
    title: string;
    description: string;
    category_id: string;
    questions?: AssessmentQuestion[];
    clientId?: string;
    createdBy?: string;
  }): Promise<string> => {
    try {
      // This is a simplified version that doesn't handle files
      // For file handling, use createOrUpdateTemplate instead
      const { data, error } = await supabase
        .from('assessment_templates')
        .insert({
          title: templateData.title,
          description: templateData.description,
          category_id: templateData.category_id,
          questions: (templateData.questions || []) as unknown as Json,
          created_by: templateData.createdBy || '',
          client_id: templateData.clientId || ''
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create template: ${error.message}`);
      }

      return data.id;
    } catch (error) {
      console.error('Error in createTemplate:', error);
      throw error;
    }
  },

  // Update template (legacy method for backward compatibility)
  updateTemplate: async (id: string, updates: {
    title?: string;
    description?: string;
    category_id?: string;
    questions?: AssessmentQuestion[];
    isActive?: boolean;
  }): Promise<void> => {
    try {
      const updateData: {
        title?: string;
        description?: string;
        category_id?: string;
        questions?: Json;
        is_active?: boolean;
        updated_at?: string;
      } = {};

      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.category_id) updateData.category_id = updates.category_id;
      if (updates.questions) updateData.questions = updates.questions as unknown as Json;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('assessment_templates')
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to update template: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in updateTemplate:', error);
      throw error;
    }
  },

  // Delete template
  deleteTemplate: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('assessment_templates')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete template: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteTemplate:', error);
      throw error;
    }
  },

  // Create or update template using single edge function (for file handling)
  createOrUpdateTemplate: async (request: CreateTemplateRequest): Promise<CreateTemplateResponse> => {
    try {
      console.log(`${request.templateId ? 'Updating' : 'Creating'} template via edge function:`, {
        templateId: request.templateId,
        title: request.title,
        type: request.type,
        questionCount: request.questions.length
      });

      // Convert files to base64 format
      const processedQuestions = await convertFilesToBase64(request.questions);

      // Call the single edge function
      const { data, error } = await supabase.functions.invoke('create-assessment-template', {
        body: {
          title: request.title,
          description: request.description,
          type: request.type,
          isActive: request.isActive,
          questions: processedQuestions,
          clientId: request.clientId,
          employeeId: request.employeeId,
          templateId: request.templateId // Will be undefined for creates
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Failed to ${request.templateId ? 'update' : 'create'} template: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || `Failed to ${request.templateId ? 'update' : 'create'} template`);
      }

      console.log(`Template ${request.templateId ? 'updated' : 'created'} successfully:`, data.templateId);
      return data;

    } catch (error) {
      console.error('Error in createOrUpdateTemplate:', error);
      throw error;
    }
  }
};