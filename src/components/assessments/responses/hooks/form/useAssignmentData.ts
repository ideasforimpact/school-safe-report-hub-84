
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAssessment } from '@/contexts/assessment/AssessmentContext';
import { useAuth } from '@/contexts/auth/AuthContext';

export const useAssignmentData = () => {
  const params = useParams<{ assignmentId?: string; assessmentId?: string }>();
  const assignmentId = params.assignmentId;
  const assessmentId = params.assessmentId;
  const { templates, assignments, responses } = useAssessment();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  
  // Get assignment and template data based on the available parameter
  let assignment = null;
  let template = null;
  
  if (assignmentId) {
    // Original flow: find assignment by assignment ID
    assignment = assignments.find(a => a.id === assignmentId);
    template = assignment ? templates.find(t => t.id === assignment.templateId) : null;
  } else if (assessmentId) {
    // New flow: find assignment by assessment ID (assuming assessment ID corresponds to assignment ID)
    assignment = assignments.find(a => a.id === assessmentId);
    template = assignment ? templates.find(t => t.id === assignment.templateId) : null;
  }
  
  const existingResponse = assignment 
    ? responses.find(r => r.assignmentId === assignment.id && r.userId === user?.id)
    : null;
  
  useEffect(() => {
    const currentId = assignmentId || assessmentId;
    
    // Log useful debugging information
    console.log("Current assignmentId from URL params:", assignmentId);
    console.log("Current assessmentId from URL params:", assessmentId);
    console.log("Available assignments:", assignments);
    console.log("Found assignment:", assignment);
    console.log("Found template:", template);
    
    setLoading(true);
    
    // Short delay to allow data to load
    const timer = setTimeout(() => {
      if (currentId) {
        if (!assignment) {
          console.log(`Assignment with ID ${currentId} not found`);
          setNotFound(true);
        } else if (!template) {
          console.log(`Template for assignment ${currentId} not found`);
          setNotFound(true);
        } else {
          setNotFound(false);
        }
      } else {
        console.log("No assignmentId or assessmentId parameter found in URL");
        setNotFound(true);
      }
      
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [assignmentId, assessmentId, assignment, template, assignments]);
  
  return {
    assignment,
    template,
    existingResponse,
    user,
    loading,
    notFound,
    isCompleted: existingResponse?.status === 'Submitted',
    isOverdue: assignment ? new Date(assignment.dueDate) < new Date() && assignment.status !== 'Completed' : false
  };
};
