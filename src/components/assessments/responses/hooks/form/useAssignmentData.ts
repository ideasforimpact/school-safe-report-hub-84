
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAssessment } from '@/contexts/assessment/AssessmentContext';
import { useAuth } from '@/contexts/auth/AuthContext';

export const useAssignmentData = () => {
  const params = useParams<{ assignmentId: string }>();
  const assignmentId = params.assignmentId;
  const { templates, assignments, responses } = useAssessment();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  
  // Get assignment, template, and existing response data
  const assignment = assignmentId ? assignments.find(a => a.id === assignmentId) : null;
  const template = assignment ? templates.find(t => t.id === assignment.templateId) : null;
  const existingResponse = assignment 
    ? responses.find(r => r.assignmentId === assignment.id && r.userId === user?.id)
    : null;
  
  useEffect(() => {
    // Log useful debugging information
    console.log("Current assignmentId from URL params:", assignmentId);
    console.log("Available assignments:", assignments);
    console.log("Found assignment:", assignment);
    console.log("Found template:", template);
    
    setLoading(true);
    
    // Short delay to allow data to load
    const timer = setTimeout(() => {
      if (assignmentId) {
        if (!assignment) {
          console.log(`Assignment with ID ${assignmentId} not found`);
          setNotFound(true);
        } else if (!template) {
          console.log(`Template for assignment ${assignmentId} not found`);
          setNotFound(true);
        } else {
          setNotFound(false);
        }
      } else {
        console.log("No assignmentId parameter found in URL");
        setNotFound(true);
      }
      
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [assignmentId, assignment, template, assignments]);
  
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
