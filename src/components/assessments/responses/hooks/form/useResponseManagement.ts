
import { useState } from 'react';
import { QuestionResponse } from '@/types/assessment';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

export const useResponseManagement = (
  template: any,
  assessment: any,
  _existingResponse: any,
  user: any
) => {
  const navigate = useNavigate();
  const [questionResponses, setQuestionResponses] = useState<QuestionResponse[]>(() => {
    if (template) {
      return template.questions.map((question: { id: string }) => ({
        questionId: question.id,
        answer: undefined as any,
        comment: null,
        attachments: null
      }));
    }
    return [];
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleResponseChange = (questionId: string, field: string, value: any) => {
    setQuestionResponses(prev => 
      prev.map(response => 
        response.questionId === questionId 
          ? { ...response, [field]: value } 
          : response
      )
    );
  };
  
  const validateResponses = () => {
    if (!template) return false;
    
    // Check if all required questions have been answered
    const requiredQuestions = template.questions.filter((q: { required: boolean }) => q.required);
    const unansweredRequired = requiredQuestions.some((requiredQ: { id: string }) => {
      const response = questionResponses.find(r => r.questionId === requiredQ.id);
      return response?.answer === undefined; // No answer for this required question
    });
    
    if (unansweredRequired) {
      setFormError('Please answer all required questions');
      return false;
    }
    
    setFormError(null);
    return true;
  };
  
  const handleSave = async () => {
    if (!template || !assessment || !user) return;

    setSaving(true);

    try {
      const { error: updateError } = await supabase
      .functions.invoke('save-assessment-draft/save-draft', {
        body: {
          assessment_id: (assessment as any).assessment_id,
          client_id: (assessment as any).client_id,
          status: 'Draft',
          answers: questionResponses,
        },
      });

      if (updateError) throw updateError;

      toast.success("Progress saved successfully");
    } catch (error) {
      console.error('Error saving response:', error);
      toast.error("Failed to save progress");
    } finally {
      setSaving(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!template || !assessment || !user) return;
    if (!validateResponses()) {
      toast.error("Please complete all required questions before submitting");
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Calculate score
      const totalQuestions = template.questions.length;
      const yesAnswers = questionResponses.filter(r => r.answer === true).length;
      const score = totalQuestions > 0 ? Math.round((yesAnswers / totalQuestions) * 100) : 0;

      const { error: updateError } = await supabase
      .functions.invoke('save-assessment-draft/submit-assessment', {
        body: {
          assessment_id: (assessment as any).assessment_id,
          client_id: (assessment as any).client_id,
          score,
          answers: questionResponses,
          performed_by: {
            id: user?.id || '',
            first_name: '',
            last_name: '',
            email: user?.email || '',
          },
          assessment_info: {
            id: (assessment as any).id,
            name: (assessment as any).name,
            created_by: (assessment as any).created_by,
            assigned_to: (assessment as any).assigned_to,
          },
        },
      });

      if (updateError) {
        throw updateError;
      }

      toast.success("Assessment submitted successfully!");
      navigate('/assessments');
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error("Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    questionResponses,
    formError,
    saving,
    submitting,
    handleResponseChange,
    handleSave,
    handleSubmit,
    validateResponses
  };
};
