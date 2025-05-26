import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader, ArrowLeft } from 'lucide-react';
import TemplateBasicInfo from './TemplateBasicInfo';
import QuestionsSection from './QuestionsSection';
import FormError from './FormError';
import { useAssessment } from '@/contexts/assessment/AssessmentContext';
import { toast } from 'sonner';
import { AssessmentQuestion } from '@/types/assessment';

interface CreateTemplateFormProps {
  templateId?: string;
  onCancel?: () => void;
}

const CreateTemplateForm: React.FC<CreateTemplateFormProps> = ({ templateId, onCancel }) => {
  const navigate = useNavigate();
  const { createTemplate, addQuestion } = useAssessment();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Safety');
  const [questions, setQuestions] = useState<Omit<AssessmentQuestion, 'id'>[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Question management
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        allowComments: false,
        allowAttachments: false,
        required: true
      }
    ]);
  };

  const handleUpdateQuestion = (index: number, updatedQuestion: Omit<AssessmentQuestion, 'id'>) => {
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
    console.log('Form data:', { title, description, type, questions });
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create the template first
      const templateData = {
        title,
        description,
        type,
        questions: [] // Questions will be added separately
      };
      
      console.log('Creating template with data:', templateData);
      const templateId = createTemplate(templateData);
      console.log('Template created with ID:', templateId);
      
      // Then add questions to the template
      if (templateId) {
        for (const question of questions) {
          console.log('Adding question to template:', question);
          addQuestion(templateId, question);
        }
        
        toast.success('Template created successfully');
        
        // Reset form if onCancel is provided, otherwise navigate
        if (onCancel) {
          onCancel();
        } else {
          navigate('/assessments/templates');
        }
      } else {
        throw new Error('Failed to create template: No template ID returned');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      setFormError('Failed to create template. Please try again.');
      toast.error('Failed to create template');
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
            <h1 className="text-2xl font-bold text-gray-900">Create Assessment Template</h1>
            <p className="text-gray-500 mt-1">
              Create a new template for conducting assessments.
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
        />
        
        <QuestionsSection
          questions={questions}
          onAddQuestion={handleAddQuestion}
          onUpdateQuestion={handleUpdateQuestion}
          onRemoveQuestion={handleRemoveQuestion}
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
                Saving...
              </>
            ) : 'Save Template'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateTemplateForm;
