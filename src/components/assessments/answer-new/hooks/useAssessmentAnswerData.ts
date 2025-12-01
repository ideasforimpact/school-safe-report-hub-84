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
        
        // First, try to fetch assessment by assessment_id (integer)
        const assessmentIdNum = parseInt(assessmentId);
        if (isNaN(assessmentIdNum)) {
          throw new Error('Invalid assessment ID format');
        }

        const { data: assessmentData, error: assessmentError } = await supabase
          .from('assessments')
          .select('*')
          .eq('assessment_id', assessmentIdNum)
          .eq('client_id', clientId)
          .maybeSingle();

        if (assessmentError) {
          console.error('Assessment fetch error:', assessmentError);
          throw new Error('Failed to fetch assessment data');
        }

        if (!assessmentData) {
          console.log(`Assessment with ID ${assessmentId} not found for client ${clientId}`);
          throw new Error('Assessment not found or access denied');
        }

        console.log('Fetched assessment data:', assessmentData);
        setAssessment(assessmentData);

        // Fetch template using the template_id from the assessment
        if (assessmentData.template_id) {
          console.log('Fetching template with ID:', assessmentData.template_id);
          
          const { data: templateData, error: templateError } = await supabase
            .from('assessment_templates')
            .select('*')
            .eq('id', assessmentData.template_id)
            .maybeSingle();

          if (templateError) {
            console.error('Template fetch error:', templateError);
            throw new Error(`Failed to fetch assessment template: ${templateError.message}`);
          }

          // Determine which template data to use
          let finalTemplateData = templateData || null;
          
          if (!finalTemplateData) {
            console.log(`Template with ID ${assessmentData.template_id} not found`);
            // Try to fetch without client_id filter as a fallback
            const { data: fallbackTemplateData, error: fallbackError } = await supabase
              .from('assessment_templates')
              .select('*')
              .eq('id', assessmentData.template_id)
              .maybeSingle();
              
            if (fallbackError || !fallbackTemplateData) {
              throw new Error('Assessment template not found');
            }
            
            console.log('Found template using fallback method:', fallbackTemplateData);
            finalTemplateData = fallbackTemplateData;
          } else {
            console.log('Fetched template data:', finalTemplateData);
          }
          
          // Parse questions from JSONB and process them
          const currentTemplate = finalTemplateData || null;
          if (currentTemplate) {
            const rawQuestions = Array.isArray(currentTemplate.questions) 
              ? (currentTemplate.questions as unknown as Question[])
              : [];
              
            console.log('Raw questions from database:', rawQuestions);
            
            // Ensure all questions have an id - generate one if missing
            const questions = rawQuestions.map((question: Question, index: number) => {
              // If question doesn't have an id, generate one based on index
              // This ensures each question has a unique identifier
              if (!question.id) {
                console.warn(`Question at index ${index} is missing an id. Generating one...`, question);
                return {
                  ...question,
                  id: `question_${index}_${Date.now()}`
                };
              }
              return question;
            });
              
            console.log('Processed questions with IDs:', questions.map(q => ({ id: q.id, text: q.text?.substring(0, 50) })));
            
            // CRITICAL: Update template state with processed questions that have IDs
            const templateWithProcessedQuestions = {
              ...currentTemplate,
              questions: questions
            };
            setTemplate(templateWithProcessedQuestions);
            console.log('Set template with processed questions:', templateWithProcessedQuestions);
            
            // Load existing answers if they exist
            let existingAnswers: any[] = [];
            
            if (assessmentData.answers) {
              if (Array.isArray(assessmentData.answers)) {
                existingAnswers = assessmentData.answers;
              } else if (typeof assessmentData.answers === 'object') {
                existingAnswers = Object.values(assessmentData.answers);
              }
            }
            
            console.log('Existing answers from database:', existingAnswers);
            
            // Initialize answers array - ensure each question has a corresponding answer entry
            const initialAnswers = questions.map((question: Question, index: number) => {
              // First try to find by questionId
              let existingAnswer = existingAnswers.find((ans: any) => 
                ans && typeof ans === 'object' && ans.questionId === question.id
              );
              
              // If not found and questionId was undefined in existing answer, try to match by index
              // This handles legacy data where questionId might be undefined
              if (!existingAnswer && existingAnswers[index]) {
                const answerByIndex = existingAnswers[index];
                if (answerByIndex && typeof answerByIndex === 'object') {
                  console.log(`Found answer by index ${index} for question ${question.id}`);
                  existingAnswer = answerByIndex;
                }
              }
              
              console.log(`Question ${question.id} (index ${index}) existing answer:`, existingAnswer);
              
              // CRITICAL: Always use question.id (which we've ensured exists) as questionId
              return {
                questionId: question.id, // This should never be undefined now
                answer: existingAnswer?.answer !== undefined ? existingAnswer.answer : undefined,
                comment: existingAnswer?.comment || '',
                attachments: existingAnswer?.attachments || []
              };
            });
              
            // Validate that all answers have a questionId
            const invalidAnswers = initialAnswers.filter(a => !a.questionId);
            if (invalidAnswers.length > 0) {
              console.error('ERROR: Some answers have undefined questionId!', invalidAnswers);
            }
            
            console.log('Initialized answers with existing data:', initialAnswers.map(a => ({ questionId: a.questionId, answer: a.answer })));
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

    fetchAssessmentData();
  }, [assessmentId, clientId]);

  const handleAnswerChange = (questionId: string, field: string, value: any) => {
    // CRITICAL: Validate questionId is not undefined or empty
    if (!questionId || questionId === 'undefined') {
      console.error(`[useAssessmentAnswerData] ERROR: Attempted to update answer with invalid questionId:`, questionId);
      return;
    }
    
    console.log(`[useAssessmentAnswerData] Updating answer for question ${questionId}, field ${field}:`, value);
    setAnswers(prev => {
      const updated = prev.map(answer => {
        // CRITICAL: Only match if both questionIds are defined and equal
        // This prevents matching answers with undefined questionIds
        if (answer.questionId && questionId && answer.questionId === questionId) {
          console.log(`[useAssessmentAnswerData] Found matching answer for questionId ${questionId}, updating ${field} to:`, value);
          return { ...answer, [field]: value };
        }
        return answer;
      });
      console.log(`[useAssessmentAnswerData] Updated answers array:`, updated.map(a => ({ questionId: a.questionId, answer: a.answer })));
      return updated;
    });
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
            console.log(`[Draft] Uploading attachments for question ${answer.questionId}:`, answer.attachments);
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

      console.log('[Draft] Saving draft with answers:', answersWithUploadedAttachments);

      const currentStatus = assessment.status === 'New' ? 'Draft' : assessment.status;
      
      const { data, error: updateError } = await supabase
        .from('assessments')
        .update({ 
          status: currentStatus,
          answers: answersWithUploadedAttachments as any
        })
        .eq('assessment_id', parseInt(assessmentId))
        .eq('client_id', clientId)
        .select();

      if (updateError) {
        console.error('Draft save error:', updateError);
        throw new Error(`Failed to save draft: ${updateError.message}`);
      }

      console.log('[Draft] Draft saved successfully:', data);
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
            console.log(`Uploading attachments for question ${answer.questionId}:`, answer.attachments);
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

      console.log('Submitting assessment with answers:', answersWithUploadedAttachments);

      const { error: updateError } = await supabase
        .from('assessments')
        .update({ 
          status: 'Submitted',
          score: score,
          answers: answersWithUploadedAttachments as any
        })
        .eq('assessment_id', parseInt(assessmentId!))
        .eq('client_id', clientId);

      if (updateError) {
        console.error('Submit error:', updateError);
        throw updateError;
      }

      // Send notification to assessment creator (not self if self-submitted)
      try {
        // Get assessment details with creator info
        const { data: fullAssessment, error: assessmentError } = await supabase
          .from('assessments')
          .select('id, name, created_by, assigned_to, client_id')
          .eq('assessment_id', parseInt(assessmentId!))
          .single();

        if (assessmentError) {
          console.error('Error fetching assessment details:', assessmentError);
        } else if (fullAssessment && fullAssessment.created_by !== employeeData?.id) {
          // Get submitter details (current user)
          const submitter = {
            id: employeeData?.id || '',
            first_name: employeeData?.firstName || '',
            last_name: employeeData?.lastName || '',
            email: employeeData?.email || ''
          };

          const { assessmentNotificationService } = await import('@/services/notification/assessmentNotificationService');
          
          const notificationResult = await assessmentNotificationService.queueAssessmentSubmittedNotification(
            {
              id: fullAssessment.id,
              title: fullAssessment.name,
              created_by: fullAssessment.created_by,
              assigned_to: fullAssessment.assigned_to,
              client_id: fullAssessment.client_id
            },
            submitter,
            employeeData
          );
          
          console.log('Assessment submission notification queued:', notificationResult);
        }
      } catch (notificationError) {
        console.error('Error queueing assessment submission notification:', notificationError);
        // Don't fail the submission if notification fails
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
