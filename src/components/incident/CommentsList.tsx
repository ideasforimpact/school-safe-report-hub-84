
import React, { useState } from 'react';
import { Comment } from '@/types/incident';
import { Button } from '@/components/ui/button';
import { UserCircle, CalendarClock, MessageSquare, Edit, Trash2 } from 'lucide-react';
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
import CommentForm from './CommentForm';

interface CommentsListProps {
  comments: Comment[];
  incident: { id: string };
  addComment: (incidentId: string, commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateComment: (incidentId: string, commentId: string, updates: Partial<Comment>) => void;
  deleteComment: (incidentId: string, commentId: string) => void;
  formatDate: (date: Date) => string;
  getCommentStatusColor: (status: Comment['status']) => string;
  canEditComment: (comment: Comment) => boolean;
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
  const [currentComment, setCurrentComment] = useState<Comment | null>(null);

  const handleDelete = (commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteComment(incident.id, commentId);
    }
  };

  const openEditComment = (comment: Comment) => {
    setCurrentComment(comment);
    setShowEditComment(true);
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
              users={[]}
              commentForm={{
                description: '',
                dueDate: new Date(),
                assignedTo: { id: '', name: '' },
                status: 'Pending',
                createdBy: { id: userId, name: userName },
                image: undefined
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
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getCommentStatusColor(comment.status)}`}>
                      {comment.status}
                    </span>
                  </div>

                  {/* Display comment image if available */}
                  {comment.image && (
                    <div className="mt-3">
                      <img 
                        src={comment.image} 
                        alt="Comment documentation" 
                        className="w-full max-h-40 object-contain rounded-md border" 
                      />
                    </div>
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
            users={[]}
            commentForm={{
              description: currentComment.description,
              dueDate: new Date(currentComment.dueDate),
              assignedTo: currentComment.assignedTo,
              status: currentComment.status,
              createdBy: currentComment.createdBy,
              image: currentComment.image
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
