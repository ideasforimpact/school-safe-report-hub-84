
import React, { useState } from 'react';
import { Comment as IncidentComment } from '@/types/incident';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import { useIncidents } from '@/contexts/incident';

interface CommentsListProps {
  comments: IncidentComment[];
  incident: { id: string };
  addComment: (incidentId: string, commentData: Omit<IncidentComment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateComment: (incidentId: string, commentId: string, updates: Partial<IncidentComment>) => void;
  deleteComment: (incidentId: string, commentId: string) => void;
  formatDate: (date: Date) => string;
  formatDateTime: (date: Date) => string;
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
  formatDateTime,
  getCommentStatusColor,
  canEditComment,
  userId,
  userName
}) => {
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

  const handleCommentAdded = () => {
    // Refresh comments or trigger parent callback
    addComment(incident.id, {} as any); // This should be properly implemented
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Comments</CardTitle>
            <CardDescription>
              Discussion about this incident
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {comments && comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem 
                  key={comment.id}
                  comment={comment}
                  formatDate={formatDate}
                  formatDateTime={formatDateTime}
                  getCommentStatusColor={getCommentStatusColor}
                  canEdit={canEditComment(comment)}
                  onEdit={openEditComment}
                  onDelete={handleDelete}
                />
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
            incidentId={incident.id}
            onCommentAdded={handleCommentAdded}
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
