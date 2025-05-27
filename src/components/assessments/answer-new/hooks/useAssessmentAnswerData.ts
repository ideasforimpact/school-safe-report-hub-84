
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export const useAssessmentAnswerData = (assessmentId?: string) => {
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
        
        // Fetch assessment by assessment_id instead of id
        const { data: assessmentData, error: assessmentError } = await supabase
          .from('assessments')
          .select('*')
          .eq('assessment_id', parseInt(assessmentId))
          .eq('client_id', clientId)
          .single();

        if (assessmentError) {
          throw new Error('Assessment not found or access denied');
        }

        setAssessment(assessmentData);

        // Fetch template
        if (assessmentData.template_id) {
          const { data: templateData, error: templateError } = await supabase
            .from('assessment_templates')
            .select('*')
            .eq('id', assessmentData.template_id)
            .eq('client_id', clientId)
            .single();

          if (templateError) {
            throw new Error('Assessment template not found');
          }

          setTemplate(templateData);
          
          // Parse questions from JSONB and initialize answers array
          const questions = Array.isArray(templateData.questions) 
            ? (templateData.questions as unknown as Question[])
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
    
    if (questions.length === 0) return 0;
    
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

      // Update assessment status, score, and answers using assessment_id
      const { error: updateError } = await supabase
        .from('assessments')
        .update({ 
          status: 'Submitted',
          score: score,
          answers: answersData as any
        })
        .eq('assessment_id', parseInt(assessmentId!))
        .eq('client_id', clientId);

      if (updateError) {
        throw updateError;
      }

      toast.success('Assessment submitted successfully!', {
        description: `Your score: ${score}%`
      });
      
      navigate('/assessments');
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = calculateProgress();

  return {
    assessment,
    template,
    answers,
    loading,
    error,
    submitting,
    progress,
    handleAnswerChange,
    handleSubmit
  };
};
