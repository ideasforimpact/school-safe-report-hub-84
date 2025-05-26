
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAssessment } from '@/contexts/assessment/AssessmentContext';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useAssignmentData = () => {
  const params = useParams<{ assignmentId?: string; assessmentId?: string }>();
  const assignmentId = params.assignmentId;
  const assessmentId = params.assessmentId;
  const { templates, assignments, responses } = useAssessment();
  const { user, employeeData } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [template, setTemplate] = useState(null);
  
  // Get client_id from either employeeData or user context
  const clientId = employeeData?.clientId || user?.clientId;
  
  let assignment = null;
  
  if (assignmentId) {
    // Original flow: find assignment by assignment ID
    assignment = assignments.find(a => a.id === assignmentId);
    template = assignment ? templates.find(t => t.id === assignment.templateId) : null;
  }
  
  const existingResponse = assignment 
    ? responses.find(r => r.assignmentId === assignment.id && r.userId === user?.id)
    : null;
  
  useEffect(() => {
    const fetchAssessmentData = async () => {
      if (assessmentId && clientId) {
        try {
          setLoading(true);
          
          // Fetch assessment from Supabase
          const { data: assessmentData, error: assessmentError } = await supabase
            .from('assessments')
            .select(`
              id,
              name,
              description,
              status,
              target_completion_date,
              template_id,
              assigned_to,
              created_by,
              score,
              client_id
            `)
            .eq('id', assessmentId)
            .eq('client_id', clientId)
            .single();

          if (assessmentError) {
            console.error('Error fetching assessment:', assessmentError);
            setNotFound(true);
            setLoading(false);
            return;
          }

          if (!assessmentData) {
            console.log(`Assessment with ID ${assessmentId} not found`);
            setNotFound(true);
            setLoading(false);
            return;
          }

          setAssessment(assessmentData);

          // Fetch template from Supabase
          if (assessmentData.template_id) {
            const { data: templateData, error: templateError } = await supabase
              .from('assessment_templates')
              .select('*')
              .eq('id', assessmentData.template_id)
              .eq('client_id', clientId)
              .single();

            if (templateError) {
              console.error('Error fetching template:', templateError);
              setNotFound(true);
            } else if (templateData) {
              setTemplate(templateData);
              setNotFound(false);
            } else {
              console.log(`Template for assessment ${assessmentId} not found`);
              setNotFound(true);
            }
          } else {
            console.log('Assessment has no template_id');
            setNotFound(true);
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Error in fetchAssessmentData:', error);
          setNotFound(true);
          setLoading(false);
        }
      } else if (assignmentId) {
        // Original flow for assignments
        const currentId = assignmentId;
        
        console.log("Current assignmentId from URL params:", assignmentId);
        console.log("Available assignments:", assignments);
        console.log("Found assignment:", assignment);
        
        setLoading(true);
        
        const timer = setTimeout(() => {
          if (!assignment) {
            console.log(`Assignment with ID ${currentId} not found`);
            setNotFound(true);
          } else if (!template) {
            console.log(`Template for assignment ${currentId} not found`);
            setNotFound(true);
          } else {
            setNotFound(false);
          }
          
          setLoading(false);
        }, 500);
        
        return () => clearTimeout(timer);
      } else {
        console.log("No assignmentId or assessmentId parameter found in URL");
        setNotFound(true);
        setLoading(false);
      }
    };

    fetchAssessmentData();
  }, [assignmentId, assessmentId, assignment, assignments, clientId]);
  
  return {
    assignment: assessment || assignment,
    template,
    existingResponse,
    user,
    loading,
    notFound,
    isCompleted: (assessment?.status || assignment?.status) === 'Submitted',
    isOverdue: (assessment || assignment) ? new Date((assessment?.target_completion_date || assignment?.dueDate)) < new Date() && (assessment?.status || assignment?.status) !== 'Completed' : false
  };
};
