
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Answer {
  questionId: string;
  answer: boolean | undefined;
  comment?: string;
}

interface Question {
  id: string;
  text: string;
  required?: boolean;
  allowComments?: boolean;
}

export const useAnswerAssessmentForm = () => {
  const params = useParams<{ assessmentId?: string }>();
  const assessmentId = params.assessmentId;
  const { user, employeeData } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState(null);
  const [template, setTemplate] = useState(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [submitting, setSubmitting] = useState(false);
  
  const clientId = employeeData?.clientId || user?.clientId;

  useEffect(() => {
    const fetchAssessmentData = async () => {
      if (!assessmentId || !clientId) {
        setError('Assessment ID or client context is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data: responseData, error: fetchError } = await supabase
        .functions.invoke('list-assessments', {
          body: { assessment_id: parseInt(assessmentId), 
          client_id: clientId },
          headers: { path: 'get' },
        });

        if (fetchError) throw new Error('Assessment not found');

        const assessmentData = responseData?.assessment;
        if (!assessmentData) throw new Error('Assessment not found');

        setAssessment(assessmentData);

        if (assessmentData.template) {
          setTemplate(assessmentData.template);

          const questions = Array.isArray(assessmentData.template.questions)
            ? (assessmentData.template.questions as unknown as Question[])
            : [];

          const initialAnswers = questions.map((question: Question) => ({
            questionId: question.id,
            answer: undefined,
            comment: ''
          }));

          setAnswers(initialAnswers);
        }
        
      } catch (err) {
        console.error('Error fetching assessment:', err);
        setError(err instanceof Error ? err.message : 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessmentData();
  }, [assessmentId, clientId]);

  const handleAnswerChange = (questionId: string, field: string, value: any) => {
    setAnswers(prev => 
      prev.map(answer => 
        answer.questionId === questionId 
          ? { ...answer, [field]: value }
          : answer
      )
    );
  };

  const calculateProgress = () => {
    if (!template?.questions) return 0;
    
    const questions = Array.isArray(template.questions) 
      ? (template.questions as unknown as Question[])
      : [];
    
    const answeredQuestions = answers.filter(answer => answer.answer !== undefined).length;
    return Math.round((answeredQuestions / questions.length) * 100);
  };

  const handleSubmit = async () => {
    if (!assessment || !template) return;
    
    // Parse questions from JSONB
    const questions = Array.isArray(template.questions) 
      ? (template.questions as unknown as Question[])
      : [];
    
    // Check if all required questions are answered
    const unansweredRequired = questions.some((question: Question) => {
      if (question.required) {
        const answer = answers.find(a => a.questionId === question.id);
        return answer?.answer === undefined;
      }
      return false;
    });

    if (unansweredRequired) {
      toast.error('Please answer all required questions before submitting');
      return;
    }

    setSubmitting(true);
    
    try {
      // Calculate score
      const totalQuestions = questions.length;
      const yesAnswers = answers.filter(a => a.answer === true).length;
      const score = totalQuestions > 0 ? Math.round((yesAnswers / totalQuestions) * 100) : 0;

      // Convert answers to a format compatible with JSONB
      const answersData = answers.map(answer => ({
        questionId: answer.questionId,
        answer: answer.answer,
        comment: answer.comment || ''
      }));

      const { error: updateError } = await supabase.functions.invoke('save-assessment-draft/submit-assessment', {
        body: {
          assessment_id: parseInt(assessmentId!),
          client_id: clientId,
          score,
          answers: answersData,
          performed_by: {
            id: employeeData?.id || user?.id || '',
            first_name: employeeData?.firstName || '',
            last_name: employeeData?.lastName || '',
            email: employeeData?.email || user?.email || '',
          },
          assessment_info: {
            id: (assessment as any).id,
            name: (assessment as any).name,
            created_by: (assessment as any).created_by,
            assigned_to: (assessment as any).assigned_to,
          },
        },
      });

      if (updateError) {
        throw updateError;
      }

      toast.success('Assessment submitted successfully!');
      navigate('/assessments');
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    assessment,
    template,
    answers,
    loading,
    error,
    submitting,
    handleAnswerChange,
    handleSubmit,
    calculateProgress
  };
};
