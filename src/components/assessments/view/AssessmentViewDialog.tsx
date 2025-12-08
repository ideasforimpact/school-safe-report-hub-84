import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calendar, User, Star, Check, X, MessageCircle, Paperclip, Eye, Download, ExternalLink, CheckCircle, AlertTriangle, RotateCcw, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';
import { useAssessmentAccess } from '@/hooks/assessments/useAssessmentAccess';
import AssessmentAuditTimeline from '../audit/AssessmentAuditTimeline';
import { assessmentNotificationService } from '@/services/notification/assessmentNotificationService';

interface AssessmentViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: number;
  onAssessmentUpdated?: () => void;
}

interface Question {
  id: string;
  text: string;
  required?: boolean;
  allowComments?: boolean;
  allowAttachments?: boolean;
  files?: Array<{
    id: string;
    name: string;
    size?: number;
    type?: string;
    url?: string;
    path?: string;
  }>;
}

interface Answer {
  questionId: string;
  answer?: boolean;
  comment?: string;
  attachments?: any[];
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
  rework_comments?: string | null;
  created_by?: string;
  assigned_to?: string;
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
  const [reworkComments, setReworkComments] = useState('');
  const { user, employeeData } = useAuth();
  const { hasAssessmentAdmin, isSuperAdmin } = useAssessmentAccess();
  const clientId = employeeData?.clientId || user?.clientId;

  useEffect(() => {
    if (open && assessmentId && clientId) {
      fetchAssessmentDetails();
    }
  }, [open, assessmentId, clientId]);

  const fetchAssessmentDetails = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('assessments')
        .select(`
          id,
          assessment_id,
          name,
          status,
          target_completion_date,
          created_at,
          score,
          answers,
          completed_on,
          closure_comments,
          rework_comments,
          created_by,
          assigned_to,
          creator:employees!assessments_created_by_fkey(first_name, last_name),
          assignee:employees!assessments_assigned_to_fkey(first_name, last_name),
          completed_by_employee:employees!assessments_completed_by_fkey(first_name, last_name),
          template:assessment_templates(title, description, questions)
        `)
        .eq('assessment_id', assessmentId)
        .eq('client_id', clientId)
        .single();

      if (error) throw error;

      // Debug: Log raw answers data
      console.log('[AssessmentViewDialog] Raw answers from database:', data.answers);
      console.log('[AssessmentViewDialog] Raw questions from template:', data.template?.questions);

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
        attachments: a.attachments ? a.attachments.map((att: any) => ({
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

      const formattedAssessment: AssessmentData = {
        ...data,
        answers: processedAnswers,
        creator_name: data.creator 
          ? `${data.creator.first_name} ${data.creator.last_name}`
          : 'Unknown',
        assignee_name: data.assignee 
          ? `${data.assignee.first_name} ${data.assignee.last_name}`
          : 'Unassigned',
        completed_by_name: data.completed_by_employee 
          ? `${data.completed_by_employee.first_name} ${data.completed_by_employee.last_name}`
          : null,
        template: data.template ? {
          title: data.template.title,
          description: data.template.description,
          questions: processedQuestions
        } : undefined
      };

      // Debug: Log question IDs from template
      if (formattedAssessment.template?.questions) {
        console.log('[AssessmentViewDialog] Template question IDs (after processing):', formattedAssessment.template.questions.map(q => ({
          id: q.id,
          idType: typeof q.id,
          text: q.text?.substring(0, 50)
        })));
      }

      setAssessment(formattedAssessment);
    } catch (error) {
      console.error('Error fetching assessment details:', error);
      toast.error('Failed to load assessment details');
    } finally {
      setLoading(false);
    }
  };

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
      
      const { error } = await supabase
        .from('assessments')
        .update({ 
          status: 'Completed',
          completed_by: employeeData.id,
          completed_on: new Date().toISOString(),
          closure_comments: completionComments.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', assessment.id)
        .eq('client_id', clientId);

      if (error) throw error;

      // Send notification to assigned person (not self if self-completed)
      console.log(assessment.assigned_to && assessment.assigned_to !== employeeData?.id,"checking assesigned",assessment);
      
      if (assessment.assigned_to && assessment.assigned_to !== employeeData?.id) {
        try {
          // Get completer details (current user)
          const completer = {
            id: employeeData?.id || '',
            first_name: employeeData?.firstName || '',
            last_name: employeeData?.lastName || '',
            email: employeeData?.email || ''
          };

          const notificationResult = await assessmentNotificationService.queueAssessmentCompletedNotification(
            {
              id: assessment.id,
              title: assessment.name,
              assigned_to: assessment.assigned_to,
              created_by: assessment.created_by,
              client_id: clientId
            },
            completer,
            employeeData
          );
          
          console.log('Assessment completion notification queued:', notificationResult);
        } catch (notificationError) {
          console.error('Error queueing assessment completion notification:', notificationError);
          // Don't fail the completion if notification fails
        }
      }

      setAssessment(prev => prev ? { 
        ...prev, 
        status: 'Completed',
        completed_by_name: `${employeeData.firstName} ${employeeData.lastName}`,
        completed_on: new Date().toISOString(),
        closure_comments: completionComments.trim() || null
      } : null);
      
      toast.success('Assessment completed successfully');
      setShowConfirmDialog(false);
      setCompletionComments('');
      
      onOpenChange(false);
      
      if (onAssessmentUpdated) {
        onAssessmentUpdated();
      }
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

    try {
      setReworking(true);
      
      const { error } = await supabase
        .from('assessments')
        .update({ 
          status: 'Draft',
          rework_comments: reworkComments.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', assessment.id)
        .eq('client_id', clientId);

      if (error) throw error;

      console.log(assessment.assigned_to && assessment.assigned_to !== employeeData?.id,"checking assesigned",assessment);

      // Send notification to assigned person (not self if self-requested)
      if (assessment.assigned_to && assessment.assigned_to !== employeeData?.id) {
        try {
          // Get requester details (current user)
          const requester = {
            id: employeeData?.id || '',
            first_name: employeeData?.firstName || '',
            last_name: employeeData?.lastName || '',
            email: employeeData?.email || ''
          };

          const notificationResult = await assessmentNotificationService.queueAssessmentReworkRequiredNotification(
            {
              id: assessment.id,
              title: assessment.name,
              assigned_to: assessment.assigned_to,
              created_by: assessment.created_by,
              client_id: clientId
            },
            requester,
            reworkComments.trim() || 'Please rework this assessment',
            employeeData
          );
          
          console.log('Assessment rework notification queued:', notificationResult);
        } catch (notificationError) {
          console.error('Error queueing assessment rework notification:', notificationError);
          // Don't fail the rework request if notification fails
        }
      }

      setAssessment(prev => prev ? { 
        ...prev, 
        status: 'Draft',
        rework_comments: reworkComments.trim() || null
      } : null);
      
      toast.success(`Assessment has been reworked and status changed to Draft${reworkComments ? ' with comments' : ''}`);
      setShowReworkDialog(false);
      setReworkComments('');
      
      onOpenChange(false);
      
      if (onAssessmentUpdated) {
        onAssessmentUpdated();
      }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAnswerForQuestion = (questionId: string | undefined, questionIndex?: number) => {
    if (!assessment?.answers) return undefined;
    
    // If questionId exists, try to match by ID first
    if (questionId) {
      const normalizedQuestionId = String(questionId);
      
      const foundAnswer = assessment.answers.find(answer => {
        if (!answer || !answer.questionId) return false;
        return String(answer.questionId) === normalizedQuestionId;
      });
      
      if (foundAnswer) return foundAnswer;
    }
    
    // If no match by ID and we have an index, try to match by index
    // Answer IDs follow pattern: "question_0_...", "question_1_...", etc.
    if (questionIndex !== undefined && questionIndex >= 0) {
      const foundAnswer = assessment.answers.find(answer => {
        if (!answer || !answer.questionId) return false;
        const answerIdStr = String(answer.questionId);
        // Extract index from pattern like "question_0_..." or "question_1_..."
        const match = answerIdStr.match(/^question_(\d+)_/);
        if (match) {
          const answerIndex = parseInt(match[1], 10);
          return answerIndex === questionIndex;
        }
        return false;
      });
      
      if (foundAnswer) {
        console.log(`[AssessmentViewDialog] Matched answer by index ${questionIndex} for question without ID`);
        return foundAnswer;
      }
    }
    
    return undefined;
  };

  const calculateProgress = () => {
    if (!assessment?.template?.questions || !assessment.answers) return 0;
    const totalQuestions = assessment.template.questions.length;
    const answeredQuestions = assessment.answers.filter(answer => answer.answer !== undefined).length;
    return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  };

  const openDocumentViewer = async (attachment: any) => {
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

  const downloadAttachment = async (attachment: any) => {
    try {
      let blob: Blob | null = null;
      let fileName = attachment.name || 'attachment';

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
                                  Due: {new Date(assessment.target_completion_date).toLocaleDateString()}
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
                        </CardContent>
                      </Card>
                    )}

                    {assessment.status === 'Draft' && assessment.rework_comments && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <RotateCcw className="h-5 w-5 text-orange-600" />
                            Rework Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <span className="text-sm font-medium text-gray-500">Rework Comments:</span>
                              <div className="mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                <p className="text-sm text-gray-700">{assessment.rework_comments}</p>
                              </div>
                            </div>
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
                      
                      // Try to get answer by question ID first, then by index as fallback
                      const answer = getAnswerForQuestion(question.id, index);
                      const isAnswered = answer?.answer !== undefined;
                      const questionKey = question.id || `question_${index}`;
                      
                      return (
                        <Card key={questionKey} className="border-l-4 border-l-blue-500 shadow-sm">
                          <CardHeader className="pb-2 px-4 pt-3">
                            <div className="flex items-start gap-2">
                              <span className={`flex justify-center items-center w-7 h-7 rounded-full text-xs font-semibold flex-shrink-0 ${
                                isAnswered 
                                  ? "bg-green-100 text-green-700" 
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                {isAnswered ? <Check className="h-3 w-3" /> : index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm break-words whitespace-normal leading-relaxed">
                                  {question.text}
                                  {question.required && <span className="text-red-500 ml-1">*</span>}
                                </CardTitle>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 pt-0 px-4 pb-3">
                            {/* Answer */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500">Answer:</span>
                              {isAnswered ? (
                                answer.answer ? (
                                  <Badge className="bg-green-100 text-green-800 text-xs py-0.5">
                                    <Check className="h-3 w-3 mr-1" />
                                    Yes
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-800 text-xs py-0.5">
                                    <X className="h-3 w-3 mr-1" />
                                    No
                                  </Badge>
                                )
                              ) : (
                                <span className="text-xs text-gray-400 italic">Not answered</span>
                              )}
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
                                  {question.files.map((file: any, fileIndex: number) => (
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

                            {/* Comment */}
                            {answer?.comment && (
                              <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <MessageCircle className="h-3.5 w-3.5 text-blue-600" />
                                  <span className="text-xs font-medium text-gray-700">Comment</span>
                                </div>
                                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                                  <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">{answer.comment}</p>
                                </div>
                              </div>
                            )}

                            {/* User Attachments */}
                            {answer?.attachments && answer.attachments.length > 0 && (
                              <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <Paperclip className="h-3.5 w-3.5 text-purple-600" />
                                  <span className="text-xs font-medium text-gray-700">
                                    User Attachments ({answer.attachments.length})
                                  </span>
                                </div>
                                <div className="space-y-1.5">
                                  {answer.attachments.map((attachment, idx) => {
                                    console.log(`[AssessmentViewDialog] Rendering attachment ${idx}:`, {
                                      name: attachment.name,
                                      hasUrl: !!attachment.url,
                                      hasPath: !!attachment.path,
                                      hasBase64: !!attachment.base64,
                                      url: attachment.url?.substring(0, 100)
                                    });
                                    
                                    return (
                                      <div key={idx} className="flex items-center gap-2 p-2 bg-purple-50 rounded border border-purple-200">
                                        <FileText className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium truncate" title={attachment.name}>
                                            {attachment.name || `Attachment ${idx + 1}`}
                                          </p>
                                          {attachment.type && (
                                            <p className="text-xs text-gray-500 truncate">
                                              {attachment.type}
                                            </p>
                                          )}
                                        </div>
                                        {(attachment.url || attachment.path || attachment.base64) && (
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
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Show message if no comment or attachments */}
                            {!answer?.comment && (!answer?.attachments || answer.attachments.length === 0) && (
                              <div className="text-xs text-gray-400 italic">
                                No comments or attachments provided
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
                              <Label htmlFor="rework-comments">Rework Comments (Optional)</Label>
                              <Textarea
                                id="rework-comments"
                                placeholder="Enter any comments about why this assessment needs to be reworked..."
                                value={reworkComments}
                                onChange={(e) => setReworkComments(e.target.value)}
                                rows={4}
                                className="resize-none"
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
                          <AlertDialogCancel onClick={() => setReworkComments('')}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleReworkAssessment}
                            disabled={reworking}
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
                              <Textarea
                                id="completion-comments"
                                placeholder="Enter any comments about the assessment completion..."
                                value={completionComments}
                                onChange={(e) => setCompletionComments(e.target.value)}
                                rows={4}
                                className="resize-none"
                              />
                            </div>
                            
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                              <p className="text-sm text-amber-800">
                                <strong>Note:</strong> Once completed, this assessment cannot be modified.
                              </p>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setCompletionComments('')}>
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
