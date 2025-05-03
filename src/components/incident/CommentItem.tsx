
import React, { useState } from 'react';
import { Comment as IncidentComment, FileItem } from '@/types/incident';
import { Button } from '@/components/ui/button';
import { UserCircle, CalendarClock, MessageSquare, Edit, Trash2, Paperclip } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CommentItemProps {
  comment: IncidentComment;
  formatDate: (date: Date) => string;
  formatDateTime: (date: Date) => string; // Add formatDateTime prop
  getCommentStatusColor: (status: IncidentComment['status']) => string;
  canEdit: boolean;
  onEdit: (comment: IncidentComment) => void;
  onDelete: (commentId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  formatDate,
  formatDateTime,
  getCommentStatusColor,
  canEdit,
  onEdit,
  onDelete
}) => {
  const [showAttachments, setShowAttachments] = useState(false);

  // Helper function to render file preview based on type - with lazy loading
  const renderFilePreview = (file: FileItem) => {
    if (file.type.startsWith('image/')) {
      return (
        <div className="border p-1 rounded bg-gray-50">
          {showAttachments ? (
            <img 
              src={file.base64} 
              alt={file.name} 
              loading="lazy"
              className="h-20 w-auto object-contain rounded" 
            />
          ) : (
            <div className="h-20 w-20 bg-gray-200 flex items-center justify-center">
              <Paperclip className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <p className="text-xs text-center truncate mt-1 max-w-[80px]">{file.name}</p>
        </div>
      );
    } else {
      // For non-image files, show an icon
      return (
        <div className="border p-2 rounded bg-gray-50 flex flex-col items-center">
          <Paperclip className="h-10 w-10 text-gray-400" />
          <p className="text-xs text-center truncate mt-1 max-w-[80px]">{file.name}</p>
        </div>
      );
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h4 className="font-medium">{comment.description}</h4>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {/* Display who created the comment */}
            <div className="flex items-center gap-1">
              <UserCircle className="h-3.5 w-3.5" />
              <span>Added by: {comment.createdBy.name}</span>
            </div>
            
            {/* Display when the comment was created instead of due date */}
            <div className="flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" />
              <span>Added: {formatDateTime(new Date(comment.createdAt))}</span>
            </div>
            
            {/* Show file count if there are files */}
            {comment.files && comment.files.length > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="h-3.5 w-3.5" />
                <span>{comment.files.length} file(s)</span>
              </div>
            )}
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${getCommentStatusColor(comment.status)}`}>
          {comment.status}
        </span>
      </div>

      {/* Display legacy comment image if available */}
      {comment.image && !comment.files?.length && (
        <div className="mt-3">
          <img 
            src={comment.image} 
            alt="Comment documentation" 
            loading="lazy"
            className="w-full max-h-40 object-contain rounded-md border" 
          />
        </div>
      )}
      
      {/* Display new files if available */}
      {comment.files && comment.files.length > 0 && (
        <Collapsible 
          className="mt-3" 
          open={showAttachments} 
          onOpenChange={setShowAttachments}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-1 h-7">
              <Paperclip className="h-3.5 w-3.5" />
              <span>View {comment.files.length} attachments</span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="grid grid-cols-4 gap-2">
              {comment.files.map((file) => (
                <div key={file.id}>
                  {renderFilePreview(file)}
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
      
      {canEdit && (
        <div className="mt-3 flex justify-end gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onEdit(comment)}
            className="h-7 px-2"
          >
            <Edit className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={() => onDelete(comment.id)}
            className="h-7 px-2"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
          </Button>
        </div>
      )}
    </div>
  );
};

export default CommentItem;
