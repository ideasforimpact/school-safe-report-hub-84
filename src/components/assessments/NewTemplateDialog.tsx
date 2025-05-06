
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AssessmentTemplate, AssessmentStatus } from '@/types/assessmentTypes';
import { useAuth } from '@/contexts/auth/AuthContext';
import BasicDetailsSection from './template-form/BasicDetailsSection';
import StatusSettingsSection from './template-form/StatusSettingsSection';
import UserAssignmentSection from './template-form/UserAssignmentSection';

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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Assessment Template</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <BasicDetailsSection 
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            dueDate={dueDate}
            setDueDate={setDueDate}
          />
          
          <StatusSettingsSection 
            status={status}
            setStatus={setStatus}
            isActive={isActive}
            setIsActive={setIsActive}
          />
          
          <UserAssignmentSection 
            users={users}
            selectedUserIds={selectedUserIds}
            setSelectedUserIds={setSelectedUserIds}
          />
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
