
import React, { useState } from 'react';
import { useAssessment } from '@/contexts/AssessmentContext';
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
  const { templates, createTemplate, addQuestion } = useAssessment();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(`${template.title} (Copy)`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDuplicate = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please enter a title');
      return;
    }

    const isDuplicateTitle = templates.some(
      t => t.title.trim().toLowerCase() === trimmedTitle.toLowerCase()
    );
    if (isDuplicateTitle) {
      setError('A template with this name already exists');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);

      // Create new template
      const newTemplateId = await createTemplate({
        title: trimmedTitle,
        description: template.description,
        type: template.type,
        category_id: template.category_id,
        questions: template.questions
      });

      setOpen(false);

      if (onDuplicate) {
        onDuplicate(newTemplateId);
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      setError(error instanceof Error ? error.message : 'Failed to duplicate template');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setTitle(`${template.title} (Copy)`);
          setError(null);
        }
      }}
    >
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
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              className="col-span-3"
              disabled={isSubmitting}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 col-span-4 text-center">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleDuplicate}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Duplicating...' : 'Duplicate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateTemplateDialog;
