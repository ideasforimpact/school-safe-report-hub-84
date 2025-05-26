
import React, { useState } from 'react';
import { Comment as IncidentComment, FileItem } from '@/types/incident';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import MultipleFilesUpload from '@/components/MultipleFilesUpload';
import { useAddIncidentComment } from '@/hooks/useAddIncidentComment';
import { toast } from 'sonner';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

interface CommentFormProps {
  users: { id: string; name: string }[];
  incidentId: string; // Add incident ID prop
  onCommentAdded?: () => void; // Callback for when comment is successfully added
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  submitLabel: string;
}

const CommentForm: React.FC<CommentFormProps> = ({
  users,
  incidentId,
  onCommentAdded,
  isOpen,
  onOpenChange,
  title,
  submitLabel
}) => {
  const [commentText, setCommentText] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const { addComment, isLoading } = useAddIncidentComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    if (!incidentId) {
      toast.error('Incident ID is required');
      return;
    }

    console.log('Submitting comment for incident:', incidentId);
    console.log('Comment text:', commentText);
    console.log('Files:', files);

    // Prepare documents array with file names
    const documents = files.map(file => file.name);

    // Call the edge function
    const result = await addComment(incidentId, {
      comment: commentText,
      documents: documents
    });

    if (result.success) {
      // Reset form
      setCommentText('');
      setFiles([]);
      
      // Close dialog
      onOpenChange(false);
      
      // Notify parent component
      if (onCommentAdded) {
        onCommentAdded();
      }
    }
  };

  const handleFilesChange = (newFiles: FileItem[]) => {
    setFiles(newFiles);
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          Add a new comment to this incident
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          {/* Comment details section */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Comment
            </label>
            <Textarea
              id="description"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Your comment"
              required
              className="min-h-[120px]"
            />
          </div>

          {/* Attachments section */}
          <div>
            <h3 className="text-sm font-medium mb-2">Attachments</h3>
            <p className="text-xs text-gray-500 mb-2">
              Upload images, documents, PDFs, or videos related to this comment.
            </p>
            <MultipleFilesUpload 
              onFilesChange={handleFilesChange}
              initialFiles={files}
              maxFiles={5}
            />
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isLoading || !commentText.trim()}>
            {isLoading ? 'Adding...' : submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default CommentForm;
