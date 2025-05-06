
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AssessmentQuestion } from '@/types/assessmentTypes';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash, FileText } from 'lucide-react';

interface QuestionCardProps {
  question: AssessmentQuestion;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const QuestionCard = ({ question, onEdit, onDelete }: QuestionCardProps) => {
  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <Checkbox disabled checked={false} className="mr-2" />
              <Checkbox disabled checked className="mr-2" />
              <span className="text-lg font-medium">{question.text}</span>
            </div>
            
            <div className="mt-2 flex flex-wrap gap-2">
              {question.allowAttachment && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Attachments allowed
                </Badge>
              )}
              
              {question.required ? (
                <Badge variant="secondary">Required</Badge>
              ) : (
                <Badge variant="outline">Optional</Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => onEdit(question.id)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(question.id)}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
