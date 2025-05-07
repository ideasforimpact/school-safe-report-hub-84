
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useGrievance } from '@/contexts/grievances/GrievanceContext';
import { toast } from '@/hooks/use-toast';
import { SubmissionStatus } from '@/contexts/grievances/types';

interface GrievanceDetailDialogProps {
  submissionId: string;
  onClose: () => void;
}

const GrievanceDetailDialog: React.FC<GrievanceDetailDialogProps> = ({ submissionId, onClose }) => {
  const { submissions, updateSubmissionStatus } = useGrievance();
  
  const submission = submissions.find(s => s.id === submissionId);
  const [status, setStatus] = useState<SubmissionStatus>(submission?.status || 'new');
  const [internalNote, setInternalNote] = useState('');
  
  if (!submission) return null;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'outline';
      default:
        return 'default';
    }
  };

  const handleUpdateStatus = () => {
    updateSubmissionStatus(submissionId, status);
    toast({
      title: "Status Updated",
      description: `Grievance status updated to ${status.replace('_', ' ')}`
    });
  };

  const handleAddNote = () => {
    if (internalNote.trim()) {
      // This would typically save the note to the database
      toast({
        title: "Note Added",
        description: "Your note has been saved"
      });
      setInternalNote('');
    }
  };

  // Fixed the status handling to ensure type compatibility
  const handleStatusChange = (value: string) => {
    setStatus(value as SubmissionStatus);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Grievance Details</span>
            <Badge variant={getStatusBadgeVariant(submission.status) as any}>
              {submission.status.replace('_', ' ')}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Submitter Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-500 text-sm">Name:</span>
                  <p>{submission.submitterName}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Email:</span>
                  <p>{submission.submitterEmail}</p>
                </div>
                {submission.responses.find(r => r.question === 'Role') && (
                  <div>
                    <span className="text-gray-500 text-sm">Role:</span>
                    <p>{submission.responses.find(r => r.question === 'Role')?.answer}</p>
                  </div>
                )}
                {submission.responses.find(r => r.question === 'Phone')?.answer && (
                  <div>
                    <span className="text-gray-500 text-sm">Phone:</span>
                    <p>{submission.responses.find(r => r.question === 'Phone')?.answer}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Submission Details</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-500 text-sm">Date Submitted:</span>
                  <p>{new Date(submission.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Grievance Type:</span>
                  <p>{submission.responses.find(r => r.question === 'Grievance Type')?.answer || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Incident Date:</span>
                  <p>{submission.responses.find(r => r.question === 'Date of Incident')?.answer || 'N/A'}</p>
                </div>
                {submission.responses.find(r => r.question === 'Location')?.answer && (
                  <div>
                    <span className="text-gray-500 text-sm">Location:</span>
                    <p>{submission.responses.find(r => r.question === 'Location')?.answer}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Grievance Description</h3>
            <p className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md border">
              {submission.responses.find(r => r.question === 'Description of Grievance')?.answer || 'No description provided.'}
            </p>
          </div>
          
          {submission.responses.find(r => r.question === 'Previously Reported')?.answer && (
            <div>
              <h3 className="font-medium mb-2">Previously Reported</h3>
              <p>{submission.responses.find(r => r.question === 'Previously Reported')?.answer}</p>
            </div>
          )}
          
          {submission.responses.find(r => r.question === 'Desired Outcome')?.answer && (
            <div>
              <h3 className="font-medium mb-2">Desired Outcome</h3>
              <p className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md border">
                {submission.responses.find(r => r.question === 'Desired Outcome')?.answer}
              </p>
            </div>
          )}
          
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Contact Preferences</h3>
            <div className="space-y-2">
              <div>
                <span className="text-gray-500 text-sm">Preferred Contact Method:</span>
                <p>{submission.responses.find(r => r.question === 'Preferred Contact')?.answer || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Confidentiality Requested:</span>
                <p>{submission.responses.find(r => r.question === 'Keep Confidential')?.answer || 'No'}</p>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Update Status</h3>
            <div className="flex items-center gap-4">
              <div className="w-64">
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleUpdateStatus}>Update Status</Button>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Add Internal Note</h3>
            <div className="space-y-2">
              <Textarea
                placeholder="Add notes for internal use only"
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddNote} disabled={!internalNote.trim()}>
                Add Note
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GrievanceDetailDialog;
