
import React, { useState } from 'react';
import { Comment as IncidentComment, FileItem } from '@/types/incident';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import MultipleFilesUpload from '@/components/MultipleFilesUpload';
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
  commentForm: Omit<IncidentComment, 'id' | 'createdAt' | 'updatedAt'>;
  onSubmit: (data: Omit<IncidentComment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  submitLabel: string;
}

const CommentForm: React.FC<CommentFormProps> = ({
  users,
  commentForm: initialCommentForm,
  onSubmit,
  isOpen,
  onOpenChange,
  title,
  submitLabel
}) => {
  const [commentForm, setCommentForm] = useState<Omit<IncidentComment, 'id' | 'createdAt' | 'updatedAt'>>(
    {
      ...initialCommentForm,
      files: initialCommentForm.files || []
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(commentForm);
  };

  const handleFilesChange = (files: FileItem[]) => {
    setCommentForm(prev => ({ ...prev, files }));
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {title === "Add Comment" ? "Add a new comment to this incident" : "Edit this comment"}
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
              value={commentForm.description}
              onChange={(e) => setCommentForm(prev => ({ ...prev, description: e.target.value }))}
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
              initialFiles={commentForm.files || []}
              maxFiles={5}
            />
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit">{submitLabel}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default CommentForm;
