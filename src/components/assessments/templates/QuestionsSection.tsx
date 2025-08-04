
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import QuestionEditor from './QuestionEditor';
import { AssessmentQuestion } from '@/types/assessment';

interface QuestionsSectionProps {
  questions: AssessmentQuestion[];
  onAddQuestion: () => void;
  onUpdateQuestion: (index: number, question: AssessmentQuestion) => void;
  onRemoveQuestion: (index: number) => void;
  assessmentName?: string;
  clientId?: string;
  employeeId?: string;
}

const QuestionsSection: React.FC<QuestionsSectionProps> = ({
  questions,
  onAddQuestion,
  onUpdateQuestion,
  onRemoveQuestion,
  assessmentName,
  clientId,
  employeeId
}) => {
  return (
    <div className="border-t border-gray-200 pt-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Questions (Yes/No)</h3>
      </div>
      
      {questions.length === 0 ? (
        <Card className="bg-gray-50">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <p className="text-gray-500 text-center">No questions added yet.</p>
            <Button 
              type="button" 
              onClick={onAddQuestion} 
              variant="secondary"
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <QuestionEditor
              key={question.id || index}
              question={question}
              index={index}
              onChange={updatedQuestion => onUpdateQuestion(index, updatedQuestion)}
              onRemove={() => onRemoveQuestion(index)}
              assessmentName={assessmentName}
              clientId={clientId}
              employeeId={employeeId}
            />
          ))}
          <Button 
            type="button" 
            onClick={onAddQuestion}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuestionsSection;
