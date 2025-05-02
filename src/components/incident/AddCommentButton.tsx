
import React from 'react';
import { Comment as IncidentComment } from '@/types/incident';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import CommentForm from './CommentForm';

interface AddCommentButtonProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  users: { id: string; name: string }[];
  userId: string;
  userName: string;
  incidentId: string;
  onAddComment: (incidentId: string, commentData: Omit<IncidentComment, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const AddCommentButton: React.FC<AddCommentButtonProps> = ({
  isOpen,
  setIsOpen,
  users,
  userId,
  userName,
  incidentId,
  onAddComment
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
          onAddComment(incidentId, commentData);
          setIsOpen(false);
        }}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title="Add Comment"
        submitLabel="Add Comment"
      />
    </Dialog>
  );
};

export default AddCommentButton;
