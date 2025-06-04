
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
import { Loader2, RefreshCw } from 'lucide-react';
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
  const [localComments, setLocalComments] = useState<IncidentComment[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { users } = useIncidents();

  // Update local comments when props change
  useEffect(() => {
    // Ensure comments is always an array
    const safeComments = Array.isArray(comments) ? comments : [];
    
    if (isInitialLoad) {
      setIsInitialLoad(false);
      setLocalComments(safeComments);
      return;
    }

    // Show a brief loading state when comments update
    if (safeComments.length !== localComments.length) {
      setIsRefreshing(true);
      setTimeout(() => {
        setLocalComments(safeComments);
        setIsRefreshing(false);
      }, 300);
    } else {
      setLocalComments(safeComments);
    }
  }, [comments, localComments.length, isInitialLoad]);

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
        setTimeout(() => setIsRefreshing(false), 500);
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
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    handleCommentAdded();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Comments ({localComments.length})
                {isRefreshing && <Loader2 className="h-4 w-4 animate-spin" />}
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
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-500" />
                <span className="text-gray-600">Loading comments...</span>
              </div>
            </div>
          ) : localComments && localComments.length > 0 ? (
            <div className="space-y-4">
              {localComments.map((comment) => (
                <div key={comment.id} className="relative">
                  {isRefreshing && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-md">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    </div>
                  )}
                  <CommentItem 
                    comment={comment}
                    formatDate={formatDate}
                    formatDateTime={formatDateTime}
                    getCommentStatusColor={getCommentStatusColor}
                    canEdit={canEditComment(comment)}
                    onEdit={openEditComment}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">No comments added yet</p>
              <p className="text-sm text-gray-400">Be the first to add a comment about this incident.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Comment Dialog */}
      {currentComment && (
        <Dialog open={showEditComment} onOpenChange={setShowEditComment}>
          <CommentForm
            users={users || []}
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
