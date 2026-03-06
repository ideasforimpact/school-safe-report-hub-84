
import React from 'react';
import { Label } from '@/components/ui/label';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';
import { Button } from '@/components/ui/button';

interface CommentSectionProps {
  questionId: string;
  showComments: boolean;
  comment: string | null;
  readOnly: boolean;
  onShowComments: () => void;
  onCommentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const CommentSection = ({ 
  questionId, 
  showComments, 
  comment, 
  readOnly, 
  onShowComments, 
  onCommentChange 
}: CommentSectionProps) => {
  if (showComments) {
    return (
      <div className="space-y-2">
        <Label htmlFor={`comment-${questionId}`} className="text-sm text-gray-600">
          Comments:
        </Label>
        <TextareaWithVoice
          id={`comment-${questionId}`}
          value={comment || ''}
          onChange={onCommentChange}
          placeholder="Add your comments here..."
          className="h-20 resize-none focus:border-blue-400"
          disabled={readOnly}
        />
      </div>
    );
  }
  
  if (!readOnly) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onShowComments}
        className="text-blue-500 hover:text-blue-700 p-0 h-auto font-normal"
      >
        + Add comment
      </Button>
    );
  }
  
  return null;
};

export default CommentSection;
