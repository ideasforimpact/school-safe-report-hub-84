
import { useTemplateManagement } from './useTemplateManagement';
import { useQuestionManagement } from './useQuestionManagement';
import { useAssignmentManagement } from './useAssignmentManagement';
import { AssessmentTemplate, AssessmentQuestion } from '@/types/assessmentTypes';

export const useAssessments = () => {
  // Compose the hooks
  const {
    templates,
    isLoading,
    createTemplate: createTemplateBase,
    updateTemplate,
    deleteTemplate: deleteTemplateBase,
    updateTemplateStatus,
    getTemplateById
  } = useTemplateManagement();

  const {
    addQuestion,
    updateQuestion,
    removeQuestion
  } = useQuestionManagement(templates, updateTemplate);

  const {
    assignments,
    assignTemplate,
    getAssignmentsByTemplate,
    getAssignmentsByUser,
    deleteAssignmentsByTemplate
  } = useAssignmentManagement();

  // Create a new template and optionally assign it to users immediately
  const createTemplate = (
    templateData: Omit<AssessmentTemplate, 'id' | 'createdAt' | 'updatedAt'>,
    userIds: string[] = [],
    dueDate?: Date
  ) => {
    const newTemplate = createTemplateBase(templateData);
    
    // If userIds are provided, assign the template to those users
    if (userIds.length > 0) {
      assignTemplate(newTemplate.id, userIds, dueDate);
    }
    
    return newTemplate;
  };

  // Delete a template and its assignments
  const deleteTemplate = (id: string) => {
    deleteTemplateBase(id);
    // Also delete any assignments for this template
    deleteAssignmentsByTemplate(id);
  };

  return {
    templates,
    assignments,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    addQuestion,
    updateQuestion,
    removeQuestion,
    updateTemplateStatus,
    assignTemplate,
    getTemplateById,
    getAssignmentsByTemplate,
    getAssignmentsByUser
  };
};

export * from './useTemplateManagement';
export * from './useQuestionManagement';
export * from './useAssignmentManagement';
