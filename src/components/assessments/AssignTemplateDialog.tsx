
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth, User } from '@/contexts/auth/AuthContext';
import { Input } from '@/components/ui/input';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface AssignTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onAssign: (userIds: string[], dueDate?: Date) => void;
  templateName: string;
}

const AssignTemplateDialog = ({ open, onClose, onAssign, templateName }: AssignTemplateDialogProps) => {
  const { users } = useAuth();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Reset selections when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedUserIds([]);
      setDueDate(undefined);
      setSearchQuery('');
    }
  }, [open]);
  
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

  const handleSubmit = () => {
    if (selectedUserIds.length === 0) {
      alert('Please select at least one user');
      return;
    }
    
    onAssign(selectedUserIds, dueDate);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Assign "{templateName}" Template</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <Label htmlFor="due-date" className="mb-2 block">Due Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="due-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Select due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="user-search">Select Users</Label>
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
          </div>
          
          <ScrollArea className="h-[200px] border rounded-md p-2">
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
          
          <div className="mt-2 text-sm text-muted-foreground">
            {selectedUserIds.length} user(s) selected
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={selectedUserIds.length === 0}>
            Assign to {selectedUserIds.length} User{selectedUserIds.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignTemplateDialog;
