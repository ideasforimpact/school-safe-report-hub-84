
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useAssignmentData = () => {
  const params = useParams<{ assessmentId?: string }>();
  const assessmentId = params.assessmentId;
  const { user, employeeData } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [template, setTemplate] = useState(null);
  
  // Get client_id from either employeeData or user context
  const clientId = employeeData?.clientId || user?.clientId;
  
  const existingResponse = null; // No existing responses for now
  
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
      } else {
        console.log("No assessmentId parameter found in URL");
        setNotFound(true);
        setLoading(false);
      }
    };

    fetchAssessmentData();
  }, [assessmentId, clientId]);
  
  return {
    assignment: assessment, // Keep this name for compatibility with existing code
    template,
    existingResponse,
    user,
    loading,
    notFound,
    isCompleted: assessment?.status === 'Submitted',
    isOverdue: assessment ? new Date(assessment.target_completion_date) < new Date() && assessment.status !== 'Completed' : false
  };
};
