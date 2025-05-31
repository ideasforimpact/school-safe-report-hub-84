
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, MessageSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FormSubmission {
  id: string;
  form_id: string;
  submitter_name: string | null;
  submitter_email: string | null;
  responses: Array<{
    type: string;
    label: string;
    value: any;
  }>;
  status: string;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

interface SubmissionDetailDialogProps {
  submission: FormSubmission;
  onClose: () => void;
  onUpdate?: () => void;
}

const SubmissionDetailDialog: React.FC<SubmissionDetailDialogProps> = ({ 
  submission, 
  onClose,
  onUpdate
}) => {
  const [acknowledgmentComment, setAcknowledgmentComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getStatusBadge = (status: string) => {
    const variants = {
      new: 'default',
      reviewed: 'secondary',
      resolved: 'outline'
    } as const;
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleAcknowledge = async () => {
    if (!acknowledgmentComment.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an acknowledgment comment"
      });
      return;
    }

    setSubmitting(true);
    
    try {
      //console.log('Updating submission:', {
        submissionId: submission.id,
        comment: acknowledgmentComment
      });

      const { data, error } = await supabase.functions.invoke('update-form-submission', {
        body: {
          submission_id: submission.id,
          comments: acknowledgmentComment,
          status: 'reviewed'
        }
      });

      if (error) {
        console.error('Error calling update-form-submission function:', error);
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update submission');
      }

      toast({
        title: "Success",
        description: "Submission acknowledged successfully"
      });

      if (onUpdate) {
        onUpdate();
      }

      onClose();
    } catch (error) {
      console.error('Error acknowledging submission:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to acknowledge submission"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderFieldValue = (response: any) => {
    if (Array.isArray(response.value)) {
      return response.value.join(', ');
    }
    return response.value?.toString() || 'N/A';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Submission Details</span>
            {getStatusBadge(submission.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Submitter Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Submitter Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-sm font-medium text-gray-600">Name</Label>
                <p className="mt-1">{submission.submitter_name || 'Anonymous'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Email</Label>
                <p className="mt-1">{submission.submitter_email || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Submitted At</Label>
                <p className="mt-1 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(submission.created_at)}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Status</Label>
                <div className="mt-1">
                  {getStatusBadge(submission.status)}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Form Responses */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Form Responses</h3>
            <div className="space-y-3">
              {submission.responses.map((response, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Field</Label>
                    <p className="mt-1 font-medium">{response.label}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Response</Label>
                    <p className="mt-1 break-words">{renderFieldValue(response)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Existing Comments */}
          {submission.comments && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Previous Comments
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="whitespace-pre-wrap">{submission.comments}</p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Acknowledgment Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Acknowledgment</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="acknowledgment-comment">Add Comment</Label>
                <Textarea
                  id="acknowledgment-comment"
                  placeholder="Enter your acknowledgment comment..."
                  value={acknowledgmentComment}
                  onChange={(e) => setAcknowledgmentComment(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            onClick={handleAcknowledge}
            disabled={submitting || !acknowledgmentComment.trim()}
          >
            {submitting ? 'Processing...' : 'Acknowledge Submission'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubmissionDetailDialog;
