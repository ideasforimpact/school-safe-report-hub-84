
import { useState } from 'react';
import { useAssessment } from '@/contexts/assessment/AssessmentContext';
import { AssessmentQuestion } from '@/types/assessment';
import { toast } from 'sonner';

export function useCreateTemplate() {
  const { createTemplate, addQuestion } = useAssessment();
  
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
    
    // Step 1: Validate form
    if (!validateForm()) return false;
    
    try {
      setIsSubmitting(true);
      console.log('Creating template with data:', { title, description, type, questions });
      
      // Step 2: Create template
      const templateId = createTemplate({
        title,
        description,
        type,
        questions: []
      });
      
      console.log('Template created with ID:', templateId);
      
      // Step 3: Add questions to template
      for (const question of questions) {
        try {
          const questionId = addQuestion(templateId, question);
          console.log('Added question with ID:', questionId);
        } catch (err) {
          console.error('Failed to add question:', err);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to create template:', error);
      setFormError('Failed to create template. Please try again.');
      toast.error('Failed to create template');
      return false;
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
