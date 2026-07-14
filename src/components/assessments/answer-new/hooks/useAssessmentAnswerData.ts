import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileItem } from '@/types/fileTypes';

const fetchInflight = new Map<string, Promise<void>>();
import { calculateAssessmentScore } from '@/utils/assessmentScoring';

interface Answer {
  questionId: string;
  answer: string | undefined;
  comment?: string;
  attachments?: FileItem[];
}

interface Question {
  id: string;
  text: string;
  correctAnswer?: string;
  required?: boolean;
  allowComments?: boolean;
  allowAttachments?: boolean;
}

interface AssessmentData {
  id: string | number;
  name: string;
  status: string;
  created_by: string;
  assigned_to: string;
  target_completion_date?: string;
  answers?: unknown;
  template?: {
    title?: string;
    name?: string;
    questions?: unknown;
    [key: string]: unknown;
  };
}

export const useAssessmentAnswerData = (assessmentId?: string) => {
  const { user, employeeData } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [template, setTemplate] = useState<AssessmentData['template'] | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [generalComment, setGeneralComment] = useState('');
  const [generalAttachments, setGeneralAttachments] = useState<any[]>([]);
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

            let existingAnswers: Record<string, unknown>[] = [];
            if (assessmentData.answers) {
              if (Array.isArray(assessmentData.answers)) {
                existingAnswers = assessmentData.answers as Record<string, unknown>[];
              } else if (typeof assessmentData.answers === 'object') {
                existingAnswers = Object.values(assessmentData.answers) as Record<string, unknown>[];
              }
            }

            const initialAnswers = questions.map((question: Question, index: number) => {
              let existingAnswer = existingAnswers.find((ans) =>
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

            // Restore the general (assessment-level) comment and attachment, if previously saved
            setGeneralComment(assessmentData.submit_comment || '');
            setGeneralAttachments(
              Array.isArray(assessmentData.submit_attachment) ? assessmentData.submit_attachment : []
            );
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

  const handleAnswerChange = (questionId: string, field: string, value: boolean | string | FileItem[]) => {
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

  // Shared between handleSaveAsDraft and handleSubmit — uploads every
  // question's pending attachments plus the general (assessment-level)
  // attachment in a single edge-function call (one AttachmentGroup per
  // question-with-attachments, plus one for the general attachment),
  // instead of one call per question. logPrefix just distinguishes draft
  // vs submit in the console.
  const uploadAnswersAndGeneralAttachment = async (logPrefix: string) => {
    const { questionFileService } = await import('@/services/assessment/questionFileService');
    const templateName = template?.title || template?.name || 'assessment';

    const groups = [
      ...answers
        .filter(a => a.attachments && a.attachments.length > 0)
        .map(a => ({
          key: `question:${a.questionId}`,
          bucket: 'assessment-question-files',
          attachments: a.attachments!,
          templateName,
          questionId: a.questionId
        })),
      ...(generalAttachments.length > 0 ? [{
        key: 'general',
        bucket: 'assessment-submission-attachments',
        attachments: generalAttachments,
        assessmentId: assessment.assessment_id ?? assessmentId
      }] : [])
    ];

    console.log(`${logPrefix} Uploading attachments in a single batched call:`, groups.map(g => g.key));
    const results = groups.length > 0 ? await questionFileService.uploadAttachmentGroups(groups) : [];
    const resultsByKey = new Map(results.map(r => [r.key, r]));

    const failedKeys: string[] = [];
    const answersWithUploadedAttachments = answers.map(answer => {
      if (!answer.attachments || answer.attachments.length === 0) {
        return {
          questionId: answer.questionId,
          answer: answer.answer,
          comment: answer.comment || '',
          attachments: []
        };
      }

      const result = resultsByKey.get(`question:${answer.questionId}`);
      if (result?.error) {
        console.error(`${logPrefix} Error uploading attachments for question ${answer.questionId}:`, result.error);
        failedKeys.push(`question ${answer.questionId}: ${result.error}`);
      }

      return {
        questionId: answer.questionId,
        answer: answer.answer,
        comment: answer.comment || '',
        attachments: result?.attachments || []
      };
    });

    const generalResult = resultsByKey.get('general');
    if (generalResult?.error) {
      console.error(`${logPrefix} Error uploading general attachment:`, generalResult.error);
      failedKeys.push(`general attachment: ${generalResult.error}`);
    }

    if (failedKeys.length > 0) {
      toast.error('Failed to upload attachments. Please try again.');
      throw new Error(failedKeys.join('; '));
    }

    return { answersWithUploadedAttachments, uploadedGeneralAttachments: generalResult?.attachments || [] };
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
      const { answersWithUploadedAttachments, uploadedGeneralAttachments } =
        await uploadAnswersAndGeneralAttachment('[Draft]');

      const currentStatus = assessment.status === 'New' ? 'Draft' : assessment.status;

      const { error: updateError } = await supabase.functions.invoke('save-assessment-draft/save-draft', {
        body: {
          assessment_id: parseInt(assessmentId),
          client_id: clientId,
          status: currentStatus,
          answers: answersWithUploadedAttachments,
          submit_comment: generalComment.trim() || null,
          submit_attachment: uploadedGeneralAttachments.length > 0 ? uploadedGeneralAttachments : null,
        },
      });

      if (updateError) {
        console.error('Draft save error:', updateError);
        throw new Error(`Failed to save draft: ${updateError.message}`);
      }

      setAssessment(prev => prev ? {
        ...prev,
        status: currentStatus,
        answers: answersWithUploadedAttachments,
        submit_comment: generalComment.trim() || null,
        submit_attachment: uploadedGeneralAttachments
      } : null);
      setGeneralAttachments(uploadedGeneralAttachments);
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

    if (!generalComment.trim()) {
      toast.error('Please add a general comment before submitting');
      return;
    }

    if (generalAttachments.length === 0) {
      toast.error('Please add at least one general attachment before submitting');
      return;
    }

    setSubmitting(true);
    
    try {
      // Upload attachments for all answers before submitting
      const { answersWithUploadedAttachments, uploadedGeneralAttachments } =
        await uploadAnswersAndGeneralAttachment('[Submit]');

      // Calculate score
      const score = calculateAssessmentScore(questions, answers as any);

      const { error: updateError } = await supabase.functions.invoke('save-assessment-draft/submit-assessment', {
        body: {
          assessment_id: parseInt(assessmentId!),
          client_id: clientId,
          score,
          answers: answersWithUploadedAttachments,
          submit_comment: generalComment.trim(),
          submit_attachment: uploadedGeneralAttachments,
          performed_by: {
            id: employeeData?.id || '',
            first_name: employeeData?.firstName || '',
            last_name: employeeData?.lastName || '',
            email: employeeData?.email || '',
          },
          assessment_info: {
            id: assessment.id,
            name: assessment.name,
            created_by: assessment.created_by,
            assigned_to: assessment.assigned_to,
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
    generalComment,
    setGeneralComment,
    generalAttachments,
    setGeneralAttachments,
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
