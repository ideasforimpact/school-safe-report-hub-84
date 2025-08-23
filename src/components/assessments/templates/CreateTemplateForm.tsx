
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader, ArrowLeft } from 'lucide-react';
import TemplateBasicInfo from './TemplateBasicInfo';
import QuestionsSection from './QuestionsSection';
import FormError from './FormError';
import { useAssessment } from '@/contexts/assessment/AssessmentContext';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';
import { AssessmentQuestion, QuestionFile } from '@/types/assessment';
import { questionFileService } from '@/services/assessment/questionFileService';
import { FileItem } from '@/types/fileTypes';

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
  const { createTemplate, updateTemplate, getTemplateById } = useAssessment();
  const { user, employeeData } = useAuth();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Safety');
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  
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
  useEffect(() => {
    if (isEditMode && templateId) {
      setLoading(true);
      const template = getTemplateById(templateId);
      if (template) {
        setTitle(template.title);
        setDescription(template.description);
        setType(template.type);
        setIsActive(template.isActive);
        setQuestions(template.questions);
      } else {
        setFormError('Template not found');
        toast.error('Template not found');
      }
      setLoading(false);
    }
  }, [isEditMode, templateId, getTemplateById]);

  // Question management
  const handleAddQuestion = () => {
    const newQuestion: AssessmentQuestion = {
      id: `temp_${Date.now()}`,
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

  const uploadPendingFiles = async (): Promise<AssessmentQuestion[]> => {
    if (!employeeData?.clientId || !employeeData?.id) {
      throw new Error('User information not available for file upload');
    }

    const questionsWithUploadedFiles = [...questions];
    
    for (const [questionId, files] of Object.entries(pendingFiles)) {
      if (files.length === 0) continue;
      
      const questionIndex = questionsWithUploadedFiles.findIndex(q => q.id === questionId);
      if (questionIndex === -1) continue;
      
      const questionNumber = questionIndex + 1;
      
      console.log(`Processing ${files.length} files for question ${questionNumber}:`, files.map(f => f.name));
      
      // Convert to UploadFileInput format for the improved service
      const uploadInputs = files.map(file => ({
        file: file.file,
        id: file.id
      }));

      try {
        // Upload files using the improved service
        const uploadedFiles = await questionFileService.uploadQuestionFiles(
          uploadInputs,
          employeeData.clientId,
          employeeData.id,
          title || 'Untitled Template',
          questionNumber
        );

        console.log(`Successfully uploaded ${uploadedFiles.length} files for question ${questionNumber}`);

        // Convert to QuestionFile format
        const questionFiles: QuestionFile[] = uploadedFiles.map(file => ({
          id: file.id,
          name: file.name,
          size: file.size,
          type: file.type,
          url: file.url,
          path: file.path,
          uploadedAt: file.uploadedAt.toISOString()
        }));

        // Update question with uploaded files
        questionsWithUploadedFiles[questionIndex] = {
          ...questionsWithUploadedFiles[questionIndex],
          files: [...(questionsWithUploadedFiles[questionIndex].files || []), ...questionFiles]
        };
        
        console.log(`Updated question ${questionIndex} with files:`, JSON.stringify(questionsWithUploadedFiles[questionIndex], null, 2));
      } catch (error) {
        console.error(`Failed to upload files for question ${questionNumber}:`, error);
        throw new Error(`Failed to upload files for question ${questionNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return questionsWithUploadedFiles;
  };

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission triggered');
    console.log('Form data:', { title, description, type, isActive, questions });
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Upload pending files first
      const questionsWithFiles = await uploadPendingFiles();
      console.log('Questions with files after upload:', JSON.stringify(questionsWithFiles, null, 2));
      
      if (isEditMode && templateId) {
        // Update existing template
        await updateTemplate(templateId, {
          title,
          description,
          type,
          isActive,
          questions: questionsWithFiles
        });
        console.log('Template updated successfully');
        toast.success('Template updated successfully');
      } else {
        // Create new template
        const templateData = {
          title,
          description,
          type,
          questions: questionsWithFiles
        };
        
        console.log('Creating template with data:', templateData);
        const newTemplateId = await createTemplate(templateData);
        console.log('Template created with ID:', newTemplateId);
        toast.success('Template created successfully');
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
        <div className="flex items-center justify-center p-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading template...</span>
        </div>
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
