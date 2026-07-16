
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
          
          const { data: responseData, error: fetchError } = await supabase.functions.invoke('list-assessments', {
            body: { assessment_id: parseInt(assessmentId), 
            client_id: clientId },
            headers: { path: 'get' },
          });

          if (fetchError) {
            console.error('Error fetching assessment:', fetchError);
            setNotFound(true);
            setLoading(false);
            return;
          }

          const assessmentData = responseData?.assessment;
          if (!assessmentData) {
            console.log(`Assessment with ID ${assessmentId} not found`);
            setNotFound(true);
            setLoading(false);
            return;
          }

          setAssessment(assessmentData);

          if (assessmentData.template) {
            setTemplate(assessmentData.template);
            setNotFound(false);
          } else {
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
