
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
import { AssessmentQuestion } from '@/types/assessment';

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

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission triggered');
    console.log('Form data:', { title, description, type, isActive, questions });
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      if (isEditMode && templateId) {
        // Update existing template
        await updateTemplate(templateId, {
          title,
          description,
          type,
          isActive,
          questions
        });
        console.log('Template updated successfully');
        toast.success('Template updated successfully');
      } else {
        // Create new template
        const templateData = {
          title,
          description,
          type,
          questions
        };
        
        console.log('Creating template with data:', templateData);
        const newTemplateId = await createTemplate(templateData);
        console.log('Template created with ID:', newTemplateId);
        toast.success('Template created successfully');
      }
      
      // Always use onCancel if provided, otherwise navigate
      if (onCancel) {
        onCancel();
      } else {
        navigate('/assessments/templates');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      const errorMessage = isEditMode ? 'Failed to update template. Please try again.' : 'Failed to create template. Please try again.';
      setFormError(errorMessage);
      toast.error(errorMessage);
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
          assessmentName={title || 'Untitled Template'}
          clientId={employeeData?.clientId}
          employeeId={employeeData?.id}
        />
        
        {formError && <FormError error={formError} />}
        
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
