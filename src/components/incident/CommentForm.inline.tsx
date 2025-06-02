
import React, { useState } from 'react';
import { FileItem } from '@/types/incident';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import MultipleFilesUpload from '@/components/MultipleFilesUpload';
import { useAddIncidentComment } from '@/hooks/useAddIncidentComment';
import { Paperclip, Send, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface InlineCommentFormProps {
  incidentId: string;
  commentText: string;
  setCommentText: (text: string) => void;
  commentFiles: FileItem[];
  setCommentFiles: (files: FileItem[]) => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  onCommentAdded: () => void;
}

const InlineCommentForm: React.FC<InlineCommentFormProps> = ({
  incidentId,
  commentText,
  setCommentText,
  commentFiles,
  setCommentFiles,
  isSubmitting,
  setIsSubmitting,
  onCommentAdded
}) => {
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { addComment } = useAddIncidentComment();

  const handleSubmit = async () => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setIsSubmitting(true);
    setIsSuccess(false);
    
    try {
      console.log('Submitting comment for incident:', incidentId);
      console.log('Comment text:', commentText);
      console.log('Files:', commentFiles);

      // Prepare documents array with file names
      const documents = commentFiles.map(file => file.name);

      // Call the edge function
      const result = await addComment(incidentId, {
        comment: commentText,
        documents: documents
      });

      if (result.success) {
        // Show success state briefly
        setIsSuccess(true);
        
        // Reset form after successful submission
        setCommentText('');
        setCommentFiles([]);
        setShowFileUpload(false);
        
        // Show success message
        toast.success('Comment added successfully');
        
        // Small delay to show success state, then refresh
        setTimeout(() => {
          setIsSuccess(false);
          onCommentAdded();
        }, 1500);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Failed to add comment');
      setIsSuccess(false);
    } finally {
      // Keep submitting state for a bit to show the success animation
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1500);
    }
  };

  return (
    <div className="bg-white rounded-md border shadow-sm p-4">
      <h3 className="font-medium text-lg mb-3">Add Comment</h3>
      
      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <Textarea
            placeholder="Type your comment here..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="min-h-[80px] w-full resize-none"
            disabled={isSubmitting}
          />
          
          {showFileUpload && (
            <div className="border-t pt-3 mt-2">
              <MultipleFilesUpload
                onFilesChange={setCommentFiles}
                initialFiles={commentFiles}
                maxFiles={3}
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setShowFileUpload(!showFileUpload)}
            className="flex items-center gap-1"
            disabled={isSubmitting}
          >
            <Paperclip className="h-4 w-4" />
            {commentFiles.length > 0 ? `${commentFiles.length} file(s)` : "Add files"}
          </Button>
          
          <Button 
            onClick={handleSubmit}
            disabled={!commentText.trim() || isSubmitting}
            className="flex items-center gap-1 min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Added!
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Comment
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InlineCommentForm;
