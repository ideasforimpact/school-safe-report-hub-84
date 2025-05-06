
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAssessment } from '@/contexts/assessment/AssessmentContext';
import { useAuth } from '@/contexts/auth/AuthContext';

export const useAssignmentData = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
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
  
  // Check if assignment exists
  useEffect(() => {
    setLoading(true);
    
    if (template && assignment) {
      setNotFound(false);
    } else if (assignmentId && (!assignment || !template)) {
      // Set not found flag if we have an assignmentId but can't find the data
      setNotFound(true);
    }
    
    setLoading(false);
  }, [template, assignment, assignmentId]);
  
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
