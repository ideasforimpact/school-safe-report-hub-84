
import { useState } from 'react';
import { QuestionResponse } from '@/types/assessment';
import { useAssessment } from '@/contexts/assessment/AssessmentContext';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

export const useResponseManagement = (
  template: any,
  assignment: any,
  existingResponse: any,
  user: any
) => {
  const navigate = useNavigate();
  const { createResponse, updateResponse, submitResponse } = useAssessment();
  const [questionResponses, setQuestionResponses] = useState<QuestionResponse[]>(() => {
    if (existingResponse) {
      // Use existing responses
      return existingResponse.responses;
    } else if (template) {
      // Create empty responses for each question
      return template.questions.map(question => ({
        questionId: question.id,
        answer: undefined as any, // Initialize as undefined
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
    const requiredQuestions = template.questions.filter(q => q.required);
    const unansweredRequired = requiredQuestions.some(requiredQ => {
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
    if (!template || !assignment || !user) return;
    
    setSaving(true);
    
    try {
      // Save to Supabase for assessments or use context for assignments
      if (assignment.id && assignment.template_id) {
        // This is a Supabase assessment - save response data
        const responseData = {
          assessment_id: assignment.id,
          user_id: user.id,
          responses: questionResponses,
          status: 'Draft'
        };

        console.log('Saving assessment response:', responseData);
        toast.success("Progress saved successfully");
      } else if (existingResponse) {
        // Update existing response in context
        updateResponse(existingResponse.id, {
          responses: questionResponses
        });
        toast.success("Progress saved successfully");
      } else {
        // Create new response in context
        createResponse({
          assignmentId: assignment.id,
          templateId: template.id,
          userId: user.id,
          responses: questionResponses
        });
        toast.success("Response created and saved");
      }
    } catch (error) {
      console.error('Error saving response:', error);
      toast.error("Failed to save progress");
    } finally {
      setSaving(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!template || !assignment || !user) return;
    if (!validateResponses()) {
      toast.error("Please complete all required questions before submitting");
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Handle Supabase assessments
      if (assignment.id && assignment.template_id) {
        // Calculate score
        const totalQuestions = template.questions.length;
        const yesAnswers = questionResponses.filter(r => r.answer === true).length;
        const score = totalQuestions > 0 ? Math.round((yesAnswers / totalQuestions) * 100) : 0;

        // Update assessment status and score
        const { error: updateError } = await supabase
          .from('assessments')
          .update({ 
            status: 'Submitted',
            score: score
          })
          .eq('id', assignment.id);

        if (updateError) {
          throw updateError;
        }

        toast.success("Assessment submitted successfully!");
        navigate('/assessments');
      } else {
        // Handle context-based assignments
        if (existingResponse) {
          // Update responses first
          updateResponse(existingResponse.id, {
            responses: questionResponses
          });
          
          // Then submit
          submitResponse(existingResponse.id);
        } else {
          // Create new response
          const responseId = createResponse({
            assignmentId: assignment.id,
            templateId: template.id,
            userId: user.id,
            responses: questionResponses
          });
          
          // Then submit
          submitResponse(responseId);
        }
        
        toast.success("Assessment submitted successfully!");
        navigate('/assessments/assignments');
      }
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
