
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessment } from '@/contexts/AssessmentContext';
import { AssessmentQuestion } from '@/types/assessment';
import { toast } from 'sonner';

export function useCreateTemplate() {
  const navigate = useNavigate();
  const { createTemplate, addQuestion } = useAssessment();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Safety');
  const [questions, setQuestions] = useState<Omit<AssessmentQuestion, 'id'>[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Create template
    const templateId = createTemplate({
      title,
      description,
      type,
      questions: []
    });
    
    // Add questions to template
    questions.forEach(question => {
      addQuestion(templateId, question);
    });
    
    toast.success('Template created successfully');
    
    // Navigate to templates list
    navigate('/assessments/templates');
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
    handleAddQuestion,
    handleUpdateQuestion,
    handleRemoveQuestion,
    handleSubmit
  };
}
