import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Answer {
  questionId: string;
  answer: boolean | undefined;
  comment?: string;
  attachments?: any[];
}

interface Question {
  id: string;
  text: string;
  required?: boolean;
  allowComments?: boolean;
  allowAttachments?: boolean;
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
  const [saving, setSaving] = useState(false);
  
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
        
        console.log('Fetching assessment with ID:', assessmentId, 'and clientId:', clientId);
        
        // Fetch assessment by assessment_id instead of id
        const { data: assessmentData, error: assessmentError } = await supabase
          .from('assessments')
          .select('*')
          .eq('assessment_id', parseInt(assessmentId))
          .eq('client_id', clientId)
          .single();

        if (assessmentError) {
          console.error('Assessment fetch error:', assessmentError);
          throw new Error('Assessment not found or access denied');
        }

        console.log('Fetched assessment data:', assessmentData);
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
            console.error('Template fetch error:', templateError);
            throw new Error('Assessment template not found');
          }

          console.log('Fetched template data:', templateData);
          setTemplate(templateData);
          
          // Parse questions from JSONB and initialize answers array
          const questions = Array.isArray(templateData.questions) 
            ? (templateData.questions as unknown as Question[])
            : [];
            
          console.log('Parsed questions:', questions);
          
          // Load existing answers if they exist - handle different data types
          let existingAnswers: any[] = [];
          
          if (assessmentData.answers) {
            if (Array.isArray(assessmentData.answers)) {
              existingAnswers = assessmentData.answers;
            } else if (typeof assessmentData.answers === 'object') {
              // If it's an object, try to extract an array
              existingAnswers = Object.values(assessmentData.answers);
            }
          }
          
          console.log('Existing answers from database:', existingAnswers);
          
          const initialAnswers = questions.map((question: Question) => {
            // Find existing answer for this question
            const existingAnswer = existingAnswers.find((ans: any) => 
              ans && typeof ans === 'object' && ans.questionId === question.id
            );
            
            console.log(`Question ${question.id} existing answer:`, existingAnswer);
            
            return {
              questionId: question.id,
              answer: existingAnswer?.answer !== undefined ? existingAnswer.answer : undefined,
              comment: existingAnswer?.comment || '',
              attachments: existingAnswer?.attachments || []
            };
          });
          
          console.log('Initialized answers with existing data:', initialAnswers);
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
    console.log(`Updating answer for question ${questionId}, field ${field}:`, value);
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

  const handleSaveAsDraft = async () => {
    if (!assessment || !template) return;

    setSaving(true);
    
    try {
      // Convert answers to a format compatible with JSONB
      const answersData = answers.map(answer => ({
        questionId: answer.questionId,
        answer: answer.answer,
        comment: answer.comment || '',
        attachments: answer.attachments || []
      }));

      console.log('Saving draft with answers:', answersData);

      // Update assessment with current answers but keep status as is (or set to 'Draft' if it's 'New')
      const currentStatus = assessment.status === 'New' ? 'Draft' : assessment.status;
      
      const { error: updateError } = await supabase
        .from('assessments')
        .update({ 
          status: currentStatus,
          answers: answersData as any
        })
        .eq('assessment_id', parseInt(assessmentId!))
        .eq('client_id', clientId);

      if (updateError) {
        console.error('Draft save error:', updateError);
        throw updateError;
      }

      // Update local assessment state to reflect the saved status
      setAssessment(prev => prev ? { ...prev, status: currentStatus, answers: answersData } : null);

      toast.success('Assessment saved as draft successfully!');
      
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft. Please try again.');
    } finally {
      setSaving(false);
    }
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
        comment: answer.comment || '',
        attachments: answer.attachments || []
      }));

      console.log('Submitting assessment with answers:', answersData);

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
        console.error('Submit error:', updateError);
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
    saving,
    progress,
    handleAnswerChange,
    handleSubmit,
    handleSaveAsDraft
  };
};
