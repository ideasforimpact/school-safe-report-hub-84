
import React, { useState } from 'react';
import { Comment as IncidentComment } from '@/types/incident';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/ImageUpload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [commentForm, setCommentForm] = useState<Omit<IncidentComment, 'id' | 'createdAt' | 'updatedAt'>>(initialCommentForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(commentForm);
  };

  const handleImageChange = (imageBase64: string | undefined) => {
    setCommentForm(prev => ({ ...prev, image: imageBase64 }));
  };

  const handleAssignedUserChange = (userId: string) => {
    const selectedUser = users.find(u => u.id === userId);
    if (selectedUser) {
      setCommentForm(prev => ({
        ...prev,
        assignedTo: { id: selectedUser.id, name: selectedUser.name }
      }));
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {title === "Add Comment" ? "Add a new comment to this incident" : "Edit this comment"}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Image (Optional)
          </label>
          <ImageUpload 
            onImageChange={handleImageChange}
            initialImage={commentForm.image}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="assignedTo" className="text-sm font-medium">
              Assign To
            </label>
            <Select 
              value={commentForm.assignedTo.id} 
              onValueChange={handleAssignedUserChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="dueDate" className="text-sm font-medium">
              Due Date
            </label>
            <Input
              type="date"
              id="dueDate"
              value={commentForm.dueDate ? new Date(commentForm.dueDate).toISOString().split('T')[0] : ''}
              onChange={(e) => setCommentForm(prev => ({ ...prev, dueDate: new Date(e.target.value) }))}
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <Select 
            value={commentForm.status} 
            onValueChange={(value) => {
              setCommentForm(prev => ({ 
                ...prev, 
                status: value as Comment['status'] 
              }));
            }}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
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
