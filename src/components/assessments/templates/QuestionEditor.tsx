
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash } from 'lucide-react';
import { AssessmentQuestion, QuestionFile } from '@/types/assessment';
import QuestionFileUpload from './QuestionFileUpload';

interface PendingFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  status: 'pending';
}

interface QuestionEditorProps {
  question: AssessmentQuestion;
  index: number;
  onChange: (question: AssessmentQuestion) => void;
  onRemove: () => void;
  pendingFiles: PendingFile[];
  onPendingFilesChange: (files: PendingFile[]) => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  index,
  onChange,
  onRemove,
  pendingFiles,
  onPendingFilesChange
}) => {
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...question,
      text: e.target.value
    });
  };

  const handleCheckboxChange = (field: 'allowComments' | 'allowAttachments' | 'required') => {
    onChange({
      ...question,
      [field]: !question[field]
    });
  };

  const handleFilesChange = (files: QuestionFile[]) => {
    onChange({
      ...question,
      files
    });
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-sm text-gray-500 mb-2">Question {index + 1}</h4>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRemove}
            className="text-gray-500 hover:text-red-500 p-1 h-auto"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
        
        <Textarea
          value={question.text}
          onChange={handleTextChange}
          placeholder="Enter yes/no question text"
          className="mb-3"
        />
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={`required-${index}`} 
              checked={question.required}
              onCheckedChange={() => handleCheckboxChange('required')}
            />
            <Label htmlFor={`required-${index}`} className="text-sm">Required question</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={`comments-${index}`} 
              checked={question.allowComments}
              onCheckedChange={() => handleCheckboxChange('allowComments')}
            />
            <Label htmlFor={`comments-${index}`} className="text-sm">Allow comments</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={`attachments-${index}`} 
              checked={question.allowAttachments}
              onCheckedChange={() => handleCheckboxChange('allowAttachments')}
            />
            <Label htmlFor={`attachments-${index}`} className="text-sm">Allow file attachments</Label>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Question Files (Optional)
          </Label>
          <QuestionFileUpload
            questionId={question.id}
            questionNumber={index + 1}
            files={question.files || []}
            pendingFiles={pendingFiles}
            onFilesChange={handleFilesChange}
            onPendingFilesChange={onPendingFilesChange}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionEditor;
