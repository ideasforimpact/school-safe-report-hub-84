
import React, { useState } from 'react';
import { Comment as IncidentComment } from '@/types/incident';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, FileText, Paperclip, Download, Eye, Loader2 } from 'lucide-react';
import FilePreview from './FilePreview';
import { documentManager } from '@/utils/documentManager';
import { toast } from 'sonner';

interface CommentItemProps {
  comment: IncidentComment;
  formatDate: (date: Date) => string;
  formatDateTime: (date: Date) => string;
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
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Function to truncate long text
  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  // Check if comment has any attachments
  const hasAttachments = (comment.files && comment.files.length > 0) || comment.image;

  // Handle document download with loading state
  const handleDownload = async (file: any) => {
    setDownloadingFiles(prev => new Set(prev).add(file.id));
    
    try {
      const documentItem = {
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size,
        url: '',
        base64: file.base64
      };
      
      await documentManager.downloadDocument(documentItem);
      toast.success(`Downloaded ${file.name}`);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  return (
    <div className="p-4 border rounded-md mb-4 bg-gray-50 relative">
      {/* Action buttons for edit/delete if user has permission */}
      {canEdit && (
        <div className="absolute top-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                >
                  <path
                    d="M8.625 2.5C8.625 3.12132 8.12132 3.625 7.5 3.625C6.87868 3.625 6.375 3.12132 6.375 2.5C6.375 1.87868 6.87868 1.375 7.5 1.375C8.12132 1.375 8.625 1.87868 8.625 2.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM7.5 13.625C8.12132 13.625 8.625 13.1213 8.625 12.5C8.625 11.8787 8.12132 11.375 7.5 11.375C6.87868 11.375 6.375 11.8787 6.375 12.5C6.375 13.1213 6.87868 13.625 7.5 13.625Z"
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                  />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(comment)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(comment.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Comment metadata */}
      <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600 mb-2">
        <span className="font-medium">{comment.createdBy.name}</span>
        <span>•</span>
        <span>{formatDateTime(new Date(comment.createdAt))}</span>
        {comment.status && (
          <>
            <span>•</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${getCommentStatusColor(comment.status)}`}>
              {comment.status}
            </span>
          </>
        )}
      </div>

      {/* Comment description - truncated if long */}
      <div className="mt-2">
        {isExpanded || comment.description.length <= 150 ? (
          <p className="whitespace-pre-wrap">{comment.description}</p>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{truncateText(comment.description)}</p>
            <button
              className="text-blue-600 hover:text-blue-800 text-sm mt-1"
              onClick={toggleExpand}
            >
              Read more
            </button>
          </>
        )}
      </div>

      {/* Attachments Section */}
      {hasAttachments && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Paperclip className="h-4 w-4 text-gray-500" />
            <h4 className="text-sm font-medium text-gray-700">Attachments</h4>
          </div>
          
          {/* Multiple files support */}
          {comment.files && comment.files.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {comment.files.map((file) => (
                <div key={file.id} className="border rounded-lg p-3 bg-white hover:shadow-sm transition-shadow">
                  <FilePreview file={file} />
                  
                  {/* File info and actions */}
                  <div className="mt-2">
                    <p className="text-sm font-medium truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file.size ? documentManager.formatFileSize(file.size) : 'Unknown size'}
                    </p>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2 mt-2">
                      {documentManager.canPreview({
                        id: file.id,
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        base64: file.base64
                      }) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-xs"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file)}
                        disabled={downloadingFiles.has(file.id)}
                        className="flex items-center gap-1 text-xs"
                      >
                        {downloadingFiles.has(file.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                        {downloadingFiles.has(file.id) ? 'Downloading...' : 'Download'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legacy single image support */}
          {comment.image && !comment.files && (
            <div className="border rounded-lg p-3 bg-white">
              <img 
                src={comment.image} 
                alt="Comment attachment" 
                className="max-w-full h-auto rounded-md border max-h-48 object-contain" 
              />
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <FileText className="h-4 w-4 mr-1" />
                <span>Image attachment</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assignment information */}
      {comment.assignedTo && comment.assignedTo.name && (
        <div className="mt-3 pt-2 border-t border-gray-200 text-sm">
          <span className="text-gray-600">Assigned to: </span>
          <span className="font-medium">{comment.assignedTo.name}</span>
        </div>
      )}
    </div>
  );
};

export default CommentItem;
