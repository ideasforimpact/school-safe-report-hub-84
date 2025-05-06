
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AssessmentTemplate, AssessmentStatus } from '@/types/assessmentTypes';
import { useAuth } from '@/contexts/auth/AuthContext';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (template: Omit<AssessmentTemplate, 'id' | 'createdAt' | 'updatedAt'>, userIds: string[], dueDate?: Date) => void;
}

const NewTemplateDialog = ({ open, onClose, onSave }: NewTemplateDialogProps) => {
  const { users } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<AssessmentStatus>('draft');
  const [isActive, setIsActive] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);
  
  const resetForm = () => {
    setName('');
    setDescription('');
    setStatus('draft');
    setIsActive(false);
    setSelectedUserIds([]);
    setDueDate(undefined);
    setSearchQuery('');
  };
  
  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Please enter a template name');
      return;
    }
    
    onSave(
      {
        name,
        description,
        status: isActive ? 'active' : status,
        questions: []
      },
      selectedUserIds,
      dueDate
    );
  };
  
  const handleClose = () => {
    resetForm();
    onClose();
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.designation?.toLowerCase().includes(query)
    );
  });

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  
  const handleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(user => user.id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Assessment Template</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Assessment Name*</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Safety Inspection Form"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this assessment"
              rows={3}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="due-date">Due Date (Optional)</Label>
            <DatePicker
              date={dueDate}
              onChange={setDueDate}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={status} 
              onValueChange={(value: AssessmentStatus) => setStatus(value)}
              disabled={isActive}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2 py-2">
            <Checkbox 
              id="active" 
              checked={isActive} 
              onCheckedChange={(checked) => {
                setIsActive(checked as boolean);
                if (checked) {
                  setStatus('active');
                }
              }}
            />
            <Label htmlFor="active">Make this assessment active</Label>
          </div>
          
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="assign-users">Assign to Users (Optional)</Label>
              <Button 
                variant="link" 
                size="sm" 
                onClick={handleSelectAll}
                className="h-auto p-0"
              >
                {selectedUserIds.length === filteredUsers.length ? "Unselect All" : "Select All"}
              </Button>
            </div>
            <Input
              id="user-search"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2"
            />
            <ScrollArea className="h-[150px] border rounded-md p-2">
              {filteredUsers.length > 0 ? (
                <div className="space-y-2">
                  {filteredUsers.map(user => (
                    <div key={user.id} className="flex items-center space-x-2 py-1">
                      <Checkbox 
                        id={`user-${user.id}`}
                        checked={selectedUserIds.includes(user.id)}
                        onCheckedChange={() => toggleUser(user.id)}
                      />
                      <div className="grid gap-0.5">
                        <Label 
                          htmlFor={`user-${user.id}`}
                          className="cursor-pointer"
                        >
                          {user.name}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                          {user.designation && ` • ${user.designation}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No users found
                </div>
              )}
            </ScrollArea>
            <div className="text-sm text-muted-foreground mt-1">
              {selectedUserIds.length} user(s) selected
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Create Assessment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewTemplateDialog;
