
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessments } from '@/hooks/useAssessments';
import { useToast } from '@/components/ui/use-toast';
import { AssessmentQuestion } from '@/types/assessmentTypes';

export const useTemplateDetail = (id: string | undefined) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    getTemplateById,
    addQuestion,
    updateQuestion,
    removeQuestion,
    getAssignmentsByTemplate,
    assignTemplate,
    updateTemplateStatus
  } = useAssessments();

  // Template state
  const [template, setTemplate] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Load template data
  useEffect(() => {
    if (!id) {
      console.error('No template ID provided');
      setLoading(false);
      return;
    }
    
    console.log(`Looking for template with id: ${id}`);
    setLoading(true);
    
    try {
      const foundTemplate = getTemplateById(id);
      
      if (!foundTemplate) {
        console.error(`Template with id ${id} not found in useEffect`);
        toast({
          title: "Template not found",
          description: "The template you're looking for could not be found.",
          variant: "destructive"
        });
        navigate('/assessments');
        return;
      }
      
      setTemplate(foundTemplate);
      setAssignments(getAssignmentsByTemplate(id));
    } catch (error) {
      console.error('Error loading template:', error);
      toast({
        title: "Error loading template",
        description: "There was a problem loading the template data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [id, getTemplateById, navigate, getAssignmentsByTemplate, toast]);

  // Handle adding a question
  const handleAddQuestion = (question: Omit<AssessmentQuestion, 'id'>) => {
    if (!template) return;
    
    const newQuestion = addQuestion(template.id, question);
    
    toast({
      title: "Question added",
      description: "The question has been added to the template."
    });
    
    // Refresh template data
    setTemplate(getTemplateById(template.id)!);
  };

  // Handle deleting a question
  const handleDeleteQuestion = (questionId: string) => {
    if (!template) return;
    
    if (window.confirm('Are you sure you want to delete this question?')) {
      removeQuestion(template.id, questionId);
      
      toast({
        title: "Question deleted",
        description: "The question has been removed from the template."
      });
      
      // Refresh template data
      setTemplate(getTemplateById(template.id)!);
    }
  };

  // Handle editing a question
  const handleEditQuestion = (questionId: string) => {
    // In a real implementation, we'd show an edit form
    // For now, we'll just show an alert
    alert('Edit functionality would be implemented here');
    setEditingQuestionId(questionId);
  };

  // Handle assigning the template
  const handleAssignTemplate = (userIds: string[], dueDate?: Date) => {
    if (!template) return;
    
    assignTemplate(template.id, userIds, dueDate);
    
    toast({
      title: "Template assigned",
      description: `Assessment assigned to ${userIds.length} user(s).`
    });
    
    setShowAssignDialog(false);
    
    // Refresh assignments
    setAssignments(getAssignmentsByTemplate(template.id));
  };

  // Handle activating the template
  const handleActivateTemplate = () => {
    if (!template) return;
    
    if (template.questions.length === 0) {
      toast({
        title: "Cannot activate",
        description: "You need to add at least one question before activating this template.",
        variant: "destructive"
      });
      return;
    }
    
    updateTemplateStatus(template.id, 'active');
    setTemplate(getTemplateById(template.id)!);
    
    toast({
      title: "Template activated",
      description: "Your assessment template is now active and can be assigned to users."
    });
  };

  // Derived state
  const isCompleted = template ? template.questions.length > 0 : false;
  const isActive = template ? template.status === 'active' : false;

  return {
    template,
    assignments,
    isCompleted,
    isActive,
    showAssignDialog,
    editingQuestionId,
    loading,
    handleAddQuestion,
    handleDeleteQuestion,
    handleEditQuestion,
    handleAssignTemplate,
    handleActivateTemplate,
    setShowAssignDialog
  };
};
