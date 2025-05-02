
import React, { useState } from 'react';
import { Comment as IncidentComment, FileItem } from '@/types/incident';
import { Button } from '@/components/ui/button';
import { UserCircle, CalendarClock, MessageSquare, Edit, Trash2, Paperclip } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import CommentForm from './CommentForm';
import { useIncidents } from '@/contexts/IncidentContext';

interface CommentsListProps {
  comments: IncidentComment[];
  incident: { id: string };
  addComment: (incidentId: string, commentData: Omit<IncidentComment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateComment: (incidentId: string, commentId: string, updates: Partial<IncidentComment>) => void;
  deleteComment: (incidentId: string, commentId: string) => void;
  formatDate: (date: Date) => string;
  getCommentStatusColor: (status: IncidentComment['status']) => string;
  canEditComment: (comment: IncidentComment) => boolean;
  userId: string;
  userName: string;
}

const CommentsList: React.FC<CommentsListProps> = ({
  comments,
  incident,
  addComment,
  updateComment,
  deleteComment,
  formatDate,
  getCommentStatusColor,
  canEditComment,
  userId,
  userName
}) => {
  const [showAddComment, setShowAddComment] = useState(false);
  const [showEditComment, setShowEditComment] = useState(false);
  const [currentComment, setCurrentComment] = useState<IncidentComment | null>(null);
  const { users } = useIncidents();

  const handleDelete = (commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteComment(incident.id, commentId);
    }
  };

  const openEditComment = (comment: IncidentComment) => {
    setCurrentComment(comment);
    setShowEditComment(true);
  };

  // Helper function to render file preview based on type
  const renderFilePreview = (file: FileItem) => {
    if (file.type.startsWith('image/')) {
      return (
        <div className="border p-1 rounded bg-gray-50">
          <img 
            src={file.base64} 
            alt={file.name} 
            className="h-20 w-auto object-contain rounded" 
          />
          <p className="text-xs text-center truncate mt-1 max-w-[80px]">{file.name}</p>
        </div>
      );
    } else {
      // For non-image files, show an icon
      let Icon = Paperclip;
      return (
        <div className="border p-2 rounded bg-gray-50 flex flex-col items-center">
          <Icon className="h-10 w-10 text-gray-400" />
          <p className="text-xs text-center truncate mt-1 max-w-[80px]">{file.name}</p>
        </div>
      );
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Comments</CardTitle>
            <CardDescription>
              Discussion about this incident
            </CardDescription>
          </div>
          <Dialog open={showAddComment} onOpenChange={setShowAddComment}>
            <DialogTrigger asChild>
              <Button size="sm">
                <MessageSquare className="h-4 w-4 mr-1" /> Add Comment
              </Button>
            </DialogTrigger>
            <CommentForm
              users={users}
              commentForm={{
                description: '',
                dueDate: new Date(),
                assignedTo: { id: '', name: '' },
                status: 'Pending',
                createdBy: { id: userId, name: userName },
                image: undefined,
                files: []
              }}
              onSubmit={(commentData) => {
                addComment(incident.id, commentData);
                setShowAddComment(false);
              }}
              isOpen={showAddComment}
              onOpenChange={setShowAddComment}
              title="Add Comment"
              submitLabel="Add Comment"
            />
          </Dialog>
        </CardHeader>
        <CardContent>
          {comments && comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-medium">{comment.description}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <UserCircle className="h-3.5 w-3.5" />
                          <span>{comment.assignedTo.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarClock className="h-3.5 w-3.5" />
                          <span>Due: {formatDate(new Date(comment.dueDate))}</span>
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
                        className="w-full max-h-40 object-contain rounded-md border" 
                      />
                    </div>
                  )}
                  
                  {/* Display new files if available */}
                  {comment.files && comment.files.length > 0 && (
                    <Collapsible className="mt-3">
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
                  
                  {canEditComment(comment) && (
                    <div className="mt-3 flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openEditComment(comment)}
                        className="h-7 px-2"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDelete(comment.id)}
                        className="h-7 px-2"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6">No comments added yet</p>
          )}
        </CardContent>
      </Card>

      {/* Edit Comment Dialog */}
      {currentComment && (
        <Dialog open={showEditComment} onOpenChange={setShowEditComment}>
          <CommentForm
            users={users}
            commentForm={{
              description: currentComment.description,
              dueDate: new Date(currentComment.dueDate),
              assignedTo: currentComment.assignedTo,
              status: currentComment.status,
              createdBy: currentComment.createdBy,
              image: currentComment.image,
              files: currentComment.files || []
            }}
            onSubmit={(commentData) => {
              updateComment(incident.id, currentComment.id, commentData);
              setShowEditComment(false);
              setCurrentComment(null);
            }}
            isOpen={showEditComment}
            onOpenChange={setShowEditComment}
            title="Edit Comment"
            submitLabel="Update Comment"
          />
        </Dialog>
      )}
    </>
  );
};

export default CommentsList;
