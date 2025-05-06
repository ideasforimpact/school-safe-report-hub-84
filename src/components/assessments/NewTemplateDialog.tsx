
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AssessmentTemplate, AssessmentStatus } from '@/types/assessmentTypes';
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
  onSave: (template: Omit<AssessmentTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const NewTemplateDialog = ({ open, onClose, onSave }: NewTemplateDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<AssessmentStatus>('draft');
  
  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Please enter a template name');
      return;
    }
    
    onSave({
      name,
      description,
      status,
      questions: []
    });
    
    resetForm();
  };
  
  const resetForm = () => {
    setName('');
    setDescription('');
    setStatus('draft');
  };
  
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Assessment Template</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Safety Inspection Form"
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
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: AssessmentStatus) => setStatus(value)}>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Create Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewTemplateDialog;
