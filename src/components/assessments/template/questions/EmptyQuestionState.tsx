
import { Button } from '@/components/ui/button';
import { FileUp, Plus } from 'lucide-react';

interface EmptyQuestionStateProps {
  onAddFirstQuestion: () => void;
}

const EmptyQuestionState = ({ onAddFirstQuestion }: EmptyQuestionStateProps) => {
  return (
    <div className="text-center p-8 bg-muted/20 rounded-md">
      <FileUp className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
      <h3 className="font-medium mb-1">No Questions Added</h3>
      <p className="text-muted-foreground mb-4">
        Add yes/no questions to create your assessment template
      </p>
      <Button onClick={onAddFirstQuestion}>
        <Plus className="h-4 w-4 mr-1" /> Add First Question
      </Button>
    </div>
  );
};

export default EmptyQuestionState;
