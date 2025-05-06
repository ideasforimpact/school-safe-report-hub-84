
import { useState } from 'react';
import { QuestionResponse } from '@/types/assessment';
import { useAssessment } from '@/contexts/assessment/AssessmentContext';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";

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
      if (existingResponse) {
        // Update existing response
        updateResponse(existingResponse.id, {
          responses: questionResponses
        });
        toast.success("Progress saved successfully");
      } else {
        // Create new response
        createResponse({
          assignmentId: assignment.id,
          templateId: template.id,
          userId: user.id,
          responses: questionResponses
        });
        toast.success("Response created and saved");
      }
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
      
      // Show success message
      toast.success("Assessment submitted successfully!");
      
      // Navigate to assignments list
      navigate('/assessments/assignments');
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
