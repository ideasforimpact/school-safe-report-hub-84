
import { Button } from '@/components/ui/button';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

interface QuestionsHeaderProps {
  questionsCount: number;
  onAddQuestion: () => void;
  showQuestionForm: boolean;
}

const QuestionsHeader = ({ 
  questionsCount, 
  onAddQuestion, 
  showQuestionForm 
}: QuestionsHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <CardTitle className="text-xl">Questions</CardTitle>
        <CardDescription>
          {questionsCount} question{questionsCount !== 1 ? 's' : ''} in this template
        </CardDescription>
      </div>
      <Button 
        onClick={onAddQuestion}
        disabled={showQuestionForm}
      >
        <Plus className="h-4 w-4 mr-1" /> Add Question
      </Button>
    </div>
  );
};

export default QuestionsHeader;
