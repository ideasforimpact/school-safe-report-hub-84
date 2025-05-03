
import React, { useState } from 'react';
import { FileItem } from '@/types/incident';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import MultipleFilesUpload from '@/components/MultipleFilesUpload';
import { Paperclip, Send } from 'lucide-react';

interface InlineCommentFormProps {
  onSubmit: () => void;
  commentText: string;
  setCommentText: (text: string) => void;
  commentFiles: FileItem[];
  setCommentFiles: (files: FileItem[]) => void;
  isSubmitting: boolean;
}

const InlineCommentForm: React.FC<InlineCommentFormProps> = ({
  onSubmit,
  commentText,
  setCommentText,
  commentFiles,
  setCommentFiles,
  isSubmitting
}) => {
  const [showFileUpload, setShowFileUpload] = useState(false);

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
          >
            <Paperclip className="h-4 w-4" />
            {commentFiles.length > 0 ? `${commentFiles.length} file(s)` : "Add files"}
          </Button>
          
          <Button 
            onClick={onSubmit}
            disabled={!commentText.trim() || isSubmitting}
            className="flex items-center gap-1"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Comment'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InlineCommentForm;
