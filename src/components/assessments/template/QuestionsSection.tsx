
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileUp } from 'lucide-react';
import { AssessmentQuestion, AssessmentTemplate } from '@/types/assessmentTypes';
import QuestionCard from '@/components/assessments/QuestionCard';
import QuestionForm from '@/components/assessments/QuestionForm';

interface QuestionsSectionProps {
  template: AssessmentTemplate;
  onAddQuestion: (question: Omit<AssessmentQuestion, 'id'>) => void;
  onEditQuestion: (questionId: string) => void;
  onDeleteQuestion: (questionId: string) => void;
}

const QuestionsSection = ({ 
  template, 
  onAddQuestion, 
  onEditQuestion, 
  onDeleteQuestion 
}: QuestionsSectionProps) => {
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  
  const handleAddQuestion = (question: Omit<AssessmentQuestion, 'id'>) => {
    onAddQuestion(question);
    setShowQuestionForm(false);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Questions</CardTitle>
            <CardDescription>
              {template.questions.length} question{template.questions.length !== 1 ? 's' : ''} in this template
            </CardDescription>
          </div>
          <Button 
            onClick={() => setShowQuestionForm(true)}
            disabled={showQuestionForm}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Question
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {template.questions.length === 0 && !showQuestionForm ? (
          <div className="text-center p-8 bg-muted/20 rounded-md">
            <FileUp className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <h3 className="font-medium mb-1">No Questions Added</h3>
            <p className="text-muted-foreground mb-4">
              Add yes/no questions to create your assessment template
            </p>
            <Button onClick={() => setShowQuestionForm(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add First Question
            </Button>
          </div>
        ) : (
          <>
            {/* Question list */}
            {template.questions.map(question => (
              <QuestionCard 
                key={question.id}
                question={question}
                onEdit={onEditQuestion}
                onDelete={onDeleteQuestion}
              />
            ))}
            
            {/* Add question form */}
            {showQuestionForm && (
              <QuestionForm 
                onAddQuestion={handleAddQuestion} 
                onCancel={() => setShowQuestionForm(false)}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionsSection;
