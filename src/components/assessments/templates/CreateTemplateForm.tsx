
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import TemplateBasicInfo from './TemplateBasicInfo';
import QuestionsSection from './QuestionsSection';
import FormError from './FormError';
import { useAssessment } from '@/contexts/assessment/AssessmentContext';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';
import { AssessmentQuestion, QuestionFile } from '@/types/assessment';
import { templateService } from '@/services/assessment/templateService';
import { FileItem } from '@/types/fileTypes';
import { supabase } from '@/integrations/supabase/client';
import Loader from "@/components/common/Loader";

interface CreateTemplateFormProps {
  templateId?: string;
  onCancel?: () => void;
  isEditMode?: boolean;
}

const CreateTemplateForm: React.FC<CreateTemplateFormProps> = ({ 
  templateId, 
  onCancel,
  isEditMode = false 
}) => {
  const navigate = useNavigate();
  const { createTemplate, updateTemplate, getTemplateById, refreshTemplates } = useAssessment();
  const { user, employeeData } = useAuth();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const typeRef = React.useRef<HTMLButtonElement | null>(null);
  // Pending files state - maps question IDs to their pending files
  const [pendingFiles, setPendingFiles] = useState<Record<string, Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    file: File;
    status: 'pending';
  }>>>({});

  // Load existing template data if in edit mode
 const template = getTemplateById(templateId);

  useEffect(() => {
    if (!isEditMode || !templateId) return;
    if (!template) return; 

    let isMounted = true;

    const initializeEditForm = async () => {
      setLoading(true);
      setTitle(template.title);
      setDescription(template.description);
      setIsActive(template.isActive);

      if (template.category_id) {
        const { data, error } = await supabase
          .from('template_categories')
          .select('name')
          .eq('id', template.category_id)
          .maybeSingle();

        if (!error && data?.name && isMounted) {
          setType(data.name.trim());
        } else if (isMounted) {
          const fallback = (template.type || '').trim();
          setType(fallback.toLowerCase() !== 'unknown' ? fallback : '');
        }
      } else {
        const fallback = (template.type || '').trim();
        setType(fallback.toLowerCase() !== 'unknown' ? fallback : '');
      }

      const questionsWithIds = template.questions.map((q, index) => ({
        ...q,
        id:
          q.id ||
          `temp_${Date.now()}_${index}_${Math.random()
            .toString(36)
            .substring(2, 9)}`
      }));

      if (isMounted) {
        setQuestions(questionsWithIds);
        setLoading(false);
      }
    };

    initializeEditForm();

    return () => {
      isMounted = false;
    };
  }, [template, isEditMode, templateId]);

  // Ensure all questions always have IDs (only run once on mount or when questions change significantly)
  useEffect(() => {
    const questionsNeedingIds = questions.filter(q => !q.id);
    if (questionsNeedingIds.length > 0) {
      console.log(`[CreateTemplateForm] Found ${questionsNeedingIds.length} questions without IDs, assigning them now`);
      const updatedQuestions = questions.map((q, index) => {
        if (!q.id) {
          const newId = `temp_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 9)}`;
          console.log(`[CreateTemplateForm] Assigning ID ${newId} to question at index ${index}`);
          return {
            ...q,
            id: newId
          };
        }
        return q;
      });
      // Only update if we actually changed something
      if (updatedQuestions.some((q, i) => q.id !== questions[i]?.id)) {
        setQuestions(updatedQuestions);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length]); // Only depend on length to avoid infinite loops

  // Question management
  const handleAddQuestion = () => {
    // Generate a unique ID using timestamp and random string to avoid collisions
    const uniqueId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newQuestion: AssessmentQuestion = {
      id: uniqueId,
      text: '',
      allowComments: false,
      allowAttachments: false,
      required: true
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleUpdateQuestion = (index: number, updatedQuestion: AssessmentQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // Form validation
  const validateForm = () => {
    if (!title.trim()) {
      setFormError('Template title is required');
      return false;
    }
    
    // Validate template title format (no special characters allowed)
    const isValidTemplateTitle = /^[a-zA-Z0-9\s]{1,25}$/.test(title.trim());
    if (!isValidTemplateTitle) {
      setFormError('Template title can only contain letters, numbers, and spaces');
      return false;
    }

    if (!type) {
      setFormError('Assessment type is required');
      typeRef.current?.focus();
      return false;
    }
    
    if (questions.length === 0) {
      setFormError('At least one question is required');
      return false;
    }
    
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        setFormError(`Question ${i + 1} text is required`);
        return false;
      }
    }
    
    setFormError(null);
    return true;
  };

  // Convert pending files to questions with files
  const prepareQuestionsWithFiles = (): AssessmentQuestion[] => {
    console.log('prepareQuestionsWithFiles called with:');
    console.log('- questions:', questions);
    console.log('- pendingFiles:', pendingFiles);
    
    const questionsWithFiles = [...questions];
    
    // Process each question
    questionsWithFiles.forEach((question, questionIndex) => {
      const questionId = question.id;
      const pendingFilesForQuestion = pendingFiles[questionId] || [];
      
      console.log(`Processing question ${questionId}:`);
      console.log('- existing files:', question.files || []);
      console.log('- pending files:', pendingFilesForQuestion);
      
      if (pendingFilesForQuestion.length > 0) {
        // If there are pending files, completely replace existing files with pending files
        // Convert pending files to QuestionFile format
        const questionFiles: any[] = pendingFilesForQuestion.map(file => ({
          id: file.id,
          name: file.name,
          size: file.size,
          type: file.type,
          url: '', // Will be set by edge function
          path: '', // Will be set by edge function
          uploadedAt: new Date().toISOString(),
          file: file.file // Include the actual File object for the edge function
        }));

        console.log(`Completely replacing existing files with ${questionFiles.length} pending files for question ${questionId}`);
        console.log(`Old files being replaced:`, question.files);
        console.log(`New files replacing them:`, questionFiles);
        
        // Completely replace files (since we only allow single file per question)
        questionsWithFiles[questionIndex] = {
          ...question,
          files: questionFiles
        };
      } else {
        // No pending files, keep existing files as they are
        console.log(`No pending files for question ${questionId}, keeping existing files:`, question.files);
        // Keep all existing files as they are - don't filter them out
        questionsWithFiles[questionIndex] = {
          ...question,
          files: question.files || []
        };
      }
    });

    // Log final result
    questionsWithFiles.forEach((question, index) => {
      if (question.files && question.files.length > 0) {
        console.log(`Question ${index + 1} final files:`, question.files);
      } else {
        console.log(`Question ${index + 1} has no files`);
      }
    });

    console.log('Final questionsWithFiles:', questionsWithFiles);
    return questionsWithFiles;
  };

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission triggered');
    console.log('Form data:', { title, description, type, isActive, questions });
    
    if (!validateForm()) {
      return;
    }

    if (!employeeData?.clientId || !employeeData?.id) {
      setFormError('User information not available');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Prepare questions with files (no upload yet)
      const questionsWithFiles = prepareQuestionsWithFiles();
      console.log('Questions with files prepared:', JSON.stringify(questionsWithFiles, null, 2));
      console.log('Pending files state:', pendingFiles);
      console.log('Current questions state:', questions);
      
      if (isEditMode && templateId) {
        // For updates, use the edge function directly since context doesn't handle file updates
        const result = await templateService.createOrUpdateTemplate({
          title,
          description,
          type,
          isActive,
          questions: questionsWithFiles,
          clientId: employeeData.clientId,
          employeeId: employeeData.id,
          templateId: templateId
        });
        
        console.log('Template updated successfully:', result.templateId);
        toast.success('Template updated successfully');
        
        // Refresh templates in context to get the updated data
        if (refreshTemplates) {
          await refreshTemplates();
        }
      } else {
        // For creates, use the context method which handles refresh
        const templateData = {
          title,
          description,
          type,
          isActive,
          questions: questionsWithFiles,
          clientId: employeeData.clientId,
          createdBy: employeeData.id
        };
        
        // Use the edge function for file handling, then update context
        const result = await templateService.createOrUpdateTemplate({
          title,
          description,
          type,
          isActive,
          questions: questionsWithFiles,
          clientId: employeeData.clientId,
          employeeId: employeeData.id
        });
        
        console.log('Template created successfully:', result.templateId);
        toast.success('Template created successfully');
        
        // Manually refresh templates since we used edge function directly
        if (refreshTemplates) {
          // Add a small delay to ensure database is updated
          setTimeout(async () => {
            await refreshTemplates();
          }, 1000);
        }
      }
      
      // Clear pending files after successful save
      setPendingFiles({});
      
      // Always use onCancel if provided, otherwise navigate
      if (onCancel) {
        onCancel();
      } else {
        navigate('/assessments/templates');
      }
    } catch (error: any) {
      console.error('Error saving template:', error);
      const errorMessage = error.message || (isEditMode ? 'Failed to update template. Please try again.' : 'Failed to create template. Please try again.');
      setFormError(errorMessage);
      // Don't show toast error - let the form error handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/assessments/templates');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6">        
        <Loader text="Loading templates..." />        
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCancel}
            className="mr-3 p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Assessment Template' : 'Create Assessment Template'}
            </h1>
            <p className="text-gray-500 mt-1">
              {isEditMode ? 'Update your assessment template.' : 'Create a new template for conducting assessments.'}
            </p>
          </div>
        </div>
      </div>
      
      <form onSubmit={onFormSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        {/* Error message display at the top */}
        {formError && <FormError error={formError} />}
        
        <TemplateBasicInfo
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          type={type}
          setType={setType}
          isActive={isActive}
          setIsActive={setIsActive}
          typeRef={typeRef}
        />
        
        <QuestionsSection
          questions={questions}
          onAddQuestion={handleAddQuestion}
          onUpdateQuestion={handleUpdateQuestion}
          onRemoveQuestion={handleRemoveQuestion}
          pendingFiles={pendingFiles}
          onPendingFilesChange={setPendingFiles}
        />
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                {isEditMode ? 'Updating...' : 'Saving...'}
              </>
            ) : (isEditMode ? 'Update Template' : 'Save Template')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateTemplateForm;
