
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAssessment } from '@/contexts/assessment/AssessmentContext';
import { useAuth } from '@/contexts/auth/AuthContext';
import { QuestionResponse } from '@/types/assessment';
import { toast } from "sonner";

export const useAssessmentResponseForm = () => {
  const navigate = useNavigate();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { 
    templates, 
    assignments, 
    responses, 
    createResponse, 
    updateResponse, 
    submitResponse 
  } = useAssessment();
  const { user } = useAuth();
  
  const [formError, setFormError] = useState<string | null>(null);
  const [questionResponses, setQuestionResponses] = useState<QuestionResponse[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  
  // Get assignment, template, and existing response data
  const assignment = assignmentId ? assignments.find(a => a.id === assignmentId) : null;
  const template = assignment ? templates.find(t => t.id === assignment.templateId) : null;
  const existingResponse = assignment 
    ? responses.find(r => r.assignmentId === assignment.id && r.userId === user?.id)
    : null;
  
  // Initialize form with existing response data or empty values
  useEffect(() => {
    if (template && assignment) {
      if (existingResponse) {
        // Use existing responses
        setQuestionResponses(existingResponse.responses);
      } else {
        // Create empty responses for each question
        const emptyResponses = template.questions.map(question => ({
          questionId: question.id,
          answer: false,
          comment: null,
          attachments: null
        }));
        setQuestionResponses(emptyResponses);
      }
    }
  }, [template, assignment, existingResponse]);
  
  // If no assignment or template found, redirect to assignments list
  useEffect(() => {
    if (!assignmentId) {
      navigate('/assessments/assignments');
      return;
    }
    
    if (assignmentId && (!assignment || !template)) {
      navigate('/assessments/assignments');
    }
  }, [assignmentId, assignment, template, navigate]);
  
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

  // Calculate progress
  const totalQuestions = template?.questions.length || 0;
  const answeredQuestions = questionResponses.filter(r => r.answer !== undefined).length;
  const progressPercentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  
  // Group questions into sections of 5 for easier navigation
  const QUESTIONS_PER_PAGE = 5;
  const groupedQuestions = template?.questions ? (() => {
    const groups = [];
    for (let i = 0; i < template.questions.length; i += QUESTIONS_PER_PAGE) {
      groups.push(template.questions.slice(i, i + QUESTIONS_PER_PAGE));
    }
    return groups;
  })() : [];
  
  const currentQuestions = groupedQuestions[currentSection] || [];
  const isFirstSection = currentSection === 0;
  const isLastSection = currentSection === groupedQuestions.length - 1;
  
  const goToNextSection = () => {
    setCurrentSection(prev => Math.min(groupedQuestions.length - 1, prev + 1));
  };

  const goToPreviousSection = () => {
    setCurrentSection(prev => Math.max(0, prev - 1));
  };

  return {
    assignment,
    template,
    existingResponse,
    questionResponses,
    formError,
    saving,
    submitting,
    currentSection,
    progressPercentage,
    groupedQuestions,
    currentQuestions,
    isCompleted: existingResponse?.status === 'Submitted',
    isOverdue: assignment ? new Date(assignment.dueDate) < new Date() && assignment.status !== 'Completed' : false,
    isFirstSection,
    isLastSection,
    handleResponseChange,
    handleSave,
    handleSubmit,
    goToNextSection,
    goToPreviousSection,
    setCurrentSection
  };
};
