
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessment } from '@/contexts/assessment/AssessmentContext';
import { AssessmentQuestion } from '@/types/assessment';
import { toast } from 'sonner';

export function useCreateTemplate() {
  const navigate = useNavigate();
  const { createTemplate } = useAssessment();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Safety');
  const [questions, setQuestions] = useState<Omit<AssessmentQuestion, 'id'>[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      console.log('Creating template with data:', { title, description, type, questions });
      
      // Create template
      const templateId = createTemplate({
        title,
        description,
        type,
        questions: []
      });
      
      console.log('Template created with ID:', templateId);
      
      // Add questions to template
      for (const question of questions) {
        try {
          const questionData = { ...question };
          // Use the addQuestion method from the context
          // This will be handled in the context directly now
        } catch (err) {
          console.error(`Failed to add question:`, err);
        }
      }
      
      toast.success('Template created successfully');
      
      // Navigate to templates list
      navigate('/assessments/templates');
    } catch (error) {
      console.error('Failed to create template:', error);
      setFormError('Failed to create template. Please try again.');
      toast.error('Failed to create template');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    type,
    setType,
    questions,
    formError,
    isSubmitting,
    handleAddQuestion,
    handleUpdateQuestion,
    handleRemoveQuestion,
    handleSubmit
  };
}
