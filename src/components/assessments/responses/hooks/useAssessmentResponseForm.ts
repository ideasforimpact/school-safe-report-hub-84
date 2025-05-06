
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { useAssignmentData } from './form/useAssignmentData';
import { useResponseManagement } from './form/useResponseManagement';
import { useSectionNavigation } from './form/useSectionNavigation';
import { useProgressCalculation } from './form/useProgressCalculation';

export const useAssessmentResponseForm = () => {
  const navigate = useNavigate();
  
  // Get assignment, template and response data
  const {
    assignment,
    template,
    existingResponse,
    user,
    loading,
    notFound,
    isCompleted,
    isOverdue
  } = useAssignmentData();
  
  // Handle response data and actions
  const {
    questionResponses,
    formError,
    saving,
    submitting,
    handleResponseChange,
    handleSave,
    handleSubmit
  } = useResponseManagement(template, assignment, existingResponse, user);
  
  // Navigation between sections
  const {
    currentSection,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    groupedQuestions,
    currentQuestions,
    isFirstSection,
    isLastSection,
    isFirstQuestion,
    isLastQuestion,
    goToNextSection,
    goToPreviousSection,
    goToNextQuestion,
    goToPreviousQuestion
  } = useSectionNavigation(template?.questions || []);
  
  // Calculate progress
  const {
    progressPercentage
  } = useProgressCalculation(template?.questions, questionResponses);
  
  // If no assignment or template found, redirect to assignments list after a delay
  useEffect(() => {
    if (notFound) {
      const timer = setTimeout(() => {
        toast.error("Assessment not found");
        navigate('/assessments/assignments');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [notFound, navigate]);

  return {
    assignment,
    template,
    existingResponse,
    questionResponses,
    formError,
    saving,
    submitting,
    currentSection,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    progressPercentage,
    groupedQuestions,
    currentQuestions,
    loading,
    notFound,
    isCompleted,
    isOverdue,
    isFirstSection,
    isLastSection,
    isFirstQuestion,
    isLastQuestion,
    handleResponseChange,
    handleSave,
    handleSubmit,
    goToNextSection,
    goToPreviousSection,
    goToNextQuestion,
    goToPreviousQuestion
  };
};
