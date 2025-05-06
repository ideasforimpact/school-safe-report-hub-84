
import React, { useState } from 'react';
import { useAssessment } from '@/contexts/AssessmentContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AssessmentTemplate } from '@/types/assessment';

interface DuplicateTemplateDialogProps {
  template: AssessmentTemplate;
  trigger?: React.ReactNode;
  onDuplicate?: (newTemplateId: string) => void;
}

const DuplicateTemplateDialog: React.FC<DuplicateTemplateDialogProps> = ({
  template,
  trigger,
  onDuplicate
}) => {
  const { createTemplate, addQuestion } = useAssessment();
  
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(`${template.title} (Copy)`);
  
  const handleDuplicate = () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    // Create new template
    const newTemplateId = createTemplate({
      title,
      description: template.description,
      type: template.type,
      questions: []
    });
    
    // Add all questions from the original template
    template.questions.forEach(question => {
      addQuestion(newTemplateId, {
        text: question.text,
        allowComments: question.allowComments,
        allowAttachments: question.allowAttachments,
        required: question.required
      });
    });
    
    toast.success('Template duplicated successfully');
    setOpen(false);
    
    if (onDuplicate) {
      onDuplicate(newTemplateId);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Duplicate</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Duplicate Template</DialogTitle>
          <DialogDescription>
            Create a copy of this template with a new title.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleDuplicate}>
            Duplicate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateTemplateDialog;
