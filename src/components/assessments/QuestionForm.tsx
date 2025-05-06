
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { AssessmentQuestion } from '@/types/assessmentTypes';
import { X, Plus } from 'lucide-react';

interface QuestionFormProps {
  onAddQuestion: (question: Omit<AssessmentQuestion, 'id'>) => void;
  onCancel: () => void;
}

const QuestionForm = ({ onAddQuestion, onCancel }: QuestionFormProps) => {
  const [text, setText] = useState('');
  const [allowAttachment, setAllowAttachment] = useState(false);
  const [required, setRequired] = useState(true);

  const handleSubmit = () => {
    if (!text.trim()) {
      alert('Please enter a question');
      return;
    }
    
    onAddQuestion({
      text,
      type: 'yes_no',
      allowAttachment,
      required
    });
    
    // Reset form
    setText('');
    setAllowAttachment(false);
    setRequired(true);
  };

  return (
    <Card className="mt-4 border-dashed border-blue-200">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="question-text">Question Text</Label>
            <Input
              id="question-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter the yes/no question"
              className="mt-1"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allow-attachment">Allow Attachment</Label>
              <p className="text-sm text-muted-foreground">
                Enable users to attach files with their answer
              </p>
            </div>
            <Switch
              id="allow-attachment"
              checked={allowAttachment}
              onCheckedChange={setAllowAttachment}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="required">Required Question</Label>
              <p className="text-sm text-muted-foreground">
                Make this question mandatory
              </p>
            </div>
            <Switch
              id="required"
              checked={required}
              onCheckedChange={setRequired}
            />
          </div>
          
          <div className="flex items-center justify-end space-x-2">
            <Button variant="outline" onClick={onCancel} size="sm">
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button onClick={handleSubmit} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Question
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionForm;
