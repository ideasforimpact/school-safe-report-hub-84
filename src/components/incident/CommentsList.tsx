
import React, { useState, useEffect } from 'react';
import { Comment as IncidentComment } from '@/types/incident';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Loader, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localComments, setLocalComments] = useState<IncidentComment[]>(comments);
  const { users } = useIncidents();

  // Update local comments when props change
  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  const handleDelete = async (commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      try {
        setIsRefreshing(true);
        await deleteComment(incident.id, commentId);
        
        // Optimistically update local state
        setLocalComments(prev => prev.filter(comment => comment.id !== commentId));
      } catch (error) {
        console.error('Error deleting comment:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const openEditComment = (comment: IncidentComment) => {
    setCurrentComment(comment);
    setShowEditComment(true);
  };

  const handleCommentAdded = async () => {
    try {
      setIsRefreshing(true);
      // Trigger parent component to refresh comments
      await addComment(incident.id, {} as any);
    } catch (error) {
      console.error('Error refreshing comments:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    handleCommentAdded();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Comments
                {isRefreshing && <Loader className="h-4 w-4 animate-spin" />}
              </CardTitle>
              <CardDescription>
                Discussion about this incident
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isRefreshing && localComments.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin mr-2" />
              <span className="text-gray-600">Loading comments...</span>
            </div>
          ) : localComments && localComments.length > 0 ? (
            <div className="space-y-4">
              {localComments.map((comment) => (
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
