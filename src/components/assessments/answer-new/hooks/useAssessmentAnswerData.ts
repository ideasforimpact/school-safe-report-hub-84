import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { assessmentNotificationService } from '@/services/notification/assessmentNotificationService';

const fetchInflight = new Map<string, Promise<void>>();

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
  const lastFetchKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!assessmentId || !clientId) {
      setError('Assessment ID or client context is missing');
      setLoading(false);
      return;
    }

    const fetchKey = `${assessmentId}:${clientId}`;

    // Skip if already fetched or a fetch is already in-flight for this key
    if (lastFetchKeyRef.current === fetchKey) return;
    if (fetchInflight.has(fetchKey)) return;

    lastFetchKeyRef.current = fetchKey;

    const fetchAssessmentData = async () => {
      try {
        setLoading(true);

        const assessmentIdNum = parseInt(assessmentId);
        if (isNaN(assessmentIdNum)) throw new Error('Invalid assessment ID format');

        const { data: responseData, error: fnError } = await supabase
        .functions.invoke('list-assessments', {
          body: { assessment_id: assessmentIdNum, 
          client_id: clientId },
          headers: { path: 'get' },
        });

        if (fnError) throw new Error('Failed to fetch assessment data');

        const assessmentData = responseData?.assessment;
        if (!assessmentData) throw new Error('Assessment not found or access denied');

        setAssessment(assessmentData);

        if (assessmentData.template) {
          const currentTemplate = assessmentData.template;
          if (currentTemplate) {
            const rawQuestions = Array.isArray(currentTemplate.questions) 
              ? (currentTemplate.questions as unknown as Question[])
              : [];
              
            const questions = rawQuestions.map((question: Question, index: number) => {
              if (!question.id) {
                return { ...question, id: `question_${index}_${Date.now()}` };
              }
              return question;
            });

            setTemplate({ ...currentTemplate, questions });

            let existingAnswers: any[] = [];
            if (assessmentData.answers) {
              if (Array.isArray(assessmentData.answers)) {
                existingAnswers = assessmentData.answers;
              } else if (typeof assessmentData.answers === 'object') {
                existingAnswers = Object.values(assessmentData.answers);
              }
            }

            const initialAnswers = questions.map((question: Question, index: number) => {
              let existingAnswer = existingAnswers.find((ans: any) =>
                ans && typeof ans === 'object' && ans.questionId === question.id
              );
              if (!existingAnswer && existingAnswers[index]) {
                const answerByIndex = existingAnswers[index];
                if (answerByIndex && typeof answerByIndex === 'object') {
                  existingAnswer = answerByIndex;
                }
              }
              return {
                questionId: question.id,
                answer: existingAnswer?.answer !== undefined ? existingAnswer.answer : undefined,
                comment: existingAnswer?.comment || '',
                attachments: existingAnswer?.attachments || []
              };
            });

            setAnswers(initialAnswers);
          }
        } else {
          throw new Error('Assessment has no associated template');
        }
        
      } catch (err) {
        console.error('Error fetching assessment:', err);
        setError(err instanceof Error ? err.message : 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    };

    const p = fetchAssessmentData().finally(() => fetchInflight.delete(fetchKey));
    fetchInflight.set(fetchKey, p);
  }, [assessmentId, clientId]);

  const handleAnswerChange = (questionId: string, field: string, value: any) => {
    // CRITICAL: Validate questionId is not undefined or empty
    if (!questionId || questionId === 'undefined') {
      console.error(`[useAssessmentAnswerData] ERROR: Attempted to update answer with invalid questionId:`, questionId);
      return;
    }
    
    setAnswers(prev =>
      prev.map(answer =>
        answer.questionId && answer.questionId === questionId
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
    if (!assessment || !template || !assessmentId || !employeeData?.id || !clientId) {
      console.error('Missing required data for saving draft:', { assessment, template, assessmentId });
      toast.error('Missing required data. Please try again.');
      return;
    }

    setSaving(true);
    
    try {
      // Upload attachments for all answers before saving draft (same as submit)
      const { questionFileService } = await import('@/services/assessment/questionFileService');
      // Use template title (name) instead of assessment name to match existing question file structure
      const templateName = template?.title || template?.name || 'assessment';
      
      const answersWithUploadedAttachments = await Promise.all(
        answers.map(async (answer) => {
          if (!answer.attachments || answer.attachments.length === 0) {
            return {
        questionId: answer.questionId,
        answer: answer.answer,
        comment: answer.comment || '',
              attachments: []
            };
          }

          try {

            const uploadedAttachments = await questionFileService.uploadAnswerAttachments(
              answer.attachments,
              clientId,
              employeeData.id,
              templateName,
              answer.questionId
            );
            
            return {
              questionId: answer.questionId,
              answer: answer.answer,
              comment: answer.comment || '',
              attachments: uploadedAttachments
            };
          } catch (uploadError) {
            console.error(`[Draft] Error uploading attachments for question ${answer.questionId}:`, uploadError);
            toast.error(`Failed to upload attachments for question. Please try again.`);
            throw uploadError;
          }
        })
      );


      const currentStatus = assessment.status === 'New' ? 'Draft' : assessment.status;

      const { error: updateError } = await supabase.functions.invoke('save-assessment-draft/save-draft', {
        body: {
          assessment_id: parseInt(assessmentId),
          client_id: clientId,
          status: currentStatus,
          answers: answersWithUploadedAttachments,
        },
      });

      if (updateError) {
        console.error('Draft save error:', updateError);
        throw new Error(`Failed to save draft: ${updateError.message}`);
      }

      setAssessment(prev => prev ? { ...prev, status: currentStatus, answers: answersWithUploadedAttachments } : null);
      toast.success('Assessment saved as draft successfully!');
      navigate('/assessments');
      
    } catch (error) {
      console.error('Error saving draft:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to save draft: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!assessment || !template || !employeeData?.id || !clientId) return;
    
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
      // Upload attachments for all answers before submitting
      const { questionFileService } = await import('@/services/assessment/questionFileService');
      // Use template title (name) instead of assessment name to match existing question file structure
      const templateName = template?.title || template?.name || 'assessment';
      
      const answersWithUploadedAttachments = await Promise.all(
        answers.map(async (answer) => {
          if (!answer.attachments || answer.attachments.length === 0) {
            return {
              questionId: answer.questionId,
              answer: answer.answer,
              comment: answer.comment || '',
              attachments: []
            };
          }

          try {

            const uploadedAttachments = await questionFileService.uploadAnswerAttachments(
              answer.attachments,
              clientId,
              employeeData.id,
              templateName,
              answer.questionId
            );
            
            return {
              questionId: answer.questionId,
              answer: answer.answer,
              comment: answer.comment || '',
              attachments: uploadedAttachments
            };
          } catch (uploadError) {
            console.error(`Error uploading attachments for question ${answer.questionId}:`, uploadError);
            toast.error(`Failed to upload attachments for question. Please try again.`);
            throw uploadError;
          }
        })
      );

      // Calculate score
      const totalQuestions = questions.length;
      const yesAnswers = answers.filter(a => a.answer === true).length;
      const score = totalQuestions > 0 ? Math.round((yesAnswers / totalQuestions) * 100) : 0;

      const { error: updateError } = await supabase.functions.invoke('save-assessment-draft/submit-assessment', {
        body: {
          assessment_id: parseInt(assessmentId!),
          client_id: clientId,
          score,
          answers: answersWithUploadedAttachments,
          performed_by: {
            id: employeeData?.id || '',
            first_name: employeeData?.firstName || '',
            last_name: employeeData?.lastName || '',
            email: employeeData?.email || '',
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
