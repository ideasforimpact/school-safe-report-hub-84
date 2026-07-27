import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calendar, User, Star, Check, X, MessageCircle, Paperclip, Eye, Download, CheckCircle, RotateCcw, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';
import { useAssessmentAccess } from '@/hooks/assessments/useAssessmentAccess';
import AssessmentAuditTimeline from '../audit/AssessmentAuditTimeline';
import { formatDate } from '@/lib/Dateformat';
import MultipleFilesUpload from '@/components/MultipleFilesUpload';
import { FileItem } from '@/types/fileTypes';

const REWORK_ATTACHMENT_ID = 'rework';

interface AssessmentViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: number;
  onAssessmentUpdated?: () => void;
}

interface QuestionFile {
  id: string;
  name: string;
  size?: number;
  type?: string;
  url?: string;
  path?: string;
  base64?: string;
}

interface Question {
  id: string;
  text: string;
  required?: boolean;
  allowComments?: boolean;
  allowAttachments?: boolean;
  files?: QuestionFile[];
}

interface AnswerAttachment {
  id?: string;
  name?: string;
  type?: string;
  url?: string;
  path?: string;
  base64?: string;
}

interface Answer {
  questionId: string;
  answer?: string;
  comment?: string;
  attachments?: AnswerAttachment[];
}

interface AssessmentData {
  id: string;
  assessment_id: number;
  name: string;
  status: string;
  target_completion_date: string | null;
  created_at: string;
  score: number | null;
  answers: Answer[];
  creator_name?: string;
  assignee_name?: string;
  completed_by_name?: string;
  completed_on?: string | null;
  closure_comments?: string | null;
  closure_attachment?: AnswerAttachment[] | null;
  is_reworked?: boolean;
  rework_comments?: string | null;
  rework_attachments?: AnswerAttachment[] | null;
  submit_comment?: string | null;
  submit_attachment?: AnswerAttachment[] | null;
  created_by?: string;
  assigned_to?: string;
  assignees?: { employee_id: string; name: string; status: string; answers: Answer[] }[];
  template?: {
    title: string;
    description: string;
    questions: Question[];
  };
}

const AssessmentViewDialog = ({ open, onOpenChange, assessmentId, onAssessmentUpdated }: AssessmentViewDialogProps) => {
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [reworking, setReworking] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showReworkDialog, setShowReworkDialog] = useState(false);
  const [completionComments, setCompletionComments] = useState('');
  const [closureAttachments, setClosureAttachments] = useState<FileItem[]>([]);
  const [reworkComments, setReworkComments] = useState('');
  const [reworkAttachments, setReworkAttachments] = useState<FileItem[]>([]);
  const { user, employeeData } = useAuth();
  const clientId = employeeData?.clientId || user?.clientId;
  const lastFetchRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });

  const fetchAssessmentDetails = useCallback(async () => {
    const now = Date.now();
    const key = `${assessmentId}:${clientId}`;
    if (lastFetchRef.current.key === key && now - lastFetchRef.current.time < 2000) return;
    lastFetchRef.current = { key, time: now };
    try {
      setLoading(true);

      const { data: responseData, error } = await supabase
      .functions.invoke('list-assessments', {
        body: { assessment_id: assessmentId, client_id: clientId },
        headers: { path: 'get' },
      });

      if (error) throw error;

      const data = responseData?.assessment;
      if (!data) throw new Error('Assessment not found');

      // Process answers - handle both array and object formats
      let processedAnswers: Answer[] = [];
        if (data.answers) {
          if (Array.isArray(data.answers)) {
            processedAnswers = (data.answers as unknown as Answer[]) || [];
          } else if (typeof data.answers === 'object') {
            // Convert object to array if needed
            processedAnswers = (Object.values(data.answers) as unknown as Answer[]) || [];
          }
        }

      // Debug: Log processed answers
      console.log('[AssessmentViewDialog] Processed answers:', processedAnswers.map(a => ({
        questionId: a.questionId,
        questionIdType: typeof a.questionId,
        answer: a.answer,
        hasComment: !!a.comment,
        hasAttachments: !!(a.attachments && a.attachments.length > 0),
        attachments: a.attachments ? a.attachments.map((att: AnswerAttachment) => ({
          name: att.name,
          hasUrl: !!att.url,
          hasPath: !!att.path,
          hasBase64: !!att.base64,
          urlType: att.url ? (att.url.startsWith('http') ? 'http' : att.url.startsWith('blob') ? 'blob' : 'other') : 'none'
        })) : []
      })));

      // Process template questions to ensure they have IDs
      // Match them with answer IDs by extracting the pattern from existing answers
      let processedQuestions: Question[] = [];
      if (data.template && Array.isArray(data.template.questions)) {
        processedQuestions = (data.template.questions as unknown as Question[]).map((question, index) => {
          // If question doesn't have an ID, try to match it with an answer's questionId by index
          if (!question.id) {
            // Find answer at the same index to extract the ID pattern
            const matchingAnswer = processedAnswers.find(answer => {
              if (!answer || !answer.questionId) return false;
              const answerIdStr = String(answer.questionId);
              const match = answerIdStr.match(/^question_(\d+)_/);
              if (match) {
                const answerIndex = parseInt(match[1], 10);
                return answerIndex === index;
              }
              return false;
            });
            
            // If we found a matching answer, use its questionId (exact match)
            if (matchingAnswer && matchingAnswer.questionId) {
              return {
                ...question,
                id: String(matchingAnswer.questionId)
              };
            }
            
            // Fallback: generate a new ID based on index (shouldn't happen if answers exist)
            return {
              ...question,
              id: `question_${index}_${Date.now()}`
            };
          }
          return question;
        });
      }

      const processedReworkAttachments = Array.isArray(data.rework_attachments)
        ? data.rework_attachments
        : [];

      const processedSubmittedAttachment = Array.isArray(data.submit_attachment)
        ? data.submit_attachment
        : [];

      const processedClosureAttachment = Array.isArray(data.closure_attachment)
        ? data.closure_attachment
        : [];

      // Each assignee's answers come back the same shape as the parent's
      // (array, or occasionally an object keyed by index) — normalize each
      // one the same way so per-assignee Q&A can be matched question-by-question.
      const normalizeAnswers = (raw: unknown): Answer[] => {
        if (Array.isArray(raw)) return raw as Answer[];
        if (raw && typeof raw === 'object') return Object.values(raw) as Answer[];
        return [];
      };
      const processedAssignees = (data.assignees || []).map(
        (a: { employee_id: string; name: string; status: string; answers: unknown }) => ({
          ...a,
          answers: normalizeAnswers(a.answers),
        })
      );

      const formattedAssessment: AssessmentData = {
        ...data,
        answers: processedAnswers,
        rework_attachments: processedReworkAttachments,
        submit_attachment: processedSubmittedAttachment,
        closure_attachment: processedClosureAttachment,
        creator_name: data.creator
          ? `${data.creator.first_name} ${data.creator.last_name}`
          : 'Unknown',
        // Each assignee completes independently, so show name + THEIR OWN
        // status per assignee rather than one shared status for everyone.
        assignee_name: processedAssignees.length > 0
          ? processedAssignees.map((a: { name: string; status: string }) => `${a.name} (${a.status})`).join(', ')
          : data.assignee
            ? `${data.assignee.first_name} ${data.assignee.last_name}`
            : 'Unassigned',
        assignees: processedAssignees,
        completed_by_name: data.completed_by_employee 
          ? `${data.completed_by_employee.first_name} ${data.completed_by_employee.last_name}`
          : null,
        template: data.template ? {
          title: data.template.title,
          description: data.template.description,
          questions: processedQuestions
        } : undefined
      };

      setAssessment(formattedAssessment);
    } catch (error) {
      console.error('Error fetching assessment details:', error);
      toast.error('Failed to load assessment details');
    } finally {
      setLoading(false);
    }
  }, [assessmentId, clientId]);

  useEffect(() => {
    if (open && assessmentId && clientId) {
      fetchAssessmentDetails();
    }
  }, [open, assessmentId, clientId, fetchAssessmentDetails]);

  const handleCompleteAssessment = async () => {
    if (!assessment || !clientId || !employeeData?.id) {
      toast.error('Assessment or employee information is missing');
      return;
    }

    if (assessment.status === 'Completed') {
      toast.info('Assessment is already completed');
      return;
    }

    try {
      setCompleting(true);

      const { questionFileService } = await import('@/services/assessment/questionFileService');
      const uploadedClosureAttachments = await questionFileService.uploadIfPresent(
        closureAttachments,
        () => questionFileService.uploadClosureAttachments(
          closureAttachments,
          clientId,
          employeeData.id,
          assessment.assessment_id
        )
      );

      const completedOn = new Date().toISOString();
      const { error } = await supabase
      .functions.invoke('save-assessment-draft/complete-assessment', {
        body: {
          id: assessment.id,
          client_id: clientId,
          completed_by: employeeData.id,
          completed_on: completedOn,
          closure_comments: completionComments.trim() || null,
          closure_attachment: uploadedClosureAttachments.length > 0 ? uploadedClosureAttachments : null,
          performed_by: {
            id: employeeData.id,
            first_name: employeeData.firstName || '',
            last_name: employeeData.lastName || '',
            email: employeeData.email || '',
          },
          assessment_info: {
            name: assessment.name,
            assigned_to: assessment.assigned_to,
            created_by: assessment.created_by,
          },
        },
      });

      if (error) throw error;

      setAssessment(prev => prev ? {
        ...prev,
        status: 'Completed',
        completed_by_name: `${employeeData.firstName} ${employeeData.lastName}`,
        completed_on: completedOn,
        closure_comments: completionComments.trim() || null,
        closure_attachment: uploadedClosureAttachments
      } : null);

      toast.success('Assessment completed successfully');
      setShowConfirmDialog(false);
      setCompletionComments('');
      setClosureAttachments([]);

      onOpenChange(false);
      if (onAssessmentUpdated) onAssessmentUpdated();
    } catch (error) {
      console.error('Error completing assessment:', error);
      toast.error('Failed to complete assessment. Please try again.');
    } finally {
      setCompleting(false);
    }
  };

  const handleReworkAssessment = async () => {
    if (!assessment || !clientId || !employeeData?.id) {
      toast.error('Assessment or employee information is missing');
      return;
    }

    if (!reworkComments.trim()) {
      toast.error('Please provide rework comments before submitting');
      return;
    }

    try {
      setReworking(true);

      const { questionFileService } = await import('@/services/assessment/questionFileService');
      const uploadedReworkAttachments = await questionFileService.uploadIfPresent(
        reworkAttachments,
        () => questionFileService.uploadAnswerAttachments(
          reworkAttachments,
          clientId,
          employeeData.id,
          assessment.name || 'assessment',
          REWORK_ATTACHMENT_ID
        )
      );

      const { error } = await supabase
      .functions.invoke('save-assessment-draft/rework-assessment', {
        body: {
          id: assessment.id,
          client_id: clientId,
          rework_comments: reworkComments.trim() || null,
          rework_attachments: uploadedReworkAttachments.length > 0 ? uploadedReworkAttachments : null,
          performed_by: {
            id: employeeData.id,
            first_name: employeeData.firstName || '',
            last_name: employeeData.lastName || '',
            email: employeeData.email || '',
          },
          assessment_info: {
            name: assessment.name,
            assigned_to: assessment.assigned_to,
            created_by: assessment.created_by,
          },
        },
      });

      if (error) throw error;

      setAssessment(prev => prev ? {
        ...prev,
        status: 'Draft',
        is_reworked: true,
        rework_comments: reworkComments.trim() || null,
        rework_attachments: uploadedReworkAttachments
      } : null);

      toast.success(`Assessment has been reworked and status changed to Draft${reworkComments ? ' with comments' : ''}`);
      setShowReworkDialog(false);
      setReworkComments('');
      setReworkAttachments([]);

      onOpenChange(false);
      if (onAssessmentUpdated) onAssessmentUpdated();
    } catch (error) {
      console.error('Error reworking assessment:', error);
      toast.error('Failed to rework assessment. Please try again.');
    } finally {
      setReworking(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'New': 'bg-blue-100 text-blue-800',
      'Draft': 'bg-gray-100 text-gray-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Submitted': 'bg-purple-100 text-purple-800',
      'Completed': 'bg-green-100 text-green-800',
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };


  // Matches a question to its answer within a given answers array — shared
  // by the legacy single "assessment.answers" lookup and the per-assignee
  // lookup below, since both use the same questionId-or-index matching.
  const getAnswerFromList = (
    answersList: Answer[] | undefined,
    questionId: string | undefined,
    questionIndex?: number
  ): Answer | undefined => {
    if (!answersList) return undefined;

    if (questionId) {
      const normalizedQuestionId = String(questionId);
      const foundAnswer = answersList.find(answer => {
        if (!answer || !answer.questionId) return false;
        return String(answer.questionId) === normalizedQuestionId;
      });
      if (foundAnswer) return foundAnswer;
    }

    if (questionIndex !== undefined && questionIndex >= 0) {
      const foundAnswer = answersList.find(answer => {
        if (!answer || !answer.questionId) return false;
        const match = String(answer.questionId).match(/^question_(\d+)_/);
        return match ? parseInt(match[1], 10) === questionIndex : false;
      });
      if (foundAnswer) return foundAnswer;
    }

    return undefined;
  };

  const getAnswerForQuestion = (questionId: string | undefined, questionIndex?: number) =>
    getAnswerFromList(assessment?.answers, questionId, questionIndex);

  const calculateProgress = () => {
    if (!assessment?.template?.questions || !assessment.answers) return 0;
    const totalQuestions = assessment.template.questions.length;
    const answeredQuestions = assessment.answers.filter(answer => answer.answer !== undefined).length;
    return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  };

  const openDocumentViewer = async (attachment: AnswerAttachment) => {
    try {
      let urlToOpen: string | null = null;

      console.log('[AssessmentViewDialog] Opening document:', attachment);

      // Check for base64 data first
      if (attachment.base64) {
        // For base64, use data URL directly (works for both PDFs and other files)
        urlToOpen = attachment.base64;
        console.log('[AssessmentViewDialog] Using base64 data URL');
      } 
      // Check for URL
      else if (attachment.url) {
        // Use URL directly - browser will handle PDF viewing
        urlToOpen = attachment.url;
        console.log('[AssessmentViewDialog] Using URL directly:', urlToOpen);
      }
      // Check for path and construct Supabase signed URL
      else if (attachment.path) {
        // Extract bucket name and file path
        let bucketName = 'assessment-question-files'; // default bucket
        let filePath = attachment.path;
        
        // Check if path includes bucket name
        const bucketPatterns = [
          'assessment-question-files/',
          'form-attachments/',
          'employee_other_type_statement/'
        ];
        
        for (const pattern of bucketPatterns) {
          if (filePath.includes(pattern)) {
            bucketName = pattern.replace('/', '');
            filePath = filePath.split(pattern)[1] || filePath;
            break;
          }
        }
        
        // Use signed URL for better compatibility, especially for PDFs
        try {
          console.log('[AssessmentViewDialog] Creating signed URL for path:', filePath, 'bucket:', bucketName);
          const { data: signedData, error: signedError } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(filePath, 300); // 5 minutes expiry
          
          if (!signedError && signedData?.signedUrl) {
            urlToOpen = signedData.signedUrl;
            console.log('[AssessmentViewDialog] Using signed URL');
          } else {
            console.warn('[AssessmentViewDialog] Signed URL failed, falling back to public URL:', signedError);
            // Fallback to public URL
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath);
            urlToOpen = urlData.publicUrl;
            console.log('[AssessmentViewDialog] Using public URL as fallback');
          }
        } catch (error) {
          console.error('[AssessmentViewDialog] Error creating signed URL, using public URL:', error);
          // Final fallback to public URL
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
          urlToOpen = urlData.publicUrl;
        }
      }

      if (urlToOpen) {
        window.open(urlToOpen, '_blank', 'noopener,noreferrer');
      } else {
        console.error('[AssessmentViewDialog] No valid URL, base64, or path found:', attachment);
        toast.error('Document URL or data not available');
      }
    } catch (error) {
      console.error('[AssessmentViewDialog] Error opening document:', error);
      toast.error('Failed to open document. Please try again.');
    }
  };

  const downloadAttachment = async (attachment: AnswerAttachment) => {
    try {
      let blob: Blob | null = null;
      const fileName = attachment.name || 'attachment';

      console.log('[AssessmentViewDialog] Downloading document:', attachment);

      // Check for base64 data first
      if (attachment.base64) {
        console.log('[AssessmentViewDialog] Converting base64 to blob');
        // Convert base64 to blob
        const base64Data = attachment.base64.includes(',') 
          ? attachment.base64.split(',')[1] 
          : attachment.base64;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: attachment.type || 'application/octet-stream' });
      } 
      // Check for URL - fetch and convert to blob
      else if (attachment.url) {
        console.log('[AssessmentViewDialog] Fetching from URL:', attachment.url);
        try {
          const response = await fetch(attachment.url, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
            },
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
          }
          blob = await response.blob();
          console.log('[AssessmentViewDialog] Successfully fetched blob');
        } catch (fetchError) {
          console.error('[AssessmentViewDialog] Error fetching file:', fetchError);
          // Fallback: try direct download link
          const link = document.createElement('a');
          link.href = attachment.url;
          link.download = fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.info('Opening download link in new tab');
          return;
        }
      }
      // Check for path and download from Supabase storage
      else if (attachment.path) {
        console.log('[AssessmentViewDialog] Downloading from storage path:', attachment.path);
        try {
          // Extract bucket name and file path
          let bucketName = 'assessment-question-files'; // default bucket
          let filePath = attachment.path;
          
          // Check if path includes bucket name
          const bucketPatterns = [
            'assessment-question-files/',
            'form-attachments/',
            'employee_other_type_statement/'
          ];
          
          for (const pattern of bucketPatterns) {
            if (filePath.includes(pattern)) {
              bucketName = pattern.replace('/', '');
              filePath = filePath.split(pattern)[1] || filePath;
              break;
            }
          }
          
          const { data, error } = await supabase.storage
            .from(bucketName)
            .download(filePath);
          
          if (error) {
            console.error('[AssessmentViewDialog] Storage download error:', error);
            throw error;
          }
          
          blob = data;
          console.log('[AssessmentViewDialog] Successfully downloaded from storage, bucket:', bucketName);
        } catch (storageError) {
          console.error('[AssessmentViewDialog] Error downloading from storage:', storageError);
          // Try to get public URL as fallback
          let bucketName = 'assessment-question-files';
          let filePath = attachment.path;
          
          const bucketPatterns = [
            'assessment-question-files/',
            'form-attachments/',
            'employee_other_type_statement/'
          ];
          
          for (const pattern of bucketPatterns) {
            if (filePath.includes(pattern)) {
              bucketName = pattern.replace('/', '');
              filePath = filePath.split(pattern)[1] || filePath;
              break;
            }
          }
          
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
          
          const link = document.createElement('a');
          link.href = urlData.publicUrl;
          link.download = fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.info('Opening download link in new tab');
          return;
        }
      }

      if (blob) {
        // Create download link from blob
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`Downloaded ${fileName}`);
      } else {
        console.error('[AssessmentViewDialog] No valid data found for download:', attachment);
        toast.error('Document data not available for download');
      }
    } catch (error) {
      console.error('[AssessmentViewDialog] Error downloading document:', error);
      toast.error('Failed to download document. Please try again.');
    }
  };

  const isCurrentUserCreator = assessment?.created_by === employeeData?.id;
  const isCompleteButtonEnabled = assessment?.status === 'Submitted' && isCurrentUserCreator;
  const isReworkButtonEnabled = isCurrentUserCreator && assessment?.status !== 'Draft' && assessment?.status !== 'New';

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assessment Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : assessment ? (
          <div className="flex flex-col h-full">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Assessment Details</TabsTrigger>
                <TabsTrigger value="questions">
                  Questions & Answers
                  {assessment.template?.questions && (
                    <Badge variant="secondary" className="ml-2">
                      {assessment.template.questions.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="activity">
                  <Clock className="h-4 w-4 mr-1" />
                  Activity Timeline
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4">
                <div 
                  className="max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden" 
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <div className="space-y-6 pr-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <CardTitle className="text-xl">{assessment.name}</CardTitle>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                #{assessment.assessment_id}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Created: {formatDate(assessment.created_at)}
                              </span>
                              {assessment.target_completion_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  Due: {formatDate(assessment.target_completion_date)}
                                </span>
                              )}
                            </div>
                            {assessment.status === 'Completed' && assessment.completed_on && (
                              <div className="flex items-center gap-4 text-sm text-green-700 bg-green-50 p-2 rounded-lg border border-green-200 mt-3">
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="h-4 w-4" />
                                  Completed: {formatDate(assessment.completed_on)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  by {assessment.completed_by_name || 'Unknown'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(assessment.status)}
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="font-medium">{calculateProgress()}%</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm font-medium text-gray-500">Created By:</span>
                            <p className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {assessment.creator_name}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Assigned To:</span>
                            <p className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {assessment.assignee_name}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {assessment.status === 'Completed' && assessment.completed_on && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Completion Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm font-medium text-gray-500">Completed By:</span>
                              <p className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {assessment.completed_by_name || 'Unknown'}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-500">Completed On:</span>
                              <p className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(assessment.completed_on)}
                              </p>
                            </div>
                          </div>
                          {assessment.closure_comments && (
                            <div>
                              <span className="text-sm font-medium text-gray-500">Completion Comments:</span>
                              <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-sm text-gray-700">{assessment.closure_comments}</p>
                              </div>
                            </div>
                          )}
                          {assessment.closure_attachment && assessment.closure_attachment.length > 0 && (
                            <div>
                              <span className="text-sm font-medium text-gray-500">Completion Attachments:</span>
                              <div className="mt-2 space-y-1.5">
                                {assessment.closure_attachment.map((attachment: AnswerAttachment, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                                    <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate" title={attachment.name}>
                                        {attachment.name || `Attachment ${idx + 1}`}
                                      </p>
                                    </div>
                                    {(attachment.url || attachment.path) && (
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => openDocumentViewer(attachment)}
                                          className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                          title="View document"
                                        >
                                          <Eye className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => downloadAttachment(attachment)}
                                          className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                          title="Download document"
                                        >
                                          <Download className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {(assessment.submit_comment || (assessment.submit_attachment && assessment.submit_attachment.length > 0)) && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-blue-600" />
                            Submission Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-1 gap-4">
                            {assessment.submit_comment && (
                              <div>
                                <span className="text-sm font-medium text-gray-500">Comment:</span>
                                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <p className="text-sm text-gray-700">{assessment.submit_comment}</p>
                                </div>
                              </div>
                            )}
                            {assessment.submit_attachment && assessment.submit_attachment.length > 0 && (
                              <div>
                                <span className="text-sm font-medium text-gray-500">Attachment:</span>
                                <div className="mt-2 space-y-1.5">
                                  {assessment.submit_attachment.map((attachment: AnswerAttachment, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
                                      <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate" title={attachment.name}>
                                          {attachment.name || `Attachment ${idx + 1}`}
                                        </p>
                                      </div>
                                      {(attachment.url || attachment.path) && (
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openDocumentViewer(attachment)}
                                            className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            title="View document"
                                          >
                                            <Eye className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => downloadAttachment(attachment)}
                                            className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                            title="Download document"
                                          >
                                            <Download className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {assessment.status === 'Draft' && assessment.is_reworked && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <RotateCcw className="h-5 w-5 text-orange-600" />
                            Rework Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-1 gap-4">
                            {assessment.rework_comments && (
                              <div>
                                <span className="text-sm font-medium text-gray-500">Rework Comments:</span>
                                <div className="mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                  <p className="text-sm text-gray-700">{assessment.rework_comments}</p>
                                </div>
                              </div>
                            )}
                            {assessment.rework_attachments && assessment.rework_attachments.length > 0 && (
                              <div>
                                <span className="text-sm font-medium text-gray-500">Rework Attachments:</span>
                                <div className="mt-2 space-y-1.5">
                                  {assessment.rework_attachments.map((attachment: AnswerAttachment, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 bg-orange-50 rounded border border-orange-200">
                                      <FileText className="h-4 w-4 text-orange-600 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate" title={attachment.name}>
                                          {attachment.name || `Attachment ${idx + 1}`}
                                        </p>
                                      </div>
                                      {(attachment.url || attachment.path) && (
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openDocumentViewer(attachment)}
                                            className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            title="View document"
                                          >
                                            <Eye className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => downloadAttachment(attachment)}
                                            className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                            title="Download document"
                                          >
                                            <Download className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {assessment.template && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Template: {assessment.template.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600">{assessment.template.description}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="questions" className="mt-4">
                <div 
                  className="max-h-[65vh] overflow-y-auto [&::-webkit-scrollbar]:hidden" 
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <div className="space-y-3 pr-2 pb-4">
                    {assessment.template?.questions.map((question, index) => {
                      if (!question) {
                        console.warn(`[AssessmentViewDialog] Question at index ${index} is null or undefined`);
                        return null;
                      }
                      
                      // Each assignee answers independently — build one
                      // row per assignee for this question. Falls back to
                      // the single shared answers array for pre-multi-
                      // assignee assessments that have no assignee rows.
                      const hasAssignees = assessment.assignees && assessment.assignees.length > 0;
                      const perAssigneeAnswers = hasAssignees
                        ? assessment.assignees!.map(a => ({
                            assignee: a,
                            answer: getAnswerFromList(a.answers, question.id, index),
                          }))
                        : [{ assignee: null, answer: getAnswerForQuestion(question.id, index) }];
                      const answeredCount = perAssigneeAnswers.filter(x => x.answer?.answer !== undefined).length;
                      const totalResponders = perAssigneeAnswers.length;
                      const isFullyAnswered = totalResponders > 0 && answeredCount === totalResponders;
                      const questionKey = question.id || `question_${index}`;

                      return (
                        <Card key={questionKey} className="border-l-4 border-l-blue-500 shadow-sm">
                          <CardHeader className="pb-2 px-4 pt-3">
                            <div className="flex items-start gap-2">
                              <span className={`flex justify-center items-center w-7 h-7 rounded-full text-xs font-semibold flex-shrink-0 ${
                                isFullyAnswered
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                {isFullyAnswered ? <Check className="h-3 w-3" /> : index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm break-words whitespace-normal leading-relaxed">
                                  {question.text}
                                  {question.required && <span className="text-red-500 ml-1">*</span>}
                                </CardTitle>
                              </div>
                              {totalResponders > 1 && (
                                <Badge variant="outline" className="flex-shrink-0 text-[10px] font-normal text-gray-500">
                                  {answeredCount}/{totalResponders} answered
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 pt-0 px-4 pb-3">
                            {/* Responses — one per assignee, each with their own answer/comment/attachments */}
                            <div className="space-y-1.5">
                              {totalResponders > 1 && (
                                <span className="text-xs font-medium text-gray-500">Responses:</span>
                              )}
                              {perAssigneeAnswers.map(({ assignee, answer }, responderIdx) => {
                                const answered = answer?.answer !== undefined;
                                const initials = assignee?.name
                                  ? assignee.name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()
                                  : '';
                                return (
                                  <div
                                    key={assignee?.employee_id ?? responderIdx}
                                    className={`rounded-md border p-2 ${answered ? 'border-gray-200 bg-gray-50/70' : 'border-dashed border-gray-200'}`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      {assignee ? (
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-700">
                                            {initials}
                                          </span>
                                          <span className="text-xs font-medium text-gray-700 truncate">{assignee.name}</span>
                                        </div>
                                      ) : (
                                        <span className="text-xs font-medium text-gray-500">Answer:</span>
                                      )}
                                      {answered ? (
                                        answer!.answer === 'yes' ? (
                                          <Badge className="bg-green-100 text-green-800 text-xs py-0.5 flex-shrink-0">
                                            <Check className="h-3 w-3 mr-1" />
                                            Yes
                                          </Badge>
                                        ) : (
                                          <Badge className="bg-red-100 text-red-800 text-xs py-0.5 flex-shrink-0">
                                            <X className="h-3 w-3 mr-1" />
                                            No
                                          </Badge>
                                        )
                                      ) : (
                                        <span className="text-xs text-gray-400 italic flex-shrink-0">Not answered</span>
                                      )}
                                    </div>

                                    {answer?.comment && (
                                      <div className="mt-1.5 pl-6 flex items-start gap-1.5">
                                        <MessageCircle className="h-3 w-3 mt-0.5 text-blue-600 flex-shrink-0" />
                                        <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">{answer.comment}</p>
                                      </div>
                                    )}

                                    {answer?.attachments && answer.attachments.length > 0 && (
                                      <div className="mt-1.5 pl-6 space-y-1">
                                        {answer.attachments.map((attachment, idx) => (
                                          <div key={idx} className="flex items-center gap-1.5 text-xs">
                                            <Paperclip className="h-3 w-3 text-purple-600 flex-shrink-0" />
                                            <span className="truncate text-gray-700" title={attachment.name}>
                                              {attachment.name || `Attachment ${idx + 1}`}
                                            </span>
                                            {(attachment.url || attachment.path || attachment.base64) && (
                                              <div className="ml-auto flex items-center gap-0.5 flex-shrink-0">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-5 w-5 p-0 text-blue-600 hover:bg-blue-50"
                                                  onClick={() => openDocumentViewer(attachment)}
                                                  title="View document"
                                                >
                                                  <Eye className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-5 w-5 p-0 text-green-600 hover:bg-green-50"
                                                  onClick={() => downloadAttachment(attachment)}
                                                  title="Download document"
                                                >
                                                  <Download className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Reference Question Files (Template Files) */}
                            {question.files && question.files.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                                  <span className="text-xs font-medium text-gray-700">
                                    Reference Files ({question.files.length})
                                  </span>
                                </div>
                                <div className="space-y-1.5">
                                  {question.files.map((file: QuestionFile, fileIndex: number) => (
                                    <div key={file.id || fileIndex} className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200">
                                      <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate" title={file.name}>
                                          {file.name || `File ${fileIndex + 1}`}
                                        </p>
                                        {file.size && (
                                          <p className="text-xs text-gray-500">
                                            {file.size > 1024 * 1024 
                                              ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                                              : file.size > 1024
                                              ? `${(file.size / 1024).toFixed(2)} KB`
                                              : `${file.size} bytes`}
                                          </p>
                                        )}
                                      </div>
                                      {(file.url || file.path || file.base64) && (
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openDocumentViewer(file)}
                                            className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            title="View"
                                          >
                                            <Eye className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => downloadAttachment(file)}
                                            className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                            title="Download"
                                          >
                                            <Download className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                <div 
                  className="max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden" 
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <div className="pr-4">
                    <AssessmentAuditTimeline assessmentId={assessment.id} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {(isCompleteButtonEnabled || isReworkButtonEnabled) && (
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-end gap-2">
                  {/* Rework Assessment Button */}
                  {isReworkButtonEnabled && (
                    <AlertDialog open={showReworkDialog} onOpenChange={setShowReworkDialog}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={reworking}
                          className="flex items-center gap-2 text-orange-600 hover:text-orange-700 border-orange-200 hover:bg-orange-50"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Rework Assessment
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <RotateCcw className="h-5 w-5 text-orange-600" />
                            Rework Assessment
                          </AlertDialogTitle>
                          <AlertDialogDescription className="space-y-4">
                            <p>You are about to rework this assessment. The status will be changed to "Draft" and it can be answered again.</p>
                            
                            <div className="space-y-2">
                              <Label htmlFor="rework-comments">
                                Rework Comments <span className="text-red-500">*</span>
                              </Label>
                              <TextareaWithVoice
                                id="rework-comments"
                                placeholder="Enter comments about why this assessment needs to be reworked..."
                                value={reworkComments}
                                onChange={(e) => setReworkComments(e.target.value)}
                                rows={4}
                                className="resize-none"
                              />
                              {!reworkComments.trim() && (
                                <p className="text-xs text-red-500">Rework comments are required</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label>Attachment (Optional)</Label>
                              <MultipleFilesUpload
                                onFilesChange={setReworkAttachments}
                                initialFiles={reworkAttachments}
                                maxFiles={5}
                                className="border-gray-200 bg-white"
                              />
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                              <p className="text-sm text-amber-800">
                                <strong>Note:</strong> This will change the assessment status to "Draft" and allow it to be answered again.
                              </p>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => { setReworkComments(''); setReworkAttachments([]); }}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => {
                              if (!reworkComments.trim()) {
                                e.preventDefault();
                                toast.error('Please provide rework comments before submitting');
                                return;
                              }
                              handleReworkAssessment();
                            }}
                            disabled={reworking || !reworkComments.trim()}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            {reworking ? 'Reworking...' : 'Rework Assessment'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {/* Complete Assessment Button */}
                  {isCompleteButtonEnabled && (
                    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                      <AlertDialogTrigger asChild>
                        <Button
                          disabled={completing}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Complete Assessment
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                            Complete Assessment
                          </AlertDialogTitle>
                          <AlertDialogDescription className="space-y-4">
                            <p>You are about to complete this assessment. Please add any completion comments below:</p>
                            
                            <div className="space-y-2">
                              <Label htmlFor="completion-comments">Completion Comments</Label>
                              <TextareaWithVoice
                                id="completion-comments"
                                placeholder="Enter any comments about the assessment completion..."
                                value={completionComments}
                                onChange={(e) => setCompletionComments(e.target.value)}
                                rows={4}
                                className="resize-none"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Attachment (Optional)</Label>
                              <MultipleFilesUpload
                                onFilesChange={setClosureAttachments}
                                initialFiles={closureAttachments}
                                maxFiles={5}
                                className="border-gray-200 bg-white"
                              />
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => { setCompletionComments(''); setClosureAttachments([]); }}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleCompleteAssessment}
                            disabled={completing}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {completing ? 'Completing...' : 'Complete Assessment'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center p-8">
            <p className="text-gray-500">Assessment not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssessmentViewDialog;
