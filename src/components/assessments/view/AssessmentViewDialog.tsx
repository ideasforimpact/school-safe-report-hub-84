import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, Calendar, User, Star, Check, X, MessageCircle, Paperclip, Eye, Download, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth';

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
  created_by?: string;
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [completionComments, setCompletionComments] = useState('');
  const { user, employeeData } = useAuth();
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
          created_by,
          creator:employees!assessments_created_by_fkey(first_name, last_name),
          assignee:employees!assessments_assigned_to_fkey(first_name, last_name),
          completed_by_employee:employees!assessments_completed_by_fkey(first_name, last_name),
          template:assessment_templates(title, description, questions)
        `)
        .eq('assessment_id', assessmentId)
        .eq('client_id', clientId)
        .single();

      if (error) throw error;

      const formattedAssessment: AssessmentData = {
        ...data,
        answers: Array.isArray(data.answers) ? (data.answers as unknown as Answer[]) : [],
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
          questions: Array.isArray(data.template.questions) ? (data.template.questions as unknown as Question[]) : []
        } : undefined
      };

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

  const getAnswerForQuestion = (questionId: string) => {
    return assessment?.answers.find(answer => answer.questionId === questionId);
  };

  const calculateProgress = () => {
    if (!assessment?.template?.questions || !assessment.answers) return 0;
    const totalQuestions = assessment.template.questions.length;
    const answeredQuestions = assessment.answers.filter(answer => answer.answer !== undefined).length;
    return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  };

  const openDocumentViewer = (attachment: any) => {
    if (attachment.url) {
      window.open(attachment.url, '_blank');
    } else {
      toast.error('Document URL not available');
    }
  };

  const downloadAttachment = (attachment: any) => {
    if (attachment.url) {
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.name || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error('Document URL not available for download');
    }
  };

  const isCurrentUserCreator = assessment?.created_by === employeeData?.id;
  const isCompleteButtonEnabled = assessment?.status === 'Submitted' && isCurrentUserCreator;

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
            <ScrollArea className="flex-1 max-h-[65vh]">
              <div className="space-y-6 p-1">
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

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Questions & Answers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {assessment.template?.questions.map((question, index) => {
                      const answer = getAnswerForQuestion(question.id);
                      const isAnswered = answer?.answer !== undefined;
                      
                      return (
                        <div key={question.id} className="border-l-4 border-l-gray-200 pl-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <span className={`flex justify-center items-center w-6 h-6 rounded-full text-sm ${
                              isAnswered 
                                ? "bg-green-100 text-green-700" 
                                : "bg-gray-100 text-gray-600"
                            }`}>
                              {isAnswered ? <Check className="h-3 w-3" /> : index + 1}
                            </span>
                            <div className="flex-1">
                              <p className="font-medium">
                                {question.text}
                                {question.required && <span className="text-red-500 ml-1">*</span>}
                              </p>
                              
                              <div className="mt-2">
                                {isAnswered ? (
                                  <div className="flex items-center gap-2">
                                    {answer.answer ? (
                                      <div className="flex items-center gap-1 text-green-600">
                                        <Check className="h-4 w-4" />
                                        <span className="font-medium">Yes</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 text-red-600">
                                        <X className="h-4 w-4" />
                                        <span className="font-medium">No</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 italic">Not answered</span>
                                )}
                              </div>

                              {answer?.comment && (
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                  <div className="flex items-center gap-2 mb-1">
                                    <MessageCircle className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-800">Comment</span>
                                  </div>
                                  <p className="text-sm text-gray-700">{answer.comment}</p>
                                </div>
                              )}

                              {answer?.attachments && answer.attachments.length > 0 && (
                                <div className="mt-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Paperclip className="h-4 w-4 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">
                                      Attachments ({answer.attachments.length})
                                    </span>
                                  </div>
                                  <div className="space-y-2">
                                    {answer.attachments.map((attachment, idx) => (
                                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                                        <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium truncate" title={attachment.name}>
                                            {attachment.name || `Attachment ${idx + 1}`}
                                          </p>
                                          {attachment.type && (
                                            <p className="text-xs text-gray-500">
                                              {attachment.type}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openDocumentViewer(attachment)}
                                            className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            title="View document"
                                          >
                                            <Eye className="h-4 w-4 mr-1" />
                                            View
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => downloadAttachment(attachment)}
                                            className="h-8 px-3 text-green-600 hover:text-green-700 hover:bg-green-50"
                                            title="Download document"
                                          >
                                            <Download className="h-4 w-4 mr-1" />
                                            Download
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {index < assessment.template.questions.length - 1 && (
                            <Separator className="mt-4" />
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>

            {isCompleteButtonEnabled && (
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-end">
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
